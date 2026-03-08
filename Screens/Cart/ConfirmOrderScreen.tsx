import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import axios from 'axios';

import type { ConfirmOrderProps, OrderPricing } from '../../Navigation/AppNavigator';
import CheckoutSteps from './CheckoutSteps';
import { getAuthToken, getCart, CartItem } from './cartUtils';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const IS_WEB = Platform.OS === 'web';

// ─── Palette (matches your full app) ─────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────

const ConfirmOrderScreen: React.FC<ConfirmOrderProps> = ({ navigation, route }) => {
  const { shippingInfo } = route.params;
  const { height: windowHeight } = useWindowDimensions();

  const [cartItems, setCartItems]         = useState<CartItem[]>([]);
  const [userName, setUserName]           = useState('');
  const [userEmail, setUserEmail]         = useState('');
  const [loading, setLoading]             = useState(true);
  const [itemsExpanded, setItemsExpanded] = useState(false);

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
            setUserName(data.user.name || '');
            setUserEmail(data.user.email || '');
          }
        }
      } catch (err) {
        console.error('ConfirmOrder load error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const itemsPrice    = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingPrice = itemsPrice >= 5000 ? 0 : 150;
  const taxPrice      = Math.round(itemsPrice * 0.12 * 100) / 100;
  const totalPrice    = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

  const handleProceed = () => {
    if (cartItems.length === 0) { Alert.alert('Empty Cart', 'Your cart is empty.'); return; }
    const orderPricing: OrderPricing = { itemsPrice, shippingPrice, taxPrice, totalPrice };
    navigation.navigate('Payment', { shippingInfo, orderPricing });
  };

  // ── FIX: navigate back to ShippingScreen explicitly ──────────────────────
  const handleBack = () => navigation.navigate('ShippingScreen');

  const hasMoreItems = cartItems.length > MAX_VISIBLE;
  const visibleItems = itemsExpanded ? cartItems : cartItems.slice(0, MAX_VISIBLE);
  const hiddenCount  = cartItems.length - MAX_VISIBLE;

  if (loading) {
    return (
      <SafeAreaView style={s.safeArea}>
        <ActivityIndicator size="large" color={C.sage} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  // ── Inner content (shared between web column and mobile) ─────────────────
  const content = (
    <>
      {/* ── Shipping Info Card ─────────────────────────────────────── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="location-outline" size={20} color={C.sage} />
          <Text style={s.cardHeaderTitle}>Shipping Information</Text>
        </View>
        <View style={s.cardBody}>
          {!!userName && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Name</Text>
              <Text style={s.infoValue}>{userName}</Text>
            </View>
          )}
          {!!userEmail && (
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoValue}>{userEmail}</Text>
            </View>
          )}
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Phone</Text>
            <Text style={s.infoValue}>{shippingInfo.phoneNo}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Address</Text>
            <Text style={s.infoValue}>
              {shippingInfo.address}, {shippingInfo.city},{' '}
              {shippingInfo.postalCode}, {shippingInfo.country}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Order Items Card (collapsible after 5) ─────────────────── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="cart-outline" size={20} color={C.sage} />
          <Text style={s.cardHeaderTitle}>Order Items</Text>
          <View style={s.cardBadge}>
            <Text style={s.cardBadgeText}>{cartItems.length}</Text>
          </View>
        </View>
        <View style={s.cardBody}>
          {visibleItems.map((item) => (
            <View key={item.product} style={s.orderItem}>
              <Image
                source={{ uri: item.image || undefined }}
                style={s.orderItemImage}
              />
              <View style={s.orderItemInfo}>
                <Text style={s.orderItemName} numberOfLines={2}>{item.name}</Text>
                <Text style={s.orderItemQtyPrice}>
                  {item.quantity} × ₱{item.price.toFixed(2)}
                </Text>
              </View>
              <Text style={s.orderItemTotal}>
                ₱{(item.quantity * item.price).toFixed(2)}
              </Text>
            </View>
          ))}

          {hasMoreItems && (
            <TouchableOpacity
              style={s.toggleBtn}
              onPress={() => setItemsExpanded((p) => !p)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={itemsExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={C.sage}
              />
              <Text style={s.toggleBtnText}>
                {itemsExpanded
                  ? 'Show less'
                  : `Show ${hiddenCount} more item${hiddenCount !== 1 ? 's' : ''}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Order Summary Card ─────────────────────────────────────── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Ionicons name="receipt-outline" size={20} color={C.sage} />
          <Text style={s.cardHeaderTitle}>Order Summary</Text>
        </View>
        <View style={s.cardBody}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>₱{itemsPrice.toFixed(2)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Shipping</Text>
            <Text style={[s.summaryValue, shippingPrice === 0 && s.summaryValueFree]}>
              {shippingPrice === 0 ? 'FREE' : `₱${shippingPrice.toFixed(2)}`}
            </Text>
          </View>

          {shippingPrice === 0 ? (
            <View style={s.freeShippingAlert}>
              <Ionicons name="checkmark-circle" size={16} color={C.sage} />
              <Text style={s.freeShippingText}>You've qualified for free shipping!</Text>
            </View>
          ) : (
            <View style={s.nearFreeAlert}>
              <Ionicons name="information-circle-outline" size={16} color={C.amber} />
              <Text style={s.nearFreeText}>
                Add ₱{(5000 - itemsPrice).toFixed(2)} more for free shipping
              </Text>
            </View>
          )}

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tax (12% VAT)</Text>
            <Text style={s.summaryValue}>₱{taxPrice.toFixed(2)}</Text>
          </View>
          <View style={s.divider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>₱{totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* ── Delivery Info Card ─────────────────────────────────────── */}
      <View style={s.card}>
        <View style={s.cardBody}>
          <View style={s.deliveryInfoRow}>
            <Ionicons name="time-outline" size={18} color={C.sage} />
            <Text style={s.deliveryInfoText}>Estimated delivery: 3–5 business days</Text>
          </View>
          <View style={s.deliveryInfoRow}>
            <Ionicons name="refresh-outline" size={18} color={C.sage} />
            <Text style={s.deliveryInfoText}>30-day return policy</Text>
          </View>
        </View>
      </View>

      {/* ── Actions ────────────────────────────────────────────────── */}
      <TouchableOpacity style={s.primaryBtn} onPress={handleProceed} activeOpacity={0.85}>
        <Ionicons name="lock-closed-outline" size={18} color={C.white} />
        <Text style={s.primaryBtnText}>Proceed to Payment</Text>
      </TouchableOpacity>

      {/* ── FIX: navigates back to ShippingScreen ── */}
      <TouchableOpacity style={s.secondaryBtn} onPress={handleBack} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={16} color={C.sage} />
        <Text style={s.secondaryBtnText}>Back to Shipping</Text>
      </TouchableOpacity>

      <View style={s.secureNote}>
        <Ionicons name="shield-checkmark-outline" size={14} color={C.inkGray} />
        <Text style={s.secureNoteText}>Your information is secure</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <CheckoutSteps currentStep="confirm" />

      {/* THE FIX: explicit pixel height, same pattern as Cart / OrderDetails */}
      <ScrollView
        style={{ height: windowHeight, backgroundColor: IS_WEB ? C.webBg : C.bg }}
        contentContainerStyle={IS_WEB ? webS.scrollContent : s.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Web: centered column (maxWidth 620 — same as ShippingScreen) */}
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
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 1px 6px rgba(0,0,0,0.06)' } as any,
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    backgroundColor: C.mist,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.inkSoft,
    flex: 1,
  },
  cardBadge: {
    backgroundColor: C.sage,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardBadgeText: {
    color: C.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
  },

  // ── Info rows ─────────────────────────────────────────────────────────────
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: C.inkGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: C.inkSoft,
    fontWeight: '500',
  },

  // ── Order item row ─────────────────────────────────────────────────────────
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: C.sagePale,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.inkSoft,
    marginBottom: 2,
  },
  orderItemQtyPrice: {
    fontSize: 12,
    color: C.gray,
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: C.sage,
  },

  // ── Collapsible toggle ─────────────────────────────────────────────────────
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: C.sageTint,
    borderWidth: 1,
    borderColor: C.borderGreen,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.sage,
  },

  // ── Summary ───────────────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: C.grayMid,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryValueFree: {
    color: C.sage,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: C.inkSoft,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.sage,
  },

  // ── Shipping alerts ───────────────────────────────────────────────────────
  freeShippingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.sageTint,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderGreen,
  },
  freeShippingText: {
    fontSize: 12,
    color: C.sage,
    fontWeight: '500',
    flex: 1,
  },
  nearFreeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.amberBg,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.amberBorder,
  },
  nearFreeText: {
    fontSize: 12,
    color: C.amber,
    fontWeight: '500',
    flex: 1,
  },

  // ── Delivery info ─────────────────────────────────────────────────────────
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  deliveryInfoText: {
    fontSize: 13,
    color: C.sageMed,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.sage,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios:     { shadowColor: C.sage, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.white,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderMed,
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: C.sage,
    fontSize: 15,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 20,
  },
  secureNoteText: {
    fontSize: 12,
    color: C.inkGray,
  },
});

// ─── Web-only styles (matches ShippingScreen exactly) ────────────────────────
const webS = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  // maxWidth 620 — same as ShippingScreen's centerColumn
  centerColumn: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 28,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
});

export default ConfirmOrderScreen;