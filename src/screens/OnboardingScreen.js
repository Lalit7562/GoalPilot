import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  Animated,
  Platform, 
  ScrollView, 
  SafeAreaView,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'MISSION BLUEPRINT',
    subtitle: '100% STRATEGIC PRECISION',
    description: 'Stop guessing. Start executing. Our AI constructs a day-by-day tactical roadmap tailored to your specific objective.',
    image: require('../../assets/images/onboarding_strat_roadmap_1769421010180.png'),
    accent: '#38BDF8',
    hud: 'RADAR_ACTIVE // 24/7'
  },
  {
    id: '2',
    title: 'TERMINAL AI CORE',
    subtitle: 'REAL-TIME COMMANDER',
    description: 'Direct communication with Gemini-powered neural net. Real-time adjustments and Hinglish motivation to keep you on path.',
    image: require('../../assets/images/onboarding_ai_mission_1769421028765.png'),
    accent: '#FBBF24',
    hud: 'CORE_SYNC // STABLE'
  },
  {
    id: '3',
    title: 'TACTICAL COCKPIT',
    subtitle: 'DATA-DRIVEN DOMINANCE',
    description: 'Analyze every metric. Track streaks, unlock pilot ranks, and visualize your evolution through futuristic analytics.',
    image: require('../../assets/images/onboarding_cockpit_stats_1769421050841.png'),
    accent: '#F472B6',
    hud: 'SYSTEMS_GO // 100%'
  }
];

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  
  // HUD Animation
  const hudOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(hudOpacity, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(hudOpacity, { toValue: 0.4, duration: 1500, useNativeDriver: true })
      ])
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
    
    // Parallax effects
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
       outputRange: [100, 0, -100],
    });

    const textOpacity = scrollX.interpolate({
       inputRange,
       outputRange: [0, 1, 0],
    });

    return (
      <View style={[styles.slide, { width }]}>
        {/* Immersive Parallax Image */}
        <View style={styles.imageContainer}>
          <Animated.Image 
            source={item.image} 
            style={[
              styles.image, 
              { transform: [{ translateX }, { scale }] }
            ]} 
            resizeMode="cover" 
          />
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.4)', 'rgba(15, 23, 42, 0.8)', '#0F172A']}
            style={styles.imageOverlay}
          />
          
          {/* Holographic HUD Overlay */}
          <Animated.View style={[styles.hudElement, { opacity: hudOpacity, borderColor: item.accent }]}>
             <View style={[styles.hudScanner, { backgroundColor: item.accent + '20' }]} />
             <Text style={[styles.hudText, { color: item.accent }]}>{item.hud}</Text>
          </Animated.View>

          <View style={styles.topHud}>
             <Text style={styles.versionTag}>GP_MISSION_CONTROLLER_v2.0</Text>
             <View style={styles.hudDivider} />
          </View>
        </View>
        
        {/* Cinematic Text Entrance */}
        <Animated.View style={[
          styles.textContainer, 
          { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }
        ]}>
          <View style={styles.labelContainer}>
             <View style={[styles.accentDot, { backgroundColor: item.accent }]} />
             <Text style={[styles.subtitle, { color: item.accent }]}>{item.subtitle}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
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

      {/* Futuristic Footer Controls */}
      <View style={styles.footer}>
        <View style={styles.paginator}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 30, 8],
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
                  { width: dotWidth, opacity: dotOpacity, backgroundColor: slides[currentIndex].accent }
                ]} 
              />
            );
          })}
        </View>

        <TouchableOpacity 
          style={styles.mainAction} 
          onPress={scrollTo}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[slides[currentIndex].accent, '#1E293B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {currentIndex === slides.length - 1 ? 'INITIALIZE SYSTEMS' : 'PROCEED MISSION'}
            </Text>
            <Ionicons 
              name={currentIndex === slides.length - 1 ? 'power' : 'chevron-forward'} 
              size={20} 
              color="#FFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.skipText}>ABORT BRIEFING [SKIP]</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  slide: {
    flex: 1,
  },
  imageContainer: {
    flex: 0.65,
    width: width,
    overflow: 'hidden',
    position: 'relative'
  },
  image: {
    width: '100%',
    height: '110%',
    top: -height * 0.05
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  topHud: {
    position: 'absolute',
    top: 60,
    left: 40,
    right: 40,
  },
  versionTag: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2
  },
  hudDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
    width: '40%'
  },
  hudElement: {
    position: 'absolute',
    bottom: 60,
    right: 40,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  hudScanner: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1
  },
  hudText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1
  },
  textContainer: {
    flex: 0.35,
    paddingHorizontal: 40,
    paddingTop: 20
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 40,
    fontWeight: '950',
    color: '#F8FAFC',
    marginBottom: 15,
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  description: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
    fontWeight: '500',
    maxWidth: '90%'
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 40,
    right: 40,
    alignItems: 'center'
  },
  paginator: {
    flexDirection: 'row',
    marginBottom: 30,
    alignItems: 'center',
    gap: 6
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  mainAction: {
    width: '100%',
    height: 64,
    borderRadius: 20,
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
    letterSpacing: 2
  },
  skipBtn: {
    marginTop: 25
  },
  skipText: {
    fontSize: 11,
    color: 'rgba(148, 163, 184, 0.5)',
    fontWeight: '800',
    letterSpacing: 1
  }
});

export default OnboardingScreen;
