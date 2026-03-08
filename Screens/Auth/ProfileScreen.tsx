import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';
import * as Yup from 'yup';
import { API_BASE_URL } from '../../config/api';
const API_URL = `${API_BASE_URL}/api/users/`;

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone_no?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  address_set?: boolean;
}

const personalSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
});

const securitySchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

type ProfileRouteParams = {
  Profile: { initialTab?: 'personal' | 'address' | 'security' } | undefined;
};

const ProfileScreen: React.FC = () => {
  const route = useRoute<RouteProp<ProfileRouteParams, 'Profile'>>();
  const initialTab = route.params?.initialTab ?? 'personal';
  const [user, setUser] = useState<User | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'security'>(initialTab);
  const [loading, setLoading] = useState(false);

  // Personal Info
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);

  // Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [country, setCountry] = useState('Philippines');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigation = useNavigation();

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setName(parsedUser.name);
        setImage(parsedUser.image || null);
        setAddress(parsedUser.address || '');
        setCity(parsedUser.city || '');
        setPostalCode(parsedUser.postal_code || '');
        setPhoneNo(parsedUser.phone_no || '');
        setCountry(parsedUser.country || 'Philippines');
        setLatitude(parsedUser.latitude ?? null);
        setLongitude(parsedUser.longitude ?? null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleUpdatePersonal = async () => {
    setErrors({});
    try {
      await personalSchema.validate({ name }, { abortEarly: false });
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt');
      const formData = new FormData();
      formData.append('name', name.trim());

      if (image && image !== user?.image) {
        let fileName: string;
        let fileType: string;
        if (Platform.OS === 'web' || image.startsWith('blob:')) {
          fileName = `photo_${Date.now()}.jpg`;
          fileType = 'jpg';
        } else {
          const uriParts = image.split('.');
          fileType = uriParts[uriParts.length - 1];
          fileName = `photo_${Date.now()}.${fileType}`;
        }
        const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;
        if (Platform.OS === 'web' || image.startsWith('blob:')) {
          const response = await fetch(image);
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: mimeType });
          formData.append('image', file);
        } else {
          formData.append('image', { uri: image, type: mimeType, name: fileName } as any);
        }
      }

      const response = await fetch(`${API_URL}profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        const validationErrors: { [key: string]: string } = {};
        err.inner.forEach((e: any) => { if (e.path) validationErrors[e.path] = e.message; });
        setErrors(validationErrors);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setErrors({});
    try {
      await securitySchema.validate({ currentPassword, newPassword, confirmPassword }, { abortEarly: false });
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt');
      const formData = new FormData();
      formData.append('current_password', currentPassword);
      formData.append('new_password', newPassword);
      const response = await fetch(`${API_URL}profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setEditModalVisible(false);
        Alert.alert('Success', 'Password updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update password');
      }
    } catch (err: any) {
      if (err.name === 'ValidationError') {
        const validationErrors: { [key: string]: string } = {};
        err.inner.forEach((e: any) => { if (e.path) validationErrors[e.path] = e.message; });
        setErrors(validationErrors);
      } else {
        Alert.alert('Error', 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setActiveTab('personal');
    setErrors({});
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    loadUser();
  };

  const handleUseLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to auto-fill your address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lng } = loc.coords;
      setLatitude(lat);
      setLongitude(lng);
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'AvoCareApp/1.0' } },
      );
      if (nominatimRes.ok) {
        const nominatim = await nominatimRes.json();
        const a = nominatim.address ?? {};
        const streetAddress = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(' ').trim();
        setAddress(streetAddress || address);
        setCity(a.city || a.town || a.village || a.county || city);
        setPostalCode(a.postcode || postalCode);
        setCountry(a.country || country);
      }
      Alert.alert('Location Found', 'Address fields have been filled with your current location.');
    } catch {
      Alert.alert('Error', 'Failed to get location. Please enter your address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    const missing: string[] = [];
    if (!address.trim()) missing.push('Street Address');
    if (!city.trim()) missing.push('City');
    if (!postalCode.trim()) missing.push('Postal Code');
    if (!phoneNo.trim()) missing.push('Phone Number');
    if (!country.trim()) missing.push('Country');
    if (missing.length > 0) { Alert.alert('Incomplete', `Please fill in: ${missing.join(', ')}`); return; }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt');
      const payload: Record<string, any> = {
        address: address.trim(), city: city.trim(), postal_code: postalCode.trim(),
        phone_no: phoneNo.trim(), country: country.trim(),
      };
      if (latitude !== null) payload.latitude = latitude;
      if (longitude !== null) payload.longitude = longitude;
      const response = await axios.put(`${API_URL}profile`, payload, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      });
      const data = response.data;
      if (data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setEditModalVisible(false);
        Alert.alert('Success', 'Address saved successfully.');
      } else {
        Alert.alert('Error', data.message || 'Failed to save address.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="person-outline" size={52} color="#7aad4e" />
        </View>
        <Text style={styles.emptyTitle}>Not logged in</Text>
        <Text style={styles.emptyText}>Sign in to access your profile</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('LoginScreen' as never)}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.rootView}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <View style={styles.centerColumn}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerBg} />
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              {user.image ? (
                <Image source={{ uri: user.image }} style={styles.avatar} />
              ) : (
                <Ionicons name="person" size={52} color="#7aad4e" />
              )}
            </View>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.menuSection}>

          <Text style={styles.menuSectionLabel}>ACCOUNT</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { resetModal(); setEditModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="person-outline" size={20} color="#3d6b22" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#b8d4a4" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { resetModal(); setActiveTab('address'); setEditModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="location-outline" size={20} color="#3d6b22" />
            </View>
            <View style={styles.addressMenuContent}>
              <Text style={styles.menuText}>My Address</Text>
              {user.address_set ? (
                <Text style={styles.addressPreview} numberOfLines={1}>
                  {[user.address, user.city, user.country].filter(Boolean).join(', ')}
                </Text>
              ) : (
                <Text style={styles.addressMissing}>No address set — tap to add</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#b8d4a4" />
          </TouchableOpacity>

          <Text style={[styles.menuSectionLabel, { marginTop: 20 }]}>ACTIVITY</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('History' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrap}>
              <Ionicons name="time-outline" size={20} color="#3d6b22" />
            </View>
            <Text style={styles.menuText}>Order History</Text>
            <Ionicons name="chevron-forward" size={18} color="#b8d4a4" />
          </TouchableOpacity>

          <Text style={[styles.menuSectionLabel, { marginTop: 20 }]}>PREFERENCES</Text>

          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <Ionicons name="settings-outline" size={20} color="#3d6b22" />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#b8d4a4" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.lastItem]} activeOpacity={0.7}>
            <View style={styles.menuIconWrap}>
              <Ionicons name="help-circle-outline" size={20} color="#3d6b22" />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color="#b8d4a4" />
          </TouchableOpacity>

        </View>

        </View>{/* end centerColumn */}
      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setEditModalVisible(false); resetModal(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => { setEditModalVisible(false); resetModal(); }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#3d6b22" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              {(['personal', 'address', 'security'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Ionicons
                    name={tab === 'personal' ? 'person-outline' : tab === 'address' ? 'location-outline' : 'lock-closed-outline'}
                    size={16}
                    color={activeTab === tab ? '#3d6b22' : '#9ab88c'}
                  />
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

              {/* ── Personal Tab ── */}
              {activeTab === 'personal' && (
                <>
                  <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.editImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={34} color="#9ab88c" />
                        <Text style={styles.imagePlaceholderText}>Change Photo</Text>
                      </View>
                    )}
                    <View style={styles.cameraOverlay}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      value={name}
                      onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: '' })); }}
                      placeholder="Enter your name"
                      placeholderTextColor="#a8c48a"
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value={user.email}
                      editable={false}
                    />
                    <Text style={styles.helperText}>Email cannot be changed</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleUpdatePersonal}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* ── Address Tab ── */}
              {activeTab === 'address' && (
                <>
                  <View style={styles.locationBanner}>
                    <Ionicons name="navigate-circle-outline" size={20} color="#3d6b22" />
                    <Text style={styles.locationBannerText}>
                      Tap "Use My Location" to auto-fill your address from GPS.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.locationBtn, locationLoading && styles.buttonDisabled]}
                    onPress={handleUseLocation}
                    disabled={locationLoading}
                    activeOpacity={0.85}
                  >
                    {locationLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="location" size={16} color="#fff" />
                        <Text style={styles.locationBtnText}>Use My Location</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {latitude !== null && longitude !== null && (
                    <View style={styles.coordsRow}>
                      <Ionicons name="pin" size={13} color="#7aad4e" />
                      <Text style={styles.coordsText}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
                    </View>
                  )}

                  {[
                    { label: 'Street Address', value: address, setter: setAddress, placeholder: '123 Main St', keyboardType: 'default' },
                    { label: 'City', value: city, setter: setCity, placeholder: 'Manila', keyboardType: 'default' },
                    { label: 'Postal Code', value: postalCode, setter: setPostalCode, placeholder: '1000', keyboardType: 'numeric' },
                    { label: 'Phone Number', value: phoneNo, setter: setPhoneNo, placeholder: '+63 912 345 6789', keyboardType: 'phone-pad' },
                    { label: 'Country', value: country, setter: setCountry, placeholder: 'Philippines', keyboardType: 'default' },
                  ].map(({ label, value, setter, placeholder, keyboardType }) => (
                    <View style={styles.inputGroup} key={label}>
                      <Text style={styles.inputLabel}>{label}</Text>
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={setter as any}
                        placeholder={placeholder}
                        placeholderTextColor="#a8c48a"
                        keyboardType={keyboardType as any}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleUpdateAddress}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Address</Text>}
                  </TouchableOpacity>
                </>
              )}

              {/* ── Security Tab ── */}
              {activeTab === 'security' && (
                <>
                  <View style={styles.securityInfo}>
                    <Ionicons name="information-circle" size={18} color="#3d6b22" />
                    <Text style={styles.securityInfoText}>
                      Enter your current password to set a new one
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email (for verification)</Text>
                    <TextInput style={[styles.input, styles.inputDisabled]} value={user.email} editable={false} />
                  </View>

                  {[
                    { label: 'Current Password', key: 'currentPassword', value: currentPassword, setter: setCurrentPassword },
                    { label: 'New Password', key: 'newPassword', value: newPassword, setter: setNewPassword },
                    { label: 'Confirm New Password', key: 'confirmPassword', value: confirmPassword, setter: setConfirmPassword },
                  ].map(({ label, key, value, setter }) => (
                    <View style={styles.inputGroup} key={key}>
                      <Text style={styles.inputLabel}>{label}</Text>
                      <TextInput
                        style={[styles.input, errors[key] && styles.inputError]}
                        value={value}
                        onChangeText={(t) => { setter(t); setErrors((p) => ({ ...p, [key]: '' })); }}
                        placeholder={`Enter ${label.toLowerCase()}`}
                        placeholderTextColor="#a8c48a"
                        secureTextEntry
                      />
                      {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Update Password</Text>}
                  </TouchableOpacity>
                </>
              )}

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({

  // ─── Layout ────────────────────────────────────────────────────────────────
  rootView: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? ({
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
        } as any)
      : {}),
  },
  container: {
    flex: 1,
    backgroundColor: '#e8f2de',
    ...(Platform.OS === 'web'
      ? ({
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        } as any)
      : {}),
  },
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === 'web' ? ({ alignItems: 'center' } as any) : {}),
  },
  centerColumn: {
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({ maxWidth: 620, alignSelf: 'center' } as any)
      : {}),
  },

  // ─── Empty State ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f2de',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ddeece',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c8e0b0',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2e4420',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 14,
    color: '#7a9460',
    marginBottom: 24,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#3d6b22',
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 10,
    ...Platform.select({
      ios: { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ─── Profile Header ────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingTop: 0,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({ borderRadius: 0, overflow: 'hidden' } as any)
      : {}),
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: '#ddeece',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e0b0',
  },
  avatarWrapper: {
    marginTop: 32,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f4faed',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatar: {
    width: 96,
    height: 96,
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2e4420',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  email: {
    fontSize: 13,
    color: '#7a9460',
    marginBottom: 10,
  },
  badge: {
    backgroundColor: '#ddeece',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  badgeText: {
    color: '#3d6b22',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // ─── Menu ──────────────────────────────────────────────────────────────────
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 28,
    ...(Platform.OS === 'web' ? ({ marginTop: 8 } as any) : {}),
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7aad4e',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#f4faed',
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#ddeece',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2e4420',
  },
  lastItem: {
    marginBottom: 0,
  },
  addressMenuContent: {
    flex: 1,
  },
  addressPreview: {
    fontSize: 12,
    color: '#7a9460',
    marginTop: 2,
  },
  addressMissing: {
    fontSize: 12,
    color: '#c07c2a',
    marginTop: 2,
  },

  // ─── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 50, 20, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#f4faed',
    borderRadius: 18,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#c8e0b0',
    ...Platform.select({
      ios: { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14 },
      android: { elevation: 8 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0edcd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2e4420',
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2f0d4',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Modal Tabs ────────────────────────────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ddeece',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e0b0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3d6b22',
    backgroundColor: '#f0f7e8',
  },
  tabText: {
    fontSize: 12,
    color: '#9ab88c',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  activeTabText: {
    color: '#3d6b22',
  },

  // ─── Modal Body ────────────────────────────────────────────────────────────
  modalBody: {
    padding: 20,
  },

  // ─── Image Picker ──────────────────────────────────────────────────────────
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 22,
    position: 'relative',
    alignSelf: 'center',
  },
  editImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#3d6b22',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#d4e9b8',
    backgroundColor: '#e8f2de',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 5,
    color: '#9ab88c',
    fontSize: 11,
    fontWeight: '500',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3d6b22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f4faed',
  },

  // ─── Form Inputs ───────────────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7aad4e',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#2e4420',
    backgroundColor: '#e8f2de',
  },
  inputDisabled: {
    backgroundColor: '#ddeece',
    color: '#9ab88c',
  },
  inputError: {
    borderColor: '#b83232',
  },
  errorText: {
    color: '#b83232',
    fontSize: 11,
    marginTop: 4,
  },
  helperText: {
    color: '#9ab88c',
    fontSize: 11,
    marginTop: 4,
  },

  // ─── Security Info ─────────────────────────────────────────────────────────
  securityInfo: {
    flexDirection: 'row',
    backgroundColor: '#e2f0d4',
    padding: 12,
    borderRadius: 9,
    marginBottom: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  securityInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#4a6635',
    lineHeight: 18,
  },

  // ─── Save Button ───────────────────────────────────────────────────────────
  saveButton: {
    backgroundColor: '#3d6b22',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  buttonDisabled: { opacity: 0.55 },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ─── Location ──────────────────────────────────────────────────────────────
  locationBanner: {
    flexDirection: 'row',
    backgroundColor: '#e2f0d4',
    borderRadius: 9,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  locationBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#4a6635',
    lineHeight: 18,
  },
  locationBtn: {
    flexDirection: 'row',
    backgroundColor: '#3d6b22',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  locationBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  coordsText: {
    fontSize: 11,
    color: '#7aad4e',
    fontWeight: '500',
  },
});

export default ProfileScreen;