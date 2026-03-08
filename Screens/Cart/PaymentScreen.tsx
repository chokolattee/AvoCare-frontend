import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView,  TextInput, TouchableOpacity, ActivityIndicator, Image,
  Modal, StyleSheet, Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';

import type { PaymentScreenProps } from '../../Navigation/AppNavigator';
import CheckoutSteps from './CheckoutSteps';
import { getAuthToken, getCart, clearCart, CartItem } from './cartUtils';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const IS_WEB = Platform.OS === 'web';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest:      '#2d5016',
  sage:        '#3d6b22',
  sageMed:     '#5a8c35',
  sageLt:      '#7aad4e',
  sagePale:    '#e8f5dc',
  sageTint:    '#eef7e4',
  ink:         '#111a0a',
  inkSoft:     '#2e4420',
  inkFaint:    '#7a9460',
  inkGray:     '#9abf74',
  mist:        '#f7faf3',
  bg:          '#f6faf2',
  webBg:       '#f0f7e8',
  white:       '#ffffff',
  border:      '#e8f0e0',
  borderMed:   '#d4e9b8',
  borderSoft:  '#f0f7e8',
  borderGreen: '#c8e8a0',
  gray:        '#888',
  grayMid:     '#666',
  amber:       '#8a6000',
  amberBg:     '#fff8e6',
  amberBorder: '#ffe099',
};

const MAX_VISIBLE = 5;

// ─── Safe number formatter — never crashes if value is undefined/null ─────────
const fmt = (val: number | undefined | null): string =>
  (typeof val === 'number' && isFinite(val) ? val : 0).toFixed(2);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

