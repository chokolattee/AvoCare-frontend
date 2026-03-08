import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView,  TextInput, TouchableOpacity, ActivityIndicator,
  Modal, StyleSheet, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';

import type { ShippingScreenProps, ShippingInfo } from '../../Navigation/AppNavigator';
import CheckoutSteps from './CheckoutSteps';
import { shippingStyles as styles } from '../../Styles/Checkout.styles';
import { getAuthToken, isLoggedIn } from './cartUtils';

interface SavedAddress extends ShippingInfo {
  id: string;
  orderId: string;
  isProfile?: boolean;   // true = came from user profile (default address)
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const IS_WEB = Platform.OS === 'web';

// ─── Cross-platform alert modal ───────────────────────────────────────────────

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: { label: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
}

const AlertModal: React.FC<AlertModalProps> = ({ visible, title, message, buttons }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={() => buttons.find((b) => b.style === 'cancel')?.onPress()}
  >
    <TouchableOpacity
      style={alertStyles.backdrop}
      activeOpacity={1}
      onPress={() => buttons.find((b) => b.style === 'cancel')?.onPress()}
    >
      <TouchableOpacity activeOpacity={1} style={alertStyles.card}>
        <View style={alertStyles.iconCircle}>
          <Ionicons name="information-circle" size={30} color="#3d6b22" />
        </View>
        <Text style={alertStyles.title}>{title}</Text>
        <Text style={alertStyles.message}>{message}</Text>
        <View style={[alertStyles.btnRow, buttons.length === 1 && { justifyContent: 'center' }]}>
          {buttons.map((btn, i) => {
            const isPrimary = i === buttons.length - 1;
            const isDestructive = btn.style === 'destructive';
            return (
              <TouchableOpacity
                key={btn.label}
                style={[
                  alertStyles.btn,
                  isPrimary && !isDestructive && alertStyles.btnPrimary,
                  isDestructive && alertStyles.btnDestructive,
                  !isPrimary && alertStyles.btnCancel,
                ]}
                onPress={btn.onPress}
                activeOpacity={0.85}
              >
                <Text style={[
                  alertStyles.btnText,
                  isPrimary && alertStyles.btnTextPrimary,
                  isDestructive && alertStyles.btnTextPrimary,
                ]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const alertStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#edf5e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancel:      { backgroundColor: '#f0f0f0' },
  btnPrimary:     { backgroundColor: '#3d6b22' },
  btnDestructive: { backgroundColor: '#c0392b' },
  btnText:        { fontSize: 15, fontWeight: '600', color: '#555' },
  btnTextPrimary: { color: '#fff', fontWeight: '700' },
});

// ─── Component ────────────────────────────────────────────────────────────────

const ShippingScreen: React.FC<ShippingScreenProps> = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();
  const [address, setAddress]       = useState('');
  const [city, setCity]             = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phoneNo, setPhoneNo]       = useState('');
  const [country, setCountry]       = useState('Philippines');
  const [savedAddresses, setSavedAddresses]       = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [userName, setUserName]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertModalProps['buttons'];
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = useCallback((
    title: string,
    message: string,
    buttons: AlertModalProps['buttons'],
  ) => setAlert({ visible: true, title, message, buttons }), []);

  const hideAlert = useCallback(() =>
    setAlert((prev) => ({ ...prev, visible: false })), []);

  useEffect(() => {
    (async () => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        showAlert('Login Required', 'Please login to continue.', [
          {
            label: 'OK',
            style: 'default',
            onPress: () => { hideAlert(); navigation.navigate('LoginScreen'); },
          },
        ]);
        setLoading(false);
        return;
      }
      try {
        const token = await getAuthToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [userRes, ordersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/users/me`, config),
          axios.get(`${API_BASE}/api/orders/me`, config),
        ]);

        const allAddresses: SavedAddress[] = [];

        if (userRes.data.success && userRes.data.user) {
          const u = userRes.data.user;
          setUserName(u.name || '');

          // ── Profile (default) address ────────────────────────────────────
          if (u.address_set && u.address) {
            const profileAddr: SavedAddress = {
              id: 'profile',
              orderId: '',
              isProfile: true,
              address:    u.address       || '',
              city:       u.city          || '',
              postalCode: u.postal_code   || '',
              phoneNo:    u.phone_no      || '',
              country:    u.country       || 'Philippines',
            };
            allAddresses.push(profileAddr);
            // Pre-fill form + pre-select
            setAddress(profileAddr.address);
            setCity(profileAddr.city);
            setPostalCode(profileAddr.postalCode);
            setPhoneNo(profileAddr.phoneNo);
            setCountry(profileAddr.country);
            setSelectedAddressId('profile');
            setShowForm(false);
          }
        }

        // ── Past-order addresses (de-duplicated, skip if same as profile) ──
        if (ordersRes.data.success && ordersRes.data.orders?.length > 0) {
          const profileEntry = allAddresses.find((a) => a.isProfile);
          const orderAddresses: SavedAddress[] = ordersRes.data.orders
            .map((o: any, i: number) => ({
              id: `addr-${i}`,
              orderId: o._id,
              ...o.shippingInfo,
            }))
            .filter((a: SavedAddress, i: number, self: SavedAddress[]) =>
              // de-dup within order list
              i === self.findIndex((b) =>
                b.address    === a.address &&
                b.city       === a.city    &&
                b.postalCode === a.postalCode,
              ) &&
              // don't repeat the profile address
              !(profileEntry &&
                a.address    === profileEntry.address &&
                a.city       === profileEntry.city    &&
                a.postalCode === profileEntry.postalCode),
            );
          allAddresses.push(...orderAddresses);
        }

        setSavedAddresses(allAddresses);
      } catch (err) {
        console.error('Shipping load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelectAddress = useCallback((id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setShowForm(true);
      setAddress(''); setCity(''); setPostalCode(''); setPhoneNo(''); setCountry('Philippines');
    } else {
      const found = savedAddresses.find((a) => a.id === id);
      if (found) {
        setShowForm(false);
        setAddress(found.address); setCity(found.city);
        setPostalCode(found.postalCode); setPhoneNo(found.phoneNo); setCountry(found.country);
      }
    }
  }, [savedAddresses]);

  const handleSubmit = useCallback(() => {
    if (!address.trim() || !city.trim() || !postalCode.trim() || !phoneNo.trim() || !country.trim()) {
      showAlert('Incomplete', 'Please fill in all address fields.', [
        { label: 'OK', style: 'default', onPress: hideAlert },
      ]);
      return;
    }
    navigation.navigate('ConfirmOrder', {
      shippingInfo: { address, city, postalCode, phoneNo, country },
    });
  }, [address, city, postalCode, phoneNo, country, navigation, showAlert, hideAlert]);

  const inputStyle = (f: string) => [styles.input, focusedField === f && styles.inputFocused];

  const FIELDS = [
    { key: 'address',    label: 'Street Address', value: address,    setter: setAddress,    placeholder: '123 Main St',      kb: 'default'   },
    { key: 'city',       label: 'City',            value: city,       setter: setCity,       placeholder: 'Manila',           kb: 'default'   },
    { key: 'postalCode', label: 'Postal Code',     value: postalCode, setter: setPostalCode, placeholder: '1000',             kb: 'numeric'   },
    { key: 'phoneNo',    label: 'Phone Number',    value: phoneNo,    setter: setPhoneNo,    placeholder: '+63 912 345 6789', kb: 'phone-pad' },
    { key: 'country',    label: 'Country',         value: country,    setter: setCountry,    placeholder: 'Philippines',      kb: 'default'   },
  ] as const;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#3d6b22" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      <AlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#2e4420" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shipping Info</Text>
      </View>

      <CheckoutSteps currentStep="shipping" />

      {/*
        On web:  outer ScrollView fills the grey background, inner View is the
                 centered white column (max-width 620px, like Twitter).
        On mobile: behaves exactly as before — no wrapper, no max-width.
      */}
      <ScrollView
        style={IS_WEB ? { height: windowHeight, backgroundColor: '#f0f7e8' } : styles.scroll}
        contentContainerStyle={IS_WEB ? webStyles.webScrollContent : styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Centered column — web only */}
        <View style={IS_WEB ? webStyles.centerColumn : styles.scrollContent}>

          {!!userName && (
            <View style={styles.userBanner}>
              <Ionicons name="person-circle-outline" size={20} color="#3d6b22" />
              <Text style={styles.userBannerText}>
                Delivering to: <Text style={styles.userBannerName}>{userName}</Text>
              </Text>
            </View>
          )}

          {savedAddresses.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
              {savedAddresses.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.savedAddressCard,
                    selectedAddressId === addr.id && styles.savedAddressCardSelected,
                    addr.isProfile && addrStyles.profileCard,
                  ]}
                  onPress={() => handleSelectAddress(addr.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.savedAddressCardInner}>
                    <View style={styles.radioOuter}>
                      {selectedAddressId === addr.id && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      {addr.isProfile && (
                        <View style={addrStyles.defaultBadge}>
                          <Ionicons name="home" size={11} color="#3d6b22" />
                          <Text style={addrStyles.defaultBadgeText}>Default Address</Text>
                        </View>
                      )}
                      <Text style={styles.savedAddressText}>
                        {addr.address}, {addr.city}, {addr.postalCode}{'\n'}
                        {addr.country} · {addr.phoneNo}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.newAddressBtn}
                onPress={() => handleSelectAddress('new')}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#3d6b22" />
                <Text style={styles.newAddressBtnText}>Use a Different Address</Text>
              </TouchableOpacity>
            </>
          )}

          {(showForm || savedAddresses.length === 0) && (
            <>
              <Text style={styles.sectionTitle}>
                {savedAddresses.length > 0 ? 'New Address' : 'Delivery Address'}
              </Text>
              {FIELDS.map(({ key, label, value, setter, placeholder, kb }) => (
                <View key={key} style={styles.fieldGroup}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={inputStyle(key)}
                    value={value}
                    onChangeText={setter}
                    placeholder={placeholder}
                    placeholderTextColor="#bbb"
                    keyboardType={kb as any}
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              ))}
            </>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Web-only styles (never applied on mobile) ────────────────────────────────
const webStyles = StyleSheet.create({
  // Make the ScrollView fill the page with a subtle grey background
  webScroll: {
    backgroundColor: '#f0f7e8',
  },
  // contentContainerStyle: centres the column horizontally
  webScrollContent: {
    alignItems: 'center',      // horizontal centering
    paddingVertical: 32,
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  // The white centered card — max 620px wide, just like Twitter's feed column
  centerColumn: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    paddingBottom: 100, // was 40, now 100 for button visibility
    // Web shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
});

// ─── Address badge styles ─────────────────────────────────────────────────────
const addrStyles = StyleSheet.create({
  profileCard: {
    borderColor: '#3d6b22',
    borderWidth: 1.5,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#edf5e5',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3d6b22',
  },
});

export default ShippingScreen;