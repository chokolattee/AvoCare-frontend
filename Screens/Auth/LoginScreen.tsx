import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Modal, Pressable,
  Alert, Dimensions, ScrollView, Platform, StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Yup from 'yup';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { API_BASE_URL } from '../../config/api';
import { signInWithGoogle, signInWithGoogleCredential } from '../../Firebase/auth';
import { styles, GREEN_DARK } from '../../Styles/AuthScreen.styles';

// Required for expo-auth-session to complete the browser redirect on mobile
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID     || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

const API_URL = `${API_BASE_URL}/api/users/`;
const avocadoLogo = require('../../assets/avocado.png');

type RootStackParamList = {
  MainTabs: { screen?: string } | undefined;
  Admin: undefined;
  LoginScreen: { emailVerified?: boolean; message?: string } | undefined;
  RegisterScreen: undefined;
  Profile: { initialTab?: 'personal' | 'address' | 'security' } | undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoginScreen'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'LoginScreen'>;

const loginSchema = Yup.object().shape({
  email:    Yup.string().email('Please enter a valid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

interface ValidationErrors { [key: string]: string; }

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const route      = useRoute<LoginScreenRouteProp>();

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const isWide = screenWidth >= 640;

  // expo-auth-session Google hook – used on iOS/Android only.
  // useIdTokenAuthRequest requests response_type=id_token so we get the
  // id_token directly in googleResponse.params.id_token without a code-exchange step.
  // Use expo-auth-session/providers/google for both web and mobile
  const [_googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    clientId:        GOOGLE_WEB_CLIENT_ID     || undefined,
    webClientId:     GOOGLE_WEB_CLIENT_ID     || undefined,
  });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (route.params?.emailVerified && route.params?.message) {
      setSuccessMessage(route.params.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [route.params]);

  // Handle native Google OAuth response (iOS / Android)
  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const idToken = googleResponse.params?.id_token;
      if (idToken) {
        processNativeGoogleSignIn(idToken);
      } else {
        setError('Google sign-in failed: no id_token returned.');
        setLoading(false);
      }
    } else if (googleResponse.type === 'error') {
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
    } else if (googleResponse.type === 'dismiss' || googleResponse.type === 'cancel') {
      setLoading(false);
    }
  }, [googleResponse]);

  const processNativeGoogleSignIn = async (idToken: string) => {
    try {
      const firebaseUser = await signInWithGoogleCredential(idToken);
      if (!firebaseUser) { setError('Google sign-in failed. Please try again.'); return; }
      const firebaseIdToken = await firebaseUser.getIdToken();
      const response = await axios.post(`${API_URL}login`, {
        email: firebaseUser.email,
        firebase_uid: firebaseUser.uid,
        id_token: firebaseIdToken,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photo_url: firebaseUser.photoURL || '',
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } });

      if (response.data.success && response.data.token) {
        await storeAuthData(response.data.user, response.data.token);
        navigateAfterLogin(response.data.user);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    setValidationErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
  };

  const storeAuthData = async (userData: any, token: string) => {
    await AsyncStorage.multiSet([
      ['token', token], ['jwt', token],
      ['user', JSON.stringify(userData)],
      ['userId', userData.id],
      ['username', userData.name],
    ]);
  };

  const navigateToHome = () =>
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }] }));

  const handleAddressModalLater = () => {
    setShowAddressModal(false);
    navigateToHome();
  };

  const handleGoToAddress = () => {
    setShowAddressModal(false);
    navigateToHome();
    setTimeout(() => (navigation as any).navigate('Profile', { initialTab: 'address' }), 350);
  };

  const navigateAfterLogin = (userData: any) => {
    if (userData.role === 'admin') {
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Admin' }] }));
      setTimeout(() => Alert.alert('Success', `Welcome back, Admin ${userData.name}!`), 300);
    } else if (!userData.address_set && Platform.OS === 'web') {
      // Web: show custom modal overlay before navigating
      setPendingUser(userData);
      setShowAddressModal(true);
    } else {
      navigateToHome();
      setTimeout(() => Alert.alert('Success', `Welcome back, ${userData.name}!`), 300);
      if (!userData.address_set) {
        // Native: fall back to Alert
        setTimeout(() => {
          Alert.alert(
            '📍 Add Your Delivery Address',
            "You haven't added a delivery address yet. Add it now to enable checkout.",
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Add Address', onPress: () => (navigation as any).navigate('Profile', { initialTab: 'address' }) },
            ]
          );
        }, 1200);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    // On native (iOS/Android) use expo-auth-session; result handled in useEffect above
    if (Platform.OS !== 'web') {
      await promptGoogleAsync();
      return;
    }

    // Web: use Firebase popup (browser environment)
    try {
      const firebaseUser = await signInWithGoogle();
      if (!firebaseUser) { setError('Google sign-in was cancelled'); setLoading(false); return; }
      const idToken = await firebaseUser.getIdToken();
      const response = await axios.post(`${API_URL}login`, {
        email: firebaseUser.email,
        firebase_uid: firebaseUser.uid,
        id_token: idToken,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photo_url: firebaseUser.photoURL || '',
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } });

      if (response.data.success && response.data.token) {
        await storeAuthData(response.data.user, response.data.token);
        navigateAfterLogin(response.data.user);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(''); setSuccessMessage(''); setValidationErrors({});
    try {
      await loginSchema.validate({ email, password }, { abortEarly: false });
      setLoading(true);

      const response = await axios.post(`${API_URL}login`, {
        email: email.toLowerCase().trim(), password,
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } });

      if (response.data.success && response.data.token) {
        await storeAuthData(response.data.user, response.data.token);
        navigateAfterLogin(response.data.user);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        const errs: ValidationErrors = {};
        err.inner.forEach((e: any) => { if (e.path) errs[e.path] = e.message; });
        setValidationErrors(errs);
        return;
      }
      let msg = 'Login failed. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
        if (err.response?.data?.needs_verification) {
          Alert.alert('Email Not Verified', 'Please verify your email before logging in.', [
            { text: 'OK' },
            { text: 'Resend Email', onPress: () => handleResendVerification(email) },
          ]);
          setLoading(false);
          return;
        }
      } else if (err.code === 'ERR_NETWORK') {
        msg = 'Cannot connect to server. Please check your connection.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (emailAddr: string) => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}resend-verification`, { email: emailAddr.toLowerCase().trim() }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } });
      Alert.alert(res.data.success ? 'Success' : 'Error', res.data.message || (res.data.success ? 'Verification email sent!' : 'Failed to send verification email.'));
    } catch { Alert.alert('Error', 'Failed to send verification email. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={true} animationType="fade" transparent={true}>
      <Pressable style={styles.modalBackground} onPress={() => navigation.goBack()}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>

          {/* ── Left Green Panel (hidden on narrow screens) ── */}
          {isWide && (
            <View style={styles.leftPanel}>
              <View style={styles.leftLogoCircle}>
                <Image source={avocadoLogo} style={styles.leftLogo} resizeMode="contain" />
              </View>
              <Text style={styles.leftWelcome}>Welcome to</Text>
              <Text style={styles.leftAppName}>AvoCare</Text>
              <Text style={styles.leftTagline}>Your avocado wellness companion</Text>

              <Text style={styles.leftSwitchLabel}>Don't have an account?</Text>
              <TouchableOpacity
                style={styles.leftSwitchBtn}
                onPress={() => { navigation.goBack(); (navigation as any).navigate('RegisterScreen'); }}
                disabled={loading}
              >
                <Text style={styles.leftSwitchBtnText}>SIGN UP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Right Form Panel ── */}
          <View style={styles.rightPanel}>
            <KeyboardAwareScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.formTitle}>Sign In</Text>
              <Text style={styles.formSubtitle}>Welcome back — let's get you in</Text>

              {/* Success banner */}
              {!!successMessage && (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={{ marginRight: 8 }} />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              )}

              {/* Error banner */}
              {!!error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#e05252" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, validationErrors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor="#aac5a6"
                  value={email}
                  onChangeText={t => { setEmail(t); clearFieldError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
                {!!validationErrors.email && <Text style={styles.errorTextSmall}>{validationErrors.email}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[styles.input, validationErrors.password && styles.inputError, { paddingRight: 44 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#aac5a6"
                    value={password}
                    onChangeText={t => { setPassword(t); clearFieldError('password'); }}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
                    onPress={() => setShowPassword(v => !v)}
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#aac5a6" />
                  </TouchableOpacity>
                </View>
                {!!validationErrors.password && <Text style={styles.errorTextSmall}>{validationErrors.password}</Text>}
              </View>

              {/* Submit */}
              <TouchableOpacity style={[styles.submitButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Sign In</Text>}
              </TouchableOpacity>

              {/* OR + Google – web only */}
              {Platform.OS === 'web' && (
                <>
                  <View style={styles.orDivider}>
                    <View style={styles.orDividerLine} />
                    <Text style={styles.orDividerText}>OR</Text>
                    <View style={styles.orDividerLine} />
                  </View>

                  <TouchableOpacity style={[styles.googleButton, loading && styles.buttonDisabled]} onPress={handleGoogleSignIn} disabled={loading}>
                    <Ionicons name="logo-google" size={18} color="#4285F4" style={{ marginRight: 8 }} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Mobile switch */}
              {!isWide && (
                <View style={styles.mobileSwitch}>
                  <Text style={styles.mobileSwitchLabel}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => { navigation.goBack(); (navigation as any).navigate('RegisterScreen'); }} disabled={loading}>
                    <Text style={styles.mobileSwitchBtn}> Sign Up</Text>
                  </TouchableOpacity>
                </View>
              )}

            </KeyboardAwareScrollView>
          </View>

        </Pressable>
      </Pressable>

      {/* ── Address Prompt Overlay (web only) ── */}
      {showAddressModal && (
        <View style={addrStyles.overlay}>
          <View style={addrStyles.card}>
            {/* Icon */}
            <View style={addrStyles.iconCircle}>
              <Ionicons name="location" size={34} color="#fff" />
            </View>

            {/* Text */}
            <Text style={addrStyles.title}>Set Your Delivery Address</Text>
            <Text style={addrStyles.subtitle}>
              {`Welcome back${pendingUser?.name ? `, ${pendingUser.name}` : ''}!\n`}
              {`You haven\u2019t added a delivery address yet.\n`}
              {'Add one now to enable checkout.'}
            </Text>

            {/* Buttons */}
            <TouchableOpacity style={addrStyles.primaryBtn} onPress={handleGoToAddress}>
              <Ionicons name="location-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={addrStyles.primaryBtnText}>Add Address</Text>
            </TouchableOpacity>
            <TouchableOpacity style={addrStyles.secondaryBtn} onPress={handleAddressModalLater}>
              <Text style={addrStyles.secondaryBtnText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );
};

const addrStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3a7d44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a3a1f',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7c6e',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a7d44',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#c8ddc9',
  },
  secondaryBtnText: {
    color: '#6b7c6e',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default LoginScreen;