// ─── Alert Modal ──────────────────────────────────────────────────────────────
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
      style={al.backdrop}
      activeOpacity={1}
      onPress={() => buttons.find((b) => b.style === 'cancel')?.onPress?.()}
    >
      <TouchableOpacity activeOpacity={1} style={al.card}>
        <View style={al.iconCircle}>
          <Ionicons name="information-circle" size={30} color={C.sage} />
        </View>
        <Text style={al.title}>{title}</Text>
        <Text style={al.message}>{message}</Text>
        <View style={[al.btnRow, buttons.length === 1 && { justifyContent: 'center' }]}>
          {buttons.map((btn, i) => {
            const isPrimary     = i === buttons.length - 1;
            const isDestructive = btn.style === 'destructive';
            return (
              <TouchableOpacity
                key={btn.label}
                style={[
                  al.btn,
                  isPrimary && !isDestructive && al.btnPrimary,
                  isDestructive && al.btnDestructive,
                  !isPrimary && al.btnCancel,
                ]}
                onPress={btn.onPress}
                activeOpacity={0.85}
              >
                <Text style={[al.btnText, isPrimary && al.btnTextLight]}>
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

const al = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card:           { backgroundColor: C.white, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, width: '100%', maxWidth: 360, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
  iconCircle:     { width: 60, height: 60, borderRadius: 30, backgroundColor: C.sageTint, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  title:          { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  message:        { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 24, textAlign: 'center' },
  btnRow:         { flexDirection: 'row', gap: 12, width: '100%' },
  btn:            { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnCancel:      { backgroundColor: '#f0f0f0' },
  btnPrimary:     { backgroundColor: C.sage },
  btnDestructive: { backgroundColor: '#c0392b' },
  btnText:        { fontSize: 15, fontWeight: '600', color: '#555' },
  btnTextLight:   { color: C.white, fontWeight: '700' },
});

// ─── Component ────────────────────────────────────────────────────────────────
const PaymentScreen: React.FC<PaymentScreenProps> = ({ navigation, route }) => {
  const { shippingInfo, orderPricing } = route.params ?? {};
  const { height: windowHeight } = useWindowDimensions();

  // ── SAFETY: destructure with fallbacks so toFixed never crashes ───────────
  const safeItemsPrice    = orderPricing?.itemsPrice    ?? 0;
  const safeTaxPrice      = orderPricing?.taxPrice      ?? 0;
  const safeShippingPrice = orderPricing?.shippingPrice ?? 0;
  const safeTotalPrice    = orderPricing?.totalPrice    ?? 0;

  const [cartItems,     setCartItems]     = useState<CartItem[]>([]);
  const [userName,      setUserName]      = useState('');
  const [userEmail,     setUserEmail]     = useState('');
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const [cardName,   setCardName]   = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC,    setCardCVC]    = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── Test cards (tap-to-fill) ────────────────────────────────────────────────
  const TEST_CARDS = [
    { brand: 'Visa',       number: '4343 4343 4343 4345', expiry: '12/29', cvc: '123', color: '#1a6dd4' },
    { brand: 'Mastercard', number: '5123 4567 8901 2346', expiry: '12/29', cvc: '456', color: '#eb5757' },
  ] as const;

  const fillTestCard = useCallback((card: typeof TEST_CARDS[number]) => {
    setCardNumber(card.number);
    setCardExpiry(card.expiry);
    setCardCVC(card.cvc);
  }, []);

  const [alert, setAlert] = useState<{
    visible: boolean; title: string; message: string; buttons: AlertModalProps['buttons'];
  }>({ visible: false, title: '', message: '', buttons: [] });

  const showAlert = useCallback((title: string, message: string, buttons: AlertModalProps['buttons']) =>
    setAlert({ visible: true, title, message, buttons }), []);
  const hideAlert = useCallback(() =>
    setAlert((p) => ({ ...p, visible: false })), []);

  // ── If orderPricing is missing entirely, go back immediately ─────────────
  useEffect(() => {
    if (!orderPricing) {
      showAlert(
        'Session Error',
        'Order details are missing. Please start checkout again.',
        [{ label: 'OK', style: 'default', onPress: () => { hideAlert(); navigation.navigate('ShippingScreen'); } }],
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cart, token] = await Promise.all([getCart(), getAuthToken()]);
        setCartItems(cart);
        if (token) {
          const { data } = await axios.get(`${API_BASE}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (data.success && data.user) {
            const name = data.user.name || '';
            setUserName(name);
            setCardName(name);
            setUserEmail(data.user.email || '');
          }
        }
      } catch (err) {
        console.error('Payment load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validate = useCallback((): boolean => {
    const digits = cardNumber.replace(/\s/g, '');
    if (!cardName.trim() || cardName.trim().length < 2) {
      showAlert('Invalid Input', 'Please enter a valid cardholder name.', [{ label: 'OK', style: 'default', onPress: hideAlert }]);
      return false;
    }
    if (digits.length !== 16) {
      showAlert('Invalid Input', 'Card number must be 16 digits.', [{ label: 'OK', style: 'default', onPress: hideAlert }]);
      return false;
    }
    if (cardExpiry.length !== 5) {
      showAlert('Invalid Input', 'Please enter a valid expiry (MM/YY).', [{ label: 'OK', style: 'default', onPress: hideAlert }]);
      return false;
    }
    const [mm, yy] = cardExpiry.split('/').map(Number);
    const now = new Date();
    const cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
    if (mm < 1 || mm > 12 || yy < cy || (yy === cy && mm < cm)) {
      showAlert('Invalid Input', 'Card has expired or expiry is invalid.', [{ label: 'OK', style: 'default', onPress: hideAlert }]);
      return false;
    }
    if (cardCVC.length < 3) {
      showAlert('Invalid Input', 'CVC must be 3 or 4 digits.', [{ label: 'OK', style: 'default', onPress: hideAlert }]);
      return false;
    }
    return true;
  }, [cardName, cardNumber, cardExpiry, cardCVC, showAlert, hideAlert]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        showAlert('Session Expired', 'Please login again.', [{
          label: 'OK', style: 'default',
          onPress: () => { hideAlert(); navigation.navigate('LoginScreen'); },
        }]);
        return;
      }

      // ── Parse expiry MM/YY → numbers ───────────────────────────────────────
      const [expMonthStr, expYearStr] = cardExpiry.split('/');
      const expMonth = parseInt(expMonthStr, 10);
      const expYear  = 2000 + parseInt(expYearStr, 10);

      // ── Step 1: Process payment via PayMongo ──────────────────────────────
      const payRes = await axios.post(`${API_BASE}/api/paymongo/pay`, {
        amount:      safeTotalPrice,
        card_number: cardNumber.replace(/\s/g, ''),
        exp_month:   expMonth,
        exp_year:    expYear,
        cvc:         cardCVC,
        card_name:   cardName,
        email:       userEmail || `guest_${Date.now()}@avocare.app`,
        phone:       shippingInfo?.phoneNo || undefined,
      }, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      const payData = payRes.data;

      if (!payData.success) {
        if (payData.requires_3ds) {
          showAlert(
            'Card Requires 3DS',
            'This card requires 3D Secure authentication which is not supported in-app. Please use a test card that does not trigger 3DS:\n\nVisa: 4343 4343 4343 4345\nMastercard: 5123 4567 8901 2346',
            [{ label: 'OK', style: 'default', onPress: hideAlert }],
          );
        } else {
          showAlert(
            'Payment Failed',
            payData.message || 'Payment could not be processed. Please check your card details.',
            [{ label: 'OK', style: 'default', onPress: hideAlert }],
          );
        }
        return;
      }

      // ── Step 2: Create order with PayMongo result ─────────────────────────
      const orderItems = cartItems.map(({ name, quantity, image, price, product }) => ({
        name, quantity, image: image ?? '', price,
        product: typeof product === 'object' && product !== null
          ? String((product as any)._id ?? (product as any).id ?? product)
          : String(product),
      }));

      await axios.post(`${API_BASE}/api/order/new`, {
        orderItems,
        shippingInfo: {
          address:     shippingInfo?.address,
          city:        shippingInfo?.city,
          country:     shippingInfo?.country,
          postal_code: shippingInfo?.postalCode,
          phone_no:    shippingInfo?.phoneNo,
        },
        itemsPrice:    safeItemsPrice,
        taxPrice:      safeTaxPrice,
        shippingPrice: safeShippingPrice,
        totalPrice:    safeTotalPrice,
        paymentInfo: {
          id:     payData.payment_intent_id,
          status: payData.status,          // 'succeeded'
        },
      }, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      await clearCart();
      navigation.navigate('OrderSuccess');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        showAlert('Session Expired', 'Please login again.', [{
          label: 'OK', style: 'default',
          onPress: () => { hideAlert(); navigation.navigate('LoginScreen'); },
        }]);
      } else {
        showAlert(
          'Order Failed',
          err?.response?.data?.message || 'Failed to place order. Please try again.',
          [{ label: 'OK', style: 'default', onPress: hideAlert }],
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [validate, cartItems, shippingInfo, safeItemsPrice, safeTaxPrice, safeShippingPrice, safeTotalPrice,
      cardNumber, cardExpiry, cardCVC, cardName, userEmail, navigation, showAlert, hideAlert]);

  // Collapsible items
  const hasMoreItems = cartItems.length > MAX_VISIBLE;
  const visibleItems = itemsExpanded ? cartItems : cartItems.slice(0, MAX_VISIBLE);
  const hiddenCount  = cartItems.length - MAX_VISIBLE;

  const inputStyle = (f: string) => [s.input, focusedField === f && s.inputFocused];

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <ActivityIndicator size="large" color={C.sage} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  // ── Shared inner content ───────────────────────────────────────────────────
  const content = (
    <>
      {/* ── Test Cards Panel ── */}
      <View style={s.testPanel}>
        <View style={s.testPanelHeader}>
          <Ionicons name="flask-outline" size={14} color={C.amber} />
          <Text style={s.testPanelTitle}>TEST MODE — tap a card to auto-fill</Text>
        </View>
        {TEST_CARDS.map((tc) => (
          <View key={tc.brand} style={s.testCardRow}>
            <View style={[s.testCardBrand, { backgroundColor: tc.color }]}>
              <Text style={s.testCardBrandText}>{tc.brand}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.testCardNumber}>{tc.number}</Text>
              <Text style={s.testCardSub}>Exp {tc.expiry}  ·  CVC {tc.cvc}</Text>
            </View>
            <TouchableOpacity
              style={s.testCardUseBtn}
              onPress={() => fillTestCard(tc)}
              activeOpacity={0.75}
            >
              <Text style={s.testCardUseBtnText}>Use</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* ── Payment Form Card ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="card-outline" size={20} color={C.sage} />
          <Text style={s.cardHeaderTitle}>Payment Details</Text>
        </View>
        <View style={s.cardBody}>
          {!!userName && (
            <View style={s.userBanner}>
              <Ionicons name="person-outline" size={15} color={C.sage} />
              <Text style={s.userBannerText}>
                Paying as: <Text style={{ fontWeight: '700' }}>{userName}</Text>
              </Text>
            </View>
          )}

          <View style={s.fieldGroup}>
            <Text style={s.label}>Cardholder Name</Text>
            <TextInput
              style={inputStyle('cardName')} value={cardName} onChangeText={setCardName}
              placeholder="Full name on card" placeholderTextColor="#bbb" autoCapitalize="words"
              onFocus={() => setFocusedField('cardName')} onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.label}>Card Number</Text>
            <TextInput
              style={inputStyle('cardNumber')} value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              placeholder="1234 5678 9012 3456" placeholderTextColor="#bbb"
              keyboardType="numeric" maxLength={19}
              onFocus={() => setFocusedField('cardNumber')} onBlur={() => setFocusedField(null)}
            />
            <Text style={s.inputHint}>Enter 16-digit card number</Text>
          </View>

          <View style={s.inputRow}>
            <View style={[s.fieldGroup, s.inputHalf]}>
              <Text style={s.label}>Expiry (MM/YY)</Text>
              <TextInput
                style={inputStyle('expiry')} value={cardExpiry}
                onChangeText={(v) => setCardExpiry(formatExpiry(v))}
                placeholder="MM/YY" placeholderTextColor="#bbb" keyboardType="numeric" maxLength={5}
                onFocus={() => setFocusedField('expiry')} onBlur={() => setFocusedField(null)}
              />
            </View>
            <View style={[s.fieldGroup, s.inputHalf]}>
              <Text style={s.label}>CVC</Text>
              <TextInput
                style={inputStyle('cvc')} value={cardCVC}
                onChangeText={(v) => setCardCVC(v.replace(/\D/g, '').slice(0, 4))}
                placeholder="123" placeholderTextColor="#bbb"
                keyboardType="numeric" maxLength={4} secureTextEntry
                onFocus={() => setFocusedField('cvc')} onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={s.testBanner}>
            <Ionicons name="shield-checkmark-outline" size={16} color={C.amber} />
            <Text style={s.testBannerText}>
              Real charges will <Text style={{ fontWeight: '700' }}>not</Text> be made.
              Use the test cards above to simulate a successful payment.
            </Text>
          </View>
        </View>
      </View>

      {/* ── Order Summary Card (collapsible after 5) ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="receipt-outline" size={20} color={C.sage} />
          <Text style={s.cardHeaderTitle}>Order Summary</Text>
          <View style={s.cardBadge}>
            <Text style={s.cardBadgeText}>{cartItems.length}</Text>
          </View>
        </View>
        <View style={s.cardBody}>
          {visibleItems.map((item) => (
            <View key={item.product} style={s.summaryItem}>
              <Image source={{ uri: item.image || undefined }} style={s.summaryItemImage} />
              <View style={{ flex: 1 }}>
                <Text style={s.summaryItemName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.summaryItemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={s.summaryItemTotal}>₱{fmt(item.price * item.quantity)}</Text>
            </View>
          ))}

          {hasMoreItems && (
            <TouchableOpacity
              style={s.toggleBtn}
              onPress={() => setItemsExpanded((p) => !p)}
              activeOpacity={0.75}
            >
              <Ionicons name={itemsExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={C.sage} />
              <Text style={s.toggleBtnText}>
                {itemsExpanded ? 'Show less' : `Show ${hiddenCount} more item${hiddenCount !== 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          )}

          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>₱{fmt(safeItemsPrice)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Shipping</Text>
            <Text style={s.summaryValue}>₱{fmt(safeShippingPrice)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tax (12% VAT)</Text>
            <Text style={s.summaryValue}>₱{fmt(safeTaxPrice)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>₱{fmt(safeTotalPrice)}</Text>
          </View>
          <View style={s.divider} />
          <Text style={[s.summaryLabel, { marginBottom: 4 }]}>Shipping To</Text>
          <Text style={s.shippingAddress}>
            {shippingInfo?.address}, {shippingInfo?.city}, {shippingInfo?.postalCode}{'\n'}
            {shippingInfo?.country} · {shippingInfo?.phoneNo}
          </Text>
        </View>
      </View>

      {/* ── Pay Button ── */}
      <TouchableOpacity
        style={[s.payBtn, submitting && s.payBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color={C.white} />
        ) : (
          <>
            <Ionicons name="lock-closed-outline" size={18} color={C.white} />
            <Text style={s.payBtnText}>Pay ₱{fmt(safeTotalPrice)}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* ── Back to Confirm ── */}
      <TouchableOpacity
        style={s.backBtn}
        onPress={() => navigation.navigate('ConfirmOrder', { shippingInfo, orderPricing })}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={16} color={C.sage} />
        <Text style={s.backBtnText}>Back to Confirm</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <AlertModal
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
      />

      <CheckoutSteps currentStep="payment" />

      <ScrollView
        style={{ height: windowHeight, backgroundColor: IS_WEB ? C.webBg : C.bg }}
        contentContainerStyle={IS_WEB ? webS.scrollContent : s.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {IS_WEB ? (
          <View style={webS.centerColumn}>{content}</View>
        ) : (
          content
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: C.bg },
  scrollContent: { padding: 16, paddingBottom: 60 },

  card: {
    backgroundColor: C.white, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, marginBottom: 14, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' } as any,
    }),
  },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.borderSoft, backgroundColor: C.mist },
  cardHeaderTitle: { fontSize: 15, fontWeight: '700', color: C.inkSoft, flex: 1 },
  cardBadge:       { backgroundColor: C.sage, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  cardBadgeText:   { color: C.white, fontSize: 11, fontWeight: '700' },
  cardBody:        { padding: 14, gap: 12 },

  userBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.sageTint, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.borderGreen },
  userBannerText: { fontSize: 12, color: C.inkSoft, flex: 1 },

  fieldGroup: { gap: 4 },
  label:      { fontSize: 11, fontWeight: '600', color: C.sageMed, textTransform: 'uppercase', letterSpacing: 0.4 },
  input:      { backgroundColor: C.mist, borderWidth: 1.5, borderColor: C.borderMed, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: C.inkSoft },
  inputFocused: { borderColor: C.sage, backgroundColor: C.white },
  inputRow:   { flexDirection: 'row', gap: 12 },
  inputHalf:  { flex: 1 },
  inputHint:  { fontSize: 11, color: '#aaa', marginTop: 2 },

  testBanner:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.amberBg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: C.amberBorder },
  testBannerText: { fontSize: 12, color: C.amber, flex: 1, lineHeight: 17 },

  summaryItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  summaryItemImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: C.sagePale },
  summaryItemName:  { fontSize: 12, fontWeight: '600', color: C.inkSoft, flex: 1 },
  summaryItemQty:   { fontSize: 11, color: C.gray },
  summaryItemTotal: { fontSize: 13, fontWeight: '700', color: C.sage },

  toggleBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, marginBottom: 4, paddingVertical: 9, borderRadius: 8, backgroundColor: C.sageTint, borderWidth: 1, borderColor: C.borderGreen },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: C.sage },

  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel:    { fontSize: 13, color: C.grayMid },
  summaryValue:    { fontSize: 13, fontWeight: '600', color: '#333' },
  divider:         { height: 1, backgroundColor: C.border, marginVertical: 8 },
  totalRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel:      { fontSize: 15, fontWeight: '700', color: C.inkSoft },
  totalValue:      { fontSize: 18, fontWeight: '800', color: C.sage },
  shippingAddress: { fontSize: 12, color: C.grayMid, lineHeight: 18, marginTop: 4 },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.sage, paddingVertical: 15, borderRadius: 12, marginBottom: 10,
    ...Platform.select({
      ios:     { shadowColor: C.sage, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText:     { color: C.white, fontSize: 16, fontWeight: '700' },

  backBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.white, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.borderMed, marginBottom: 20 },
  backBtnText: { color: C.sage, fontSize: 15, fontWeight: '600' },

  // Test panel
  testPanel:          { backgroundColor: C.amberBg, borderRadius: 12, borderWidth: 1, borderColor: C.amberBorder, marginBottom: 14, overflow: 'hidden' },
  testPanelHeader:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.amberBorder, backgroundColor: '#fff3cd' },
  testPanelTitle:     { fontSize: 11, fontWeight: '700', color: C.amber, textTransform: 'uppercase', letterSpacing: 0.5 },
  testCardRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.amberBorder },
  testCardBrand:      { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 80, alignItems: 'center' },
  testCardBrandText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  testCardNumber:     { fontSize: 13, fontWeight: '700', color: '#333', letterSpacing: 0.5 },
  testCardSub:        { fontSize: 11, color: C.gray, marginTop: 2 },
  testCardUseBtn:     { backgroundColor: C.amber, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  testCardUseBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ─── Web-only styles (maxWidth 620 — matches ShippingScreen) ──────────────────
const webS = StyleSheet.create({
  scrollContent: { flexGrow: 1, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  centerColumn:  { width: '100%', maxWidth: 620, backgroundColor: C.white, borderRadius: 16, padding: 28, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 16 },
});

export default PaymentScreen;