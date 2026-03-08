import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Modal, Pressable,
  Alert, Dimensions,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import * as Yup from 'yup';
import { API_BASE_URL } from '../../config/api';
import { createUserWithEmail } from '../../Firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../../Styles/AuthScreen.styles';

const API_URL = `${API_BASE_URL}/api/users/`;
const avocadoLogo = require('../../assets/avocado.png');

type RootStackParamList = {
  MainTabs: { screen?: string } | undefined;
  Admin: undefined;
  LoginScreen: { emailVerified?: boolean; message?: string } | undefined;
  RegisterScreen: undefined;
  Profile: { initialTab?: 'personal' | 'address' | 'security' } | undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterScreen'>;

const registerSchema = Yup.object().shape({
  email:           Yup.string().email('Please enter a valid email address').required('Email is required'),
  password:        Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
});

interface ValidationErrors { [key: string]: string; }

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [screenWidth, setScreenWidth]           = useState(Dimensions.get('window').width);

  const isWide = screenWidth >= 640;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenWidth(window.width));
    return () => sub?.remove();
  }, []);

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

  const handleRegister = async () => {
    setError(''); setValidationErrors({});

    if (!termsAccepted) {
      setError('Please accept the Terms of Service to continue.');
      return;
    }

    try {
      await registerSchema.validate({ email, password, confirmPassword }, { abortEarly: false });
      setLoading(true);

      const firebaseUser = await createUserWithEmail(email, password);
      if (!firebaseUser) { setError('Registration failed. Please try again.'); return; }

      const response = await axios.post(`${API_URL}register`, {
        email: email.toLowerCase().trim(),
        password,
        firebase_uid: firebaseUser.uid,
        auth_provider: 'email',
        role: 'user',
      }, { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } });

      if (response.data.success) {
        Alert.alert('✅ Account Created!', 'Please check your email to verify your account before logging in.', [{ text: 'OK' }]);
        navigation.goBack();
        (navigation as any).navigate('LoginScreen', { emailVerified: false });
      } else {
        setError(response.data.message || 'Registration failed.');
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        const errs: ValidationErrors = {};
        err.inner.forEach((e: any) => { if (e.path) errs[e.path] = e.message; });
        setValidationErrors(errs);
        return;
      }
      let msg = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={true} animationType="fade" transparent={true}>
      <Pressable style={styles.modalBackground} onPress={() => navigation.goBack()}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>

          {/* ── Left Green Panel ── */}
          {isWide && (
            <View style={styles.leftPanel}>
              <View style={styles.leftLogoCircle}>
                <Image source={avocadoLogo} style={styles.leftLogo} resizeMode="contain" />
              </View>
              <Text style={styles.leftWelcome}>Hello there!</Text>
              <Text style={styles.leftAppName}>Create Your{'\n'}Account</Text>
              <Text style={styles.leftTagline}>Join AvoCare and start your wellness journey</Text>

              <Text style={styles.leftSwitchLabel}>Already have an account?</Text>
              <TouchableOpacity
                style={styles.leftSwitchBtn}
                onPress={() => { navigation.goBack(); (navigation as any).navigate('LoginScreen'); }}
                disabled={loading}
              >
                <Text style={styles.leftSwitchBtnText}>SIGN IN</Text>
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
              <Text style={styles.formTitle}>Sign Up</Text>
              <Text style={styles.formSubtitle}>It's quick, free, and worth it</Text>

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

              {/* Password row — side by side on wide screens */}
              {isWide ? (
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputRowItem]}>
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

                  <View style={[styles.inputGroup, styles.inputRowItem]}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        style={[styles.input, validationErrors.confirmPassword && styles.inputError, { paddingRight: 44 }]}
                        placeholder="••••••••"
                        placeholderTextColor="#aac5a6"
                        value={confirmPassword}
                        onChangeText={t => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
                        onPress={() => setShowConfirmPassword(v => !v)}
                      >
                        <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#aac5a6" />
                      </TouchableOpacity>
                    </View>
                    {!!validationErrors.confirmPassword && <Text style={styles.errorTextSmall}>{validationErrors.confirmPassword}</Text>}
                  </View>
                </View>
              ) : (
                <>
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

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={{ position: 'relative' }}>
                      <TextInput
                        style={[styles.input, validationErrors.confirmPassword && styles.inputError, { paddingRight: 44 }]}
                        placeholder="••••••••"
                        placeholderTextColor="#aac5a6"
                        value={confirmPassword}
                        onChangeText={t => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                        secureTextEntry={!showConfirmPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        style={{ position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' }}
                        onPress={() => setShowConfirmPassword(v => !v)}
                      >
                        <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#aac5a6" />
                      </TouchableOpacity>
                    </View>
                    {!!validationErrors.confirmPassword && <Text style={styles.errorTextSmall}>{validationErrors.confirmPassword}</Text>}
                  </View>
                </>
              )}

              {/* Terms checkbox */}
              <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(v => !v)} activeOpacity={0.8}>
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Ionicons name="checkmark" size={12} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  Creating an account means you're okay with our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>,{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>, and our default notification settings.
                </Text>
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity style={[styles.submitButton, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Sign Up</Text>}
              </TouchableOpacity>

              {/* Mobile switch */}
              {!isWide && (
                <View style={styles.mobileSwitch}>
                  <Text style={styles.mobileSwitchLabel}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => { navigation.goBack(); (navigation as any).navigate('LoginScreen'); }} disabled={loading}>
                    <Text style={styles.mobileSwitchBtn}> Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

            </KeyboardAwareScrollView>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default RegisterScreen;