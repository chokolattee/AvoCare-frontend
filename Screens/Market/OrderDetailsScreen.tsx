import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../../config/api'
import type { RootStackParamList } from '../../Navigation/AppNavigator'

// ─── Types ────────────────────────────────────────────────────────────────────

type Nav = StackNavigationProp<RootStackParamList, 'OrderDetails'>

interface ShippingInfo {
  address: string
  city: string
  postalCode: string
  country: string
  phoneNo: string
}

interface OrderItem {
  product: string
  name: string
  quantity: number
  price: number
  image: string
}

interface PaymentInfo {
  id?: string
  status?: string
}

interface User {
  name: string
}

interface Order {
  _id: string
  shippingInfo: ShippingInfo
  orderItems: OrderItem[]
  paymentInfo: PaymentInfo
  user: User
  totalPrice: number
  itemsPrice?: number
  shippingPrice?: number
  taxPrice?: number
  orderStatus: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  createdAt: string
  deliveredAt?: string
}

// ─── Palette (matches ListOrders exactly) ─────────────────────────────────────
const C = {
  forest:      '#2d5016',
  sage:        '#3d6b22',
  sageMed:     '#5a8c35',
  sageLt:      '#7aad4e',
  sagePale:    '#e8f5dc',
  sageMid:     '#c8e8b0',
  sageTint:    '#f2fae9',
  ink:         '#111a0a',
  inkSoft:     '#2e4420',
  inkFaint:    '#7a9460',
  mist:        '#f7faf3',
  fog:         '#eef3e8',
  white:       '#ffffff',
  bg:          '#e8f2de',
  headerBg:    '#ddeece',
  border:      '#d5e8c0',
  borderSoft:  '#e8f2dc',
  borderMid:   '#c8e0b0',
  red:         '#b83232',
  redPale:     '#fdf0f0',
  redBorder:   '#efc0c0',
  amber:       '#f59e0b',
  amberPale:   '#fffbeb',
  amberBorder: '#fde68a',
  blue:        '#1565c0',
  bluePale:    '#e3f2fd',
  orange:      '#e65100',
  orangePale:  '#fff3e0',
}

// Same max width as ListOrders
const MAX_CONTENT_WIDTH = 960

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getToken = async (): Promise<string> => {
  try {
    return (
      (await AsyncStorage.getItem('jwt')) ||
      (await AsyncStorage.getItem('token')) ||
      ''
    )
  } catch {
    return ''
  }
}

const API = `${API_BASE_URL}/api`

const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const getStatusColors = (status: string): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'Delivered':  return { bg: C.sagePale,   text: C.forest,  border: C.sageMid }
    case 'Processing': return { bg: C.orangePale, text: C.orange,  border: '#ffd0a0' }
    case 'Shipped':    return { bg: C.bluePale,   text: C.blue,    border: '#b3d4f5' }
    case 'Cancelled':  return { bg: C.redPale,    text: C.red,     border: C.redBorder }
    default:           return { bg: C.fog,        text: C.inkFaint, border: C.border }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const OrderDetails: React.FC = () => {
  const navigation = useNavigation<Nav>()
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetails'>>()
  const { id } = route.params
  const { height: windowHeight } = useWindowDimensions()

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Partial<Order>>({})

  const getOrderDetails = async (orderId: string) => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${API}/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrder(data.order ?? {})
    } catch (err: any) {
      console.error('getOrderDetails error:', err?.response?.data ?? err?.message)
      Alert.alert('Error', 'Failed to fetch order details', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
        { text: 'Retry',   onPress: () => getOrderDetails(orderId) },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) getOrderDetails(id)
  }, [id])

  const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
  const isPaid = paymentInfo?.status === 'succeeded'
  const statusColors = getStatusColors(orderStatus ?? '')

  // Approximate header height
  const HEADER_HEIGHT = 80

  return (
    <SafeAreaView style={s.safeArea}>

      {/* ── Header (matches ListOrders style) ─────────────────────────────── */}
      <View style={s.headerBar}>
        <View style={s.headerContent}>
          <View style={s.headerTopRow}>
            <TouchableOpacity
              style={s.backButton}
              onPress={() => navigation.navigate('ListOrders')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color={C.sage} />
              <Text style={s.backText}>My Orders</Text>
            </TouchableOpacity>

            <Text style={s.headerTitle}>Order Details</Text>

            {/* Status badge in header */}
            {orderStatus ? (
              <View style={[s.statusBadge, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                <Text style={[s.statusBadgeText, { color: statusColors.text }]}>{orderStatus}</Text>
              </View>
            ) : (
              <View style={{ width: 80 }} />
            )}
          </View>

          {/* Order ID + date row */}
          {order._id && (
            <View style={s.headerMeta}>
              <Text style={s.headerOrderId}>#{order._id.slice(-8).toUpperCase()}</Text>
              {order.createdAt && (
                <Text style={s.headerOrderDate}>{formatDate(order.createdAt)}</Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={s.loadingText}>Loading order details…</Text>
        </View>
      ) : (
        <ScrollView
          style={{ height: windowHeight - HEADER_HEIGHT, backgroundColor: C.bg }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* All cards share this centered max-width wrapper */}
          <View style={s.contentWrapper}>

            {/* ── Order Items Card ───────────────────────────────────────── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="cart-outline" size={16} color={C.sage} />
                <Text style={s.cardTitle}>Order Items</Text>
                <View style={s.cardBadge}>
                  <Text style={s.cardBadgeText}>{orderItems?.length ?? 0}</Text>
                </View>
              </View>
              {orderItems?.map(item => (
                <View key={item.product} style={s.orderItemRow}>
                  <Image source={{ uri: item.image }} style={s.itemImage} resizeMode="cover" />
                  <View style={s.itemInfo}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('ProductDetail', { productId: item.product })}
                    >
                      <Text style={s.itemName}>{item.name}</Text>
                    </TouchableOpacity>
                    <Text style={s.itemQty}>
                      {item.quantity} × ₱{item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={s.itemTotal}>
                    ₱{(item.quantity * item.price).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Total Amount</Text>
                <Text style={s.totalAmount}>₱{totalPrice?.toFixed(2)}</Text>
              </View>
            </View>

            {/* ── Payment Status Card ────────────────────────────────────── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="card-outline" size={16} color={C.sage} />
                <Text style={s.cardTitle}>Payment Status</Text>
              </View>
              <View style={s.cardBody}>
                <View style={[
                  s.paymentBox,
                  {
                    borderColor: isPaid ? '#28a745' : C.red,
                    backgroundColor: isPaid ? 'rgba(40,167,69,0.08)' : C.redPale,
                  },
                ]}>
                  <Ionicons
                    name={isPaid ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={isPaid ? '#28a745' : C.red}
                  />
                  <Text style={[s.paymentStatus, { color: isPaid ? '#28a745' : C.red }]}>
                    {isPaid ? 'PAID' : 'NOT PAID'}
                  </Text>
                </View>
                {paymentInfo?.id && (
                  <View style={s.infoBox}>
                    <Text style={s.infoLabel}>Payment ID</Text>
                    <Text style={s.infoValue}>{paymentInfo.id}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Shipping Details Card ──────────────────────────────────── */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Ionicons name="location-outline" size={16} color={C.sage} />
                <Text style={s.cardTitle}>Shipping Details</Text>
              </View>
              <View style={s.cardBody}>
                {user && (
                  <View style={s.infoBox}>
                    <Text style={s.infoLabel}>Name</Text>
                    <Text style={s.infoValue}>{user.name}</Text>
                  </View>
                )}
                {shippingInfo?.phoneNo && (
                  <View style={s.infoBox}>
                    <Text style={s.infoLabel}>Phone</Text>
                    <Text style={s.infoValue}>📞 {shippingInfo.phoneNo}</Text>
                  </View>
                )}
                {shippingInfo && (
                  <View style={s.infoBox}>
                    <Text style={s.infoLabel}>Address</Text>
                    <Text style={s.infoValue}>
                      📍 {shippingInfo.address}{'\n'}
                      {shippingInfo.city}, {shippingInfo.postalCode}{'\n'}
                      {shippingInfo.country}
                    </Text>
                  </View>
                )}
                {order.deliveredAt && (
                  <View style={[s.infoBox, { borderColor: '#c3e6cb', backgroundColor: 'rgba(40,167,69,0.06)' }]}>
                    <Text style={s.infoLabel}>Delivered On</Text>
                    <Text style={[s.infoValue, { color: '#28a745' }]}>
                      ✅ {formatDate(order.deliveredAt)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Order Summary Card ─────────────────────────────────────── */}
            <View style={[s.card, s.cardLast]}>
              <View style={s.cardHeader}>
                <Ionicons name="receipt-outline" size={16} color={C.sage} />
                <Text style={s.cardTitle}>Order Summary</Text>
              </View>
              <View style={s.cardBody}>
                {order.itemsPrice !== undefined && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Subtotal</Text>
                    <Text style={s.summaryValue}>₱{order.itemsPrice.toFixed(2)}</Text>
                  </View>
                )}
                {order.shippingPrice !== undefined && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Shipping</Text>
                    <Text style={s.summaryValue}>₱{order.shippingPrice.toFixed(2)}</Text>
                  </View>
                )}
                {order.taxPrice !== undefined && (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Tax (12% VAT)</Text>
                    <Text style={s.summaryValue}>₱{order.taxPrice.toFixed(2)}</Text>
                  </View>
                )}
                <View style={s.divider} />
                <View style={s.summaryTotalRow}>
                  <Text style={s.summaryTotalLabel}>Total</Text>
                  <Text style={s.summaryTotal}>₱{totalPrice?.toFixed(2)}</Text>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // ── Header (identical structure to ListOrders) ─────────────────────────────
  headerBar: {
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 12,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  headerContent: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const },
  headerTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: '#f0f7e8', borderWidth: 1.5, borderColor: C.borderMid },
  backText:      { fontSize: 13, color: C.sageMed, fontWeight: '700' },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  headerMeta:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  headerOrderId: { fontSize: 13, fontWeight: '800', color: C.ink, letterSpacing: 0.8 },
  headerOrderDate: { fontSize: 11, color: C.inkFaint, fontWeight: '500' },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scrollContent:  { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  contentWrapper: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, gap: 12 },

  // ── States ─────────────────────────────────────────────────────────────────
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: C.inkFaint, fontSize: 15, fontWeight: '500' },

  // ── Cards (identical to ListOrders card style) ─────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: '#1a3a05', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.08)' } as any,
    }),
  },
  cardLast:  { marginBottom: 8 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    paddingBottom: 10,
    backgroundColor: C.mist,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  cardTitle: {
    flex: 1,
    color: C.inkSoft,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardBadge:     { backgroundColor: C.sage, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  cardBadgeText: { color: C.white, fontSize: 11, fontWeight: '700' },
  cardBody:      { padding: 14, gap: 8 },

  // ── Order item row ─────────────────────────────────────────────────────────
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  itemImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: C.sagePale, borderWidth: 1, borderColor: C.border },
  itemInfo:  { flex: 1, minWidth: 0 },
  itemName:  { color: C.inkSoft, fontSize: 13, fontWeight: '600', marginBottom: 3 },
  itemQty:   { color: C.inkFaint, fontSize: 12 },
  itemTotal: { color: C.forest, fontSize: 15, fontWeight: '800' },

  // ── Total row (bottom of items card) ──────────────────────────────────────
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.sageTint,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  totalLabel:  { color: C.inkFaint, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  totalAmount: { color: C.forest, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },

  // ── Payment box ────────────────────────────────────────────────────────────
  paymentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 4,
  },
  paymentStatus: { fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  // ── Info boxes ─────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: C.mist,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  infoLabel: { color: C.inkFaint, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 },
  infoValue: { color: C.inkSoft, fontSize: 14, fontWeight: '500', lineHeight: 22 },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: C.borderSoft, marginVertical: 10 },

  // ── Summary rows ───────────────────────────────────────────────────────────
  summaryRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  summaryLabel:    { color: C.inkFaint, fontSize: 14, fontWeight: '500' },
  summaryValue:    { color: C.inkSoft,  fontSize: 14, fontWeight: '700' },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { color: C.inkSoft, fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTotal:    { color: C.forest, fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
})

export default OrderDetails