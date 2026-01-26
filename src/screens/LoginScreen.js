import React from 'react';
import { useDispatch } from 'react-redux';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { theme } from '../constants';
import { fetchAllGoals, googleLogin, requestOtp, verifyOtp } from '../redux/slices/goalSlice';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const otpInputRef = React.useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [loginMethod, setLoginMethod] = React.useState('google'); // 'google', 'phone', 'otp'
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [timer, setTimer] = React.useState(30);
  const [canResend, setCanResend] = React.useState(false);

  // OTP Timer Logic
  React.useEffect(() => {
    let interval;
    if (loginMethod === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loginMethod, timer]);

  // Google OAuth Hook
  // Use dynamic redirect generation for Expo Proxy
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: true,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '791202488858-77e361ji7isrir520mp47gqpd13vqdhe.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
    useProxy: true,
  });

  React.useEffect(() => {
    console.log("👉 [DEBUG] Redirect URI:", redirectUri);
    if (response) {
      console.log("🔍 [DEBUG] RAW Auth Response:", JSON.stringify(response, null, 2));
    }
    
    if (response?.type === 'error') {
       const errorDetails = response.error?.message || response.params?.error_description || "Unknown error";
       console.error("🔍 [DEBUG] Auth Error Details:", JSON.stringify(response.error || response.params, null, 2));
       Alert.alert(
         "Google Auth Error", 
         `Error: ${errorDetails}\n\nTroubleshooting:\n1. Ensure you are logged into Expo CLI (run 'npx expo login')\n2. Add the Redirect URI below to Google Cloud Console.\n3. Native Client IDs are recommended for mobile.`
       );
    }
    
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = response.params?.id_token || authentication?.idToken;
      const accessToken = authentication?.accessToken;
      
      console.log("🔍 [DEBUG] Tokens extracted:", { idToken: !!idToken, accessToken: !!accessToken });

      if (idToken) {
        handleGoogleAuthSuccess(idToken, null);
      } else if (accessToken) {
        // Fallback for mobile if idToken is missing
        console.log("⚠️ [DEBUG] No ID Token, using Access Token fallback.");
        handleGoogleAuthSuccess(null, accessToken);
      } else {
        Alert.alert("Login Error", "No authentication tokens received. Please try again.");
      }
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (idToken, accessToken) => {
    setLoading(true);
    try {
      // Send either idToken or accessToken to the backend
      await dispatch(googleLogin({ idToken, accessToken })).unwrap();
      
      const resultAction = await dispatch(fetchAllGoals());
      const goals = resultAction.payload;
      
      if (goals && goals.length > 0) {
        navigation.replace('MainTabs'); 
      } else {
        navigation.replace('GoalSetup');
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorData = error.message; 
      // Log headers/status if available
      Alert.alert("Login Failed", `Status: ${error.status || 'N/A'}\nMessage: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Safety check for Web Client ID requirements
    if (!redirectUri.startsWith('https://')) {
      Alert.alert(
        "Invalid Redirect URI",
        `Google requires an HTTPS redirect for Web Client IDs.\n\nCurrent: ${redirectUri}\n\nTry signing into Expo CLI or publishing your project to use the Expo Proxy URL.`
      );
      return;
    }

    if (request) {
      // Explicitly tell promptAsync to use the proxy
      promptAsync({ 
        useProxy: true,
        showInRecents: true 
      });
    } else {
      Alert.alert("Error", "Google Auth Request not initialized.");
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid Number", "Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      // Add +91 prefix automatically
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await dispatch(requestOtp(fullNumber)).unwrap();
      setLoginMethod('otp');
      setTimer(30);
      setCanResend(false);
      if (result.devOtp) {
        console.log("🛠️ Dev OTP:", result.devOtp);
      }
    } catch (error) {
      Alert.alert("OTP Request Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    if (canResend) {
      handlePhoneSubmit();
    }
  };

  const handleOtpVerify = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await dispatch(verifyOtp({ phoneNumber: fullNumber, otp })).unwrap();
      const resultAction = await dispatch(fetchAllGoals());
      const goals = resultAction.payload;
      
      if (goals && goals.length > 0) {
        navigation.replace('MainTabs'); 
      } else {
        navigation.replace('GoalSetup');
      }
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
        style={styles.innerContainer}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo} 
            />
          </View>
          <Text style={styles.brandTitle}>GoalPilot</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.welcomeText}>Hello Pilot</Text>
          <Text style={styles.subtitle}>Sign in to start your flight mission</Text>
          
          {loginMethod === 'google' ? (
            <>
              <TouchableOpacity 
                style={styles.googleButton} 
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text} />
                ) : (
                  <View style={styles.buttonInner}>
                    <Ionicons name="logo-google" size={24} color={theme.colors.text} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.googleButton, { marginTop: 15, backgroundColor: theme.colors.primary }]} 
                onPress={() => setLoginMethod('phone')}
                activeOpacity={0.8}
              >
                <View style={styles.buttonInner}>
                  <Ionicons name="phone-portrait-outline" size={24} color="#FFF" />
                  <Text style={[styles.googleButtonText, { color: '#FFF' }]}>Login with Phone</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : loginMethod === 'phone' ? (
            <View style={styles.phoneInputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.countryCode}>+91</Text>
                <View style={styles.verticalDivider} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Phone Number"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  maxLength={10}
                  autoFocus
                />
              </View>
              
              <TouchableOpacity 
                style={[styles.googleButton, { backgroundColor: theme.colors.primary, marginTop: 20 }]} 
                onPress={handlePhoneSubmit}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.googleButtonText, { color: '#FFF' }]}>Get OTP</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setLoginMethod('google')} style={styles.backButton}>
                 <Text style={styles.backButtonText}>Back to Google Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.phoneInputContainer}>
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
                    <Text style={[styles.otpDigit, otp.length > index && { color: theme.colors.primary }]}>
                      {otp[index] || ''}
                    </Text>
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
                autoFocus
              />

              <View style={styles.timerRow}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>Resend available in {timer}s</Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={[styles.googleButton, { backgroundColor: theme.colors.primary, marginTop: 20 }]} 
                onPress={handleOtpVerify}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={[styles.googleButtonText, { color: '#FFF' }]}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setLoginMethod('phone')} style={styles.backButton}>
                 <Text style={styles.backButtonText}>Wrong Number? Change</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider}>
             <View style={styles.line} />
             <Text style={styles.dividerText}>Trusted by 10k+ Pilots</Text>
             <View style={styles.line} />
          </View>
        </View>

        <TouchableOpacity style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? <Text style={styles.footerLink}>Join the Crew</Text></Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  innerContainer: { 
    flex: 1, 
    padding: 30,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: theme.colors.white,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginTop: 15,
    letterSpacing: -0.5,
  },
  formSection: {
    marginBottom: 40,
  },
  welcomeText: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: theme.colors.text, 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: theme.colors.textSecondary, 
    marginBottom: 40 
  },
  googleButton: {
    backgroundColor: theme.colors.white,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
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
    marginVertical: 40,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 15,
    color: theme.colors.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  phoneInputContainer: {
    marginTop: 0,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 55,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
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
    lineHeight: 24,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    paddingLeft: 5,
  },
  verticalDivider: {
    width: 1,
    height: 25,
    backgroundColor: theme.colors.border,
    marginHorizontal: 15,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpBox: {
    width: (Dimensions.get('window').width - 110) / 6,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  otpBoxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
    transform: [{ scale: 1.05 }],
  },
  otpBoxFilled: {
    borderColor: theme.colors.primary + '50',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  resendText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});

export default LoginScreen;
