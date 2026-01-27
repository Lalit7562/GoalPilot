import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  TouchableOpacity, 
  Animated,
  Platform, 
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants';

const slides = [
  {
    id: '1',
    title: 'ELIMINATE THE NOISE',
    subtitle: 'GOAL OVERWHELM SOLVED',
    description: "Most dreams die in the chaos of 'where to start?'. We convert your ambitions into a clear, manageable sequence of daily tactical strikes.",
    image: require('../../assets/images/onboarding_strat_roadmap_1769421010180.png'),
    accent: '#38BDF8',
    hud: 'SCANNING_GOALS // ACTIVE'
  },
  {
    id: '2',
    title: 'PRECISION PLANNING',
    subtitle: 'TACTICAL ARCHITECTURE',
    description: 'Stop wandering. Receive a personalized, daily strategic roadmap that adapts to your pace and ensures you hit every milestone with confidence.',
    image: require('../../assets/images/onboarding_ai_mission_1769421028765.png'),
    accent: '#FBBF24',
    hud: 'PATH_CALCULATED // 100%'
  },
  {
    id: '3',
    title: 'COMMAND YOUR GROWTH',
    subtitle: 'DAILY PROGRESS TRACKING',
    description: 'Visualize your evolution. Track streaks, unlock ranks, and maintain peak momentum with an interface designed for the ultimate goal achiever.',
    image: require('../../assets/images/onboarding_cockpit_stats_1769421050841.png'),
    accent: '#F472B6',
    hud: 'SYSTEMS_OPTIMIZED // ON'
  }
];

// Stabilized Particle Component to avoid re-render flicker
const BackgroundParticles = ({ accent, scrollX, index, width, height, starAnim }) => {
  const particles = useMemo(() => {
    return [...Array(6)].map(() => ({
      top: Math.random() * height,
      left: Math.random() * width,
      speed: 0.1 + Math.random() * 0.4
    }));
  }, [width, height]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => {
        const particleTranslateX = scrollX.interpolate({
          inputRange: [(index - 1) * width, index * width, (index + 1) * width],
          outputRange: [width * p.speed, 0, -width * p.speed],
          extrapolate: 'clamp'
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                top: p.top,
                left: p.left,
                backgroundColor: accent,
                opacity: 0.2,
                transform: [
                  { translateX: particleTranslateX },
                  {
                    translateY: starAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -100 * (i + 1)],
                    })
                  }
                ]
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const OnboardingScreen = ({ navigation }) => {
  const { width, height } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  
  const hudOpacity = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hudOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(hudOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    // Changed to false to avoid driver mismatch when combined with scrollX interpolation
    Animated.loop(
      Animated.timing(starAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: false, 
      })
    ).start();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Login');
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [-width * 0.1, 0, width * 0.1],
    });

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [1.2, 1, 1.2],
    });

    const textTranslateY = scrollX.interpolate({
       inputRange,
       outputRange: [60, 0, -60],
    });

    const textOpacity = scrollX.interpolate({
       inputRange,
       outputRange: [0, 1, 0],
    });

    return (
      <View style={[styles.slide, { width, height }]}>
        <BackgroundParticles 
          accent={item.accent} 
          scrollX={scrollX} 
          index={index} 
          width={width} 
          height={height}
          starAnim={starAnim}
        />

        <View style={[styles.imageContainer, { width, height: height * 0.52 }]}>
          <Animated.Image 
            source={item.image} 
            style={[
              styles.image, 
              { transform: [{ translateX }, { scale }] }
            ]} 
            resizeMode="cover" 
          />
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.4)', '#0F172A']}
            style={styles.imageOverlay}
          />
          
          <Animated.View style={[styles.hudElement, { opacity: hudOpacity, borderColor: item.accent }]}>
             <View style={[styles.hudScanner, { backgroundColor: item.accent + '20' }]} />
             <Text style={[styles.hudText, { color: item.accent }]}>{item.hud}</Text>
          </Animated.View>

          <View style={styles.topHud}>
             <Text style={styles.versionTag}>GP_MISSION_CONTROLLER_v2.5</Text>
             <View style={[styles.hudDivider, { backgroundColor: item.accent + '40' }]} />
          </View>
        </View>
        
        <Animated.View style={[
          styles.textContainer, 
          { 
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }] 
          }
        ]}>
          <View style={styles.glassCard}>
            <View style={styles.labelContainer}>
               <View style={[styles.accentDot, { backgroundColor: item.accent }]} />
               <Text style={[styles.subtitle, { color: item.accent }]}>{item.subtitle}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <SafeAreaView style={styles.footer}>
        <View style={styles.paginator}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp'
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View 
                key={i.toString()} 
                style={[
                  styles.dot, 
                  { 
                    width: dotWidth, 
                    opacity: dotOpacity, 
                    backgroundColor: currentIndex === i ? slides[currentIndex].accent : '#475569' 
                  }
                ]} 
              />
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.mainAction, { width: width - 50 }]} 
          onPress={scrollTo}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[slides[currentIndex].accent, '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? 'INITIALIZE CORE' : 'PROCEED MISSION'}
            </Text>
            <Ionicons 
              name={currentIndex === slides.length - 1 ? 'flash' : 'arrow-forward-outline'} 
              size={20} 
              color="#FFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.skipText}>SKIP_CORE_BREIFING</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  slide: {
    // Removed flex: 1 to avoid conflicts in horizontal FlatList
    justifyContent: 'flex-start'
  },
  particle: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  imageContainer: {
    overflow: 'hidden',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '110%',
    top: '-5%'
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  topHud: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 30,
    right: 30,
  },
  versionTag: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 3
  },
  hudDivider: {
    height: 1,
    marginTop: 8,
    width: '30%'
  },
  hudElement: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    borderWidth: 1,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  hudScanner: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05
  },
  hudText: {
    fontSize: 8,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1
  },
  textContainer: {
    paddingHorizontal: 25,
    marginTop: 20, // Moved card down (previously -40)
    zIndex: 10
  },
  glassCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    ...theme.shadows.medium
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 12,
    letterSpacing: -1,
    lineHeight: 38,
  },
  description: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  paginator: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'center',
    gap: 8
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  mainAction: {
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    ...theme.shadows.deep
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5
  },
  skipBtn: {
    marginTop: 20
  },
  skipText: {
    fontSize: 10,
    color: 'rgba(148, 163, 184, 0.4)',
    fontWeight: '900',
    letterSpacing: 2
  }
});

export default OnboardingScreen;
