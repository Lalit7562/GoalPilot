import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Alert, 
  TextInput, 
  ScrollView, 
  Keyboard, 
  Animated,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants';
import { fetchAllGoals, googleLogin, requestOtp, verifyOtp } from '../redux/slices/goalSlice';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const otpInputRef = useRef(null);
  
  // Animation States
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(1)).current;

  // Form States
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('google'); 
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Initial Entrance
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Sync LayoutAnimation with Keyboard
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 0.6, duration: 250, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false);
      Animated.parallel([
        Animated.timing(logoScale, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // OTP Timer
  useEffect(() => {
    let interval;
    if (loginMethod === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loginMethod, timer]);

  // Handle Focus
  useEffect(() => {
    if (loginMethod === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 400);
    }
  }, [loginMethod]);

  // Auto-trigger OTP verification
  useEffect(() => {
    if (otp.length === 6 && loginMethod === 'otp') {
      handleOtpVerify();
    }
  }, [otp]);

  // Auth Handlers
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '791202488858-77e361ji7isrir520mp47gqpd13vqdhe.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    useProxy: true,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = response.params?.id_token || authentication?.idToken;
      const accessToken = authentication?.accessToken;
      if (idToken || accessToken) handleGoogleAuthSuccess(idToken, accessToken);
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (idToken, accessToken) => {
    setLoading(true);
    try {
      await dispatch(googleLogin({ idToken, accessToken })).unwrap();
      const resultAction = await dispatch(fetchAllGoals());
      navigation.replace(resultAction.payload?.length > 0 ? 'MainTabs' : 'GoalSetup');
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => request ? promptAsync({ useProxy: true }) : Alert.alert("Error", "Auth Not Ready");

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) return Alert.alert("Invalid Number", "Enter 10 digits");
    setLoading(true);
    try {
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await dispatch(requestOtp(fullNumber)).unwrap();
      setLoginMethod('otp');
      setTimer(30);
      setCanResend(false);
    } catch (error) {
      Alert.alert("OTP Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otp || otp.length < 6) return Alert.alert("Invalid OTP", "Enter 6 digits");
    setLoading(true);
    try {
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await dispatch(verifyOtp({ phoneNumber: fullNumber, otp })).unwrap();
      const resultAction = await dispatch(fetchAllGoals());
      navigation.replace(resultAction.payload?.length > 0 ? 'MainTabs' : 'GoalSetup');
    } catch (error) {
      Alert.alert("Verification Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo Section - Smoothly collapses via LayoutAnimation and Animated */}
          {!isKeyboardVisible && (
            <Animated.View style={[
              styles.logoSection,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] }
            ]}>
              <View style={styles.logoCircle}>
                <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
              </View>
              <Text style={styles.brandTitle}>GoalPilot</Text>
            </Animated.View>
          )}

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={styles.formContent}>
              <Text style={styles.welcomeText}>Hello Pilot</Text>
              <Text style={styles.subtitle}>Sign in to start your mission</Text>

              {loginMethod === 'google' ? (
                <View style={styles.methodContainer}>
                  <TouchableOpacity style={styles.googleButton} onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleGoogleLogin();
                  }} disabled={loading}>
                    {loading ? <ActivityIndicator color={theme.colors.text} /> : (
                      <View style={styles.buttonInner}>
                        <Ionicons name="logo-google" size={24} color={theme.colors.text} />
                        <Text style={styles.googleButtonText}>Continue with Google</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.googleButton, styles.primaryButton]} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLoginMethod('phone');
                    }}
                  >
                    <View style={styles.buttonInner}>
                      <Ionicons name="phone-portrait-outline" size={24} color="#FFF" />
                      <Text style={[styles.googleButtonText, { color: '#FFF' }]}>Login with Phone</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : loginMethod === 'phone' ? (
                <View style={styles.phoneSection}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <View style={styles.verticalDivider} />
                    <TextInput 
                      style={styles.textInput}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      maxLength={10}
                      autoFocus
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.googleButton, styles.primaryButton, { marginTop: 20 }]} 
                    onPress={handlePhoneSubmit}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.googleButtonText, { color: '#FFF' }]}>Get OTP</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLoginMethod('google')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Back to Google</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.otpSection}>
                  <Text style={styles.otpLabel}>Verification code sent to {'\n'}
                    <Text style={{ fontWeight: '800', color: theme.colors.primary }}>+91 {phoneNumber}</Text>
                  </Text>
                  
                  <View style={styles.otpGrid}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[
                          styles.otpBox,
                          otp.length === index && styles.otpBoxActive,
                          otp.length > index && styles.otpBoxFilled
                        ]}
                        onPress={() => otpInputRef.current?.focus()}
                      >
                        <Text style={[styles.otpDigit, otp.length > index && { color: theme.colors.primary }]}>{otp[index] || ''}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput 
                    ref={otpInputRef}
                    style={styles.hiddenInput}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                  />

                  <View style={styles.timerRow}>
                    {canResend ? (
                      <TouchableOpacity onPress={handlePhoneSubmit}>
                        <Text style={styles.resendText}>Resend OTP</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.timerText}>Resend available in {timer}s</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.googleButton, styles.primaryButton, { marginTop: 20 }]} 
                    onPress={handleOtpVerify}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.googleButtonText, { color: '#FFF' }]}>Verify Mission</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setLoginMethod('phone')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Wrong Number?</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>Trusted by 10k+ Pilots</Text>
                <View style={styles.line} />
              </View>
            </View>
          </Animated.View>

          {!isKeyboardVisible && (
            <View style={styles.footerContainer}>
              <TouchableOpacity style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? <Text style={styles.footerLink}>Join the Crew</Text></Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollContent: {
    flexGrow: 1,
    padding: 30,
  },
  logoSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  logoCircle: {
    width: 130,
    height: 130,
    backgroundColor: theme.colors.white,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.deep,
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.1)',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '950',
    color: theme.colors.text,
    marginTop: 15,
    letterSpacing: -1,
  },
  formContainer: {
    flex: 1,
  },
  formContent: {
    width: '100%',
  },
  welcomeText: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: theme.colors.text, 
    marginBottom: 6,
    letterSpacing: -1,
  },
  subtitle: { 
    fontSize: 15, 
    color: theme.colors.textSecondary, 
    marginBottom: 30,
    fontWeight: '500',
  },
  methodContainer: {
    gap: 15,
  },
  googleButton: {
    backgroundColor: theme.colors.white,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...theme.shadows.medium,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: 'transparent',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleButtonText: { 
    color: theme.colors.text, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dividerText: {
    marginHorizontal: 15,
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footerContainer: {
    marginTop: 40,
    paddingBottom: 20,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '900',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    height: 60,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  verticalDivider: {
    width: 1,
    height: 25,
    backgroundColor: theme.colors.border,
    marginHorizontal: 15,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  otpLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 25,
    textAlign: 'center',
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  otpBoxActive: {
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.1 }],
  },
  otpBoxFilled: {
    borderColor: theme.colors.primary + '40',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  resendText: {
    color: theme.colors.primary,
    fontWeight: '800',
    textDecorationLine: 'underline',
  }
});

export default LoginScreen;
