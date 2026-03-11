import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { myOrdersApi, cancelOrderApi, Order } from '../../Services/orderApi';
import { getMyReviewsApi, Review } from '../../Services/reviewApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  ListOrders: undefined;
  OrderDetails: { id: string };
  ListReviews: undefined;
  CreateReview: {
    orderId: string;
    items: { productId: string; name: string; image: string; price: number }[];
  };
  ViewReview: { reviewId: string };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ListOrders'>;
};

type OrderStatus = 'All' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

const TABS: OrderStatus[] = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Processing: 'time-outline',
  Shipped:    'cube-outline',
  Delivered:  'checkmark-circle-outline',
  Cancelled:  'close-circle-outline',
};

// ─── Palette ──────────────────────────────────────────────────────────────────
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
};

const MAX_CONTENT_WIDTH = 960;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  switch (status) {
    case 'Processing': return { pill: s.statusProcessing, text: s.statusTextProcessing };
    case 'Shipped':    return { pill: s.statusShipped,    text: s.statusTextShipped };
    case 'Delivered':  return { pill: s.statusDelivered,  text: s.statusTextDelivered };
    case 'Cancelled':  return { pill: s.statusCancelled,  text: s.statusTextCancelled };
    default:           return { pill: s.statusDefault,    text: s.statusTextDefault };
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function shortId(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

function resolveProductId(product: any): string {
  if (!product) return '';
  if (typeof product === 'string') return product;
  return (product as any)._id ?? (product as any).id ?? '';
}

function resolveOrderIdFromReview(order: Review['order']): string {
  if (!order) return '';
  if (typeof order === 'string') return order;
  return (order as any)._id ?? (order as any).id ?? '';
}

// ─── Cancel Reason Modal ─────────────────────────────────────────────────────

const CANCEL_REASONS = [
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery time is too long',
  'Duplicate order',
  'Other',
];

interface CancelModalProps {
  visible: boolean;
  orderId: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

function CancelReasonModal({ visible, orderId, onConfirm, onClose, isLoading }: CancelModalProps) {
  const [selected, setSelected] = useState(CANCEL_REASONS[0]);

  // Reset selection when modal opens
  React.useEffect(() => { if (visible) setSelected(CANCEL_REASONS[0]); }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={cs.backdrop}>
        <View style={cs.card}>
          <View style={cs.header}>
            <View style={cs.headerIconWrap}>
              <Ionicons name="close-circle-outline" size={24} color={C.red} />
            </View>
            <Text style={cs.title}>Cancel Order</Text>
            <Text style={cs.subtitle}>Order {shortId(orderId)}</Text>
          </View>

          <Text style={cs.label}>Please select a reason:</Text>

          <ScrollView style={cs.reasonsList} showsVerticalScrollIndicator={false}>
            {CANCEL_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[cs.reasonRow, selected === reason && cs.reasonRowActive]}
                onPress={() => setSelected(reason)}
                activeOpacity={0.75}
              >
                <View style={[cs.radio, selected === reason && cs.radioActive]}>
                  {selected === reason && <View style={cs.radioDot} />}
                </View>
                <Text style={[cs.reasonText, selected === reason && cs.reasonTextActive]}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={cs.actions}>
            <TouchableOpacity style={cs.keepBtn} onPress={onClose} activeOpacity={0.8} disabled={isLoading}>
              <Text style={cs.keepBtnText}>Keep Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cs.confirmBtn, isLoading && { opacity: 0.6 }]}
              onPress={() => onConfirm(selected)}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="close-circle-outline" size={16} color="#fff" />
                    <Text style={cs.confirmBtnText}>Cancel Order</Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cs = StyleSheet.create({
  backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card:            { backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 400, overflow: 'hidden', elevation: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16 },
  header:          { backgroundColor: C.redPale, paddingVertical: 20, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.redBorder },
  headerIconWrap:  { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fde0e0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title:           { fontSize: 18, fontWeight: '800', color: C.red, marginBottom: 2 },
  subtitle:        { fontSize: 13, color: '#a05050', fontWeight: '600' },
  label:           { fontSize: 13, fontWeight: '700', color: C.inkSoft, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  reasonsList:     { maxHeight: 280, paddingHorizontal: 20 },
  reasonRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6, backgroundColor: C.fog, borderWidth: 1.5, borderColor: 'transparent' },
  reasonRowActive: { backgroundColor: C.redPale, borderColor: C.redBorder },
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioActive:     { borderColor: C.red },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  reasonText:      { fontSize: 14, color: C.inkFaint, fontWeight: '500', flex: 1 },
  reasonTextActive:{ color: C.red, fontWeight: '700' },
  actions:         { flexDirection: 'row', gap: 10, padding: 20, paddingTop: 16 },
  keepBtn:         { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.fog, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  keepBtnText:     { fontSize: 14, fontWeight: '700', color: C.inkFaint },
  confirmBtn:      { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  confirmBtnText:  { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const { pill, text } = getStatusStyle(status);
  const icon = STATUS_ICONS[status];
  return (
    <View style={[s.statusPill, pill]}>
      {icon && <Ionicons name={icon} size={11} color={(text as any).color} />}
      <Text style={[s.statusText, text]}>{status}</Text>
    </View>
  );
}

// ─── ItemsPreview ─────────────────────────────────────────────────────────────

function ItemsPreview({ items }: { items: Order['orderItems'] }) {
  const preview   = items.slice(0, 2);
  const remaining = items.length - preview.length;
  return (
    <View style={s.itemsPreview}>
      {preview.map((item, i) => (
        <View key={i} style={s.itemRow}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={s.itemImage as any} resizeMode="cover" />
          ) : (
            <View style={s.itemImagePlaceholder}>
              <Ionicons name="leaf-outline" size={16} color="#a5c890" />
            </View>
          )}
          <View style={s.itemInfo}>
            <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.itemQtyPrice}>
              {item.quantity} × ₱{Number(item.price).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
      {remaining > 0 && (
        <Text style={s.moreItems}>+{remaining} more item{remaining > 1 ? 's' : ''}</Text>
      )}
    </View>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: Order;
  existingReview?: Review;
  onView: () => void;
  onCancel: () => void;
  onWriteReview: () => void;
  onViewReview: (reviewId: string) => void;
}

function OrderCard({ order, existingReview, onView, onCancel, onWriteReview, onViewReview }: OrderCardProps) {
  const canCancel = order.orderStatus === 'Processing';
  const canReview = order.orderStatus === 'Delivered';
  const hasReview = !!existingReview;
  const reviewId  = existingReview?._id ?? existingReview?.id ?? '';

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.orderId}>{shortId(order.id)}</Text>
          <Text style={s.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <StatusPill status={order.orderStatus} />
      </View>

      <View style={s.divider} />
      <ItemsPreview items={order.orderItems} />
      <View style={s.divider} />

      <View style={s.cardFooter}>
        <Text style={s.totalLabel}>Total</Text>
        <Text style={s.totalAmount}>₱{Number(order.totalPrice).toFixed(2)}</Text>
      </View>

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.viewBtn} onPress={onView} activeOpacity={0.8}>
          <Ionicons name="receipt-outline" size={14} color={C.sage} />
          <Text style={s.viewBtnText}>View Details</Text>
        </TouchableOpacity>

        {canCancel && (
          <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={14} color={C.red} />
            <Text style={s.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {canReview && (
          hasReview ? (
            <TouchableOpacity style={s.viewReviewBtn} onPress={() => onViewReview(reviewId)} activeOpacity={0.8}>
              <Ionicons name="star" size={14} color={C.amber} />
              <Text style={s.viewReviewBtnText}>View Review</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.reviewBtn} onPress={onWriteReview} activeOpacity={0.8}>
              <Ionicons name="star-outline" size={14} color={C.white} />
              <Text style={s.reviewBtnText}>Review</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ListOrdersScreen: React.FC<Props> = ({ navigation }) => {
  // THE FIX: explicit pixel height
  const { height: windowHeight } = useWindowDimensions();

  const [orders, setOrders]             = useState<Order[]>([]);
  const [myReviews, setMyReviews]       = useState<Review[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<OrderStatus>('All');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModal, setCancelModal]   = useState<{ visible: boolean; order: Order | null }>({
    visible: false, order: null,
  });

  const reviewByOrderId = React.useMemo(() => {
    const map = new Map<string, Review>();
    myReviews.forEach((r) => {
      const orderId = resolveOrderIdFromReview(r.order);
      if (orderId) map.set(orderId, r);
    });
    return map;
  }, [myReviews]);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [ordersRes, reviewsRes] = await Promise.all([myOrdersApi(), getMyReviewsApi()]);
      if (ordersRes.success && Array.isArray(ordersRes.orders)) {
        const sorted = [...ordersRes.orders].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setOrders(sorted);
      } else {
        setError(ordersRes.message ?? 'Failed to load orders.');
      }
      if (reviewsRes.success) setMyReviews(reviewsRes.data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load orders. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useFocusEffect(useCallback(() => { fetchData(true); }, [fetchData]));

  const onRefresh = useCallback(() => { setRefreshing(true); fetchData(true); }, [fetchData]);

  const handleCancel = useCallback((order: Order) => {
    setCancelModal({ visible: true, order });
  }, []);

  const confirmCancel = useCallback(async (reason: string) => {
    const order = cancelModal.order;
    if (!order) return;
    try {
      setCancellingId(order.id);
      const res = await cancelOrderApi(order.id, reason);
      if (res.success) {
        setCancelModal({ visible: false, order: null });
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, orderStatus: 'Cancelled' } : o));
        Alert.alert('Order Cancelled', 'Your order has been cancelled and a confirmation email has been sent.');
      } else {
        Alert.alert('Error', res.message ?? 'Failed to cancel order.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }, [cancelModal.order]);

  const filtered = activeTab === 'All' ? orders : orders.filter((o) => o.orderStatus === activeTab);
  const countFor = (tab: OrderStatus) => tab === 'All' ? orders.length : orders.filter((o) => o.orderStatus === tab).length;

  // Approximate header height (header bar + tabs)
  const HEADER_HEIGHT = 130;

  return (
    <SafeAreaView style={s.safeArea}>

      {/* ── Cancel Reason Modal ── */}
      <CancelReasonModal
        visible={cancelModal.visible}
        orderId={cancelModal.order?.id ?? ''}
        onConfirm={confirmCancel}
        onClose={() => setCancelModal({ visible: false, order: null })}
        isLoading={cancellingId !== null}
      />

      {/* ── Header ── */}
      <View style={s.headerBar}>
        <View style={s.headerContent}>
          <View style={s.headerTopRow}>
            <TouchableOpacity style={s.backButton} onPress={() => navigation.navigate('MainTabs')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color={C.sage} />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Orders</Text>
            <TouchableOpacity style={s.reviewsHeaderBtn} onPress={() => navigation.navigate('ListReviews')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="star" size={15} color={C.amber} />
              <Text style={s.reviewsHeaderBtnText}>My Reviews</Text>
            </TouchableOpacity>
          </View>

          {/* Status tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScrollContent}>
            <View style={s.tabsRow}>
              {TABS.map((tab) => {
                const count    = countFor(tab);
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity key={tab} style={[s.tab, isActive && s.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.75}>
                    <View style={s.tabInner}>
                      <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab}</Text>
                      {count > 0 && (
                        <View style={[s.tabCountBadge, isActive && s.tabCountBadgeActive]}>
                          <Text style={[s.tabCountText, isActive && s.tabCountTextActive]}>{count}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={s.loadingText}>Loading your orders…</Text>
        </View>
      ) : error ? (
        <View style={s.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={C.red} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchData()} style={s.retryBtn}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // THE FIX: explicit pixel height = windowHeight - header
        <ScrollView
          style={{ height: windowHeight - HEADER_HEIGHT, backgroundColor: C.bg }}
          contentContainerStyle={[s.scrollContent, filtered.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={true}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sage} colors={[C.sage]} />
            ) : undefined
          }
        >
          <View style={s.listInner}>
            {filtered.length === 0 ? (
              <View style={s.centered}>
                <Ionicons name="receipt-outline" size={54} color={C.sageMid} />
                <Text style={s.emptyText}>
                  {activeTab === 'All' ? 'No orders yet' : `No ${activeTab} orders`}
                </Text>
                <Text style={s.emptySubText}>
                  {activeTab === 'All' ? 'Your order history will appear here' : 'Switch tabs to see other orders'}
                </Text>
              </View>
            ) : (
              filtered.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  existingReview={reviewByOrderId.get(order.id)}
                  onView={() => navigation.navigate('OrderDetails', { id: order.id })}
                  onCancel={() => handleCancel(order)}
                  onWriteReview={() =>
                    navigation.navigate('CreateReview', {
                      orderId: order.id,
                      items: order.orderItems.map((item) => ({
                        productId: resolveProductId(item.product),
                        name:      item.name,
                        image:     item.image ?? '',
                        price:     item.price,
                      })),
                    })
                  }
                  onViewReview={() => navigation.navigate('ListReviews')}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Cancelling overlay ── */}
      {cancellingId !== null && (
        <View style={s.backdrop} pointerEvents="box-only">
          <View style={s.overlayBox}>
            <ActivityIndicator size="large" color={C.red} />
            <Text style={s.overlayBoxText}>Cancelling order…</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles (all inline) ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // ── Header ─────────────────────────────────────────────────────────────────
  headerBar: {
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 0,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  headerContent:  { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const },
  headerTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14 },
  backButton:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: '#f0f7e8', borderWidth: 1.5, borderColor: C.borderMid },
  backText:       { fontSize: 13, color: C.sageMed, fontWeight: '700' },
  headerTitle:    { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  reviewsHeaderBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: C.amberPale, borderWidth: 1.5, borderColor: C.amberBorder },
  reviewsHeaderBtnText: { fontSize: 12, fontWeight: '700', color: '#92400e' },

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabsScrollContent: { paddingBottom: 0 },
  tabsRow:           { flexDirection: 'row', gap: 2, paddingBottom: 0 },
  tab:               { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive:         { borderBottomColor: C.sage },
  tabInner:          { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabText:           { fontSize: 13, fontWeight: '600', color: C.inkFaint },
  tabTextActive:     { color: C.sage, fontWeight: '800' },
  tabCountBadge:       { backgroundColor: C.fog, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.border },
  tabCountBadgeActive: { backgroundColor: C.sage, borderColor: C.sage },
  tabCountText:        { fontSize: 10, fontWeight: '700', color: C.inkFaint },
  tabCountTextActive:  { color: C.white },

  // ── Scroll / List ──────────────────────────────────────────────────────────
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  listInner:     { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, gap: 12 },

  // ── States ─────────────────────────────────────────────────────────────────
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText:  { fontSize: 15, color: C.inkFaint },
  errorText:    { fontSize: 15, color: C.red, textAlign: 'center', paddingHorizontal: 24 },
  emptyText:    { fontSize: 17, fontWeight: '700', color: C.inkSoft },
  emptySubText: { fontSize: 13, color: C.inkFaint, textAlign: 'center', paddingHorizontal: 30 },
  retryBtn:     { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.sage, borderRadius: 8 },
  retryText:    { color: C.white, fontWeight: '700', fontSize: 14 },

  // ── Order Card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: '#1a3a05', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.08)' } as any,
    }),
  },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, paddingBottom: 10, backgroundColor: C.mist, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  orderId:     { fontSize: 13, fontWeight: '800', color: C.ink, letterSpacing: 0.8 },
  orderDate:   { fontSize: 11, color: C.inkFaint, marginTop: 2, fontWeight: '500' },

  // ── Status pill ────────────────────────────────────────────────────────────
  statusPill:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1 },
  statusText:          { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  statusProcessing:     { backgroundColor: C.orangePale, borderColor: '#ffd0a0' },
  statusTextProcessing: { color: C.orange },
  statusShipped:        { backgroundColor: C.bluePale,   borderColor: '#b3d4f5' },
  statusTextShipped:    { color: C.blue },
  statusDelivered:      { backgroundColor: C.sagePale,   borderColor: C.sageMid },
  statusTextDelivered:  { color: C.forest },
  statusCancelled:      { backgroundColor: C.redPale,    borderColor: C.redBorder },
  statusTextCancelled:  { color: C.red },
  statusDefault:        { backgroundColor: C.fog,        borderColor: C.border },
  statusTextDefault:    { color: C.inkFaint },

  divider: { height: 1, backgroundColor: C.borderSoft, marginHorizontal: 14 },

  // ── Items preview ──────────────────────────────────────────────────────────
  itemsPreview:       { gap: 8, padding: 14 },
  itemRow:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImage:          { width: 44, height: 44, borderRadius: 10, backgroundColor: C.sagePale, borderWidth: 1, borderColor: C.border },
  itemImagePlaceholder: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.sagePale, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  itemInfo:           { flex: 1 },
  itemName:           { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  itemQtyPrice:       { fontSize: 12, color: C.inkFaint, marginTop: 2 },
  moreItems:          { fontSize: 12, color: C.sageMed, fontStyle: 'italic', paddingLeft: 54 },

  // ── Card footer ────────────────────────────────────────────────────────────
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.sageTint, borderTopWidth: 1, borderTopColor: C.borderSoft },
  totalLabel:  { fontSize: 12, color: C.inkFaint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  totalAmount: { fontSize: 18, fontWeight: '900', color: C.forest, letterSpacing: -0.4 },

  // ── Action buttons ─────────────────────────────────────────────────────────
  actionsRow:       { flexDirection: 'row', gap: 8, padding: 12, paddingTop: 10 },
  viewBtn:          { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.sage, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, backgroundColor: C.white },
  viewBtnText:      { fontSize: 13, fontWeight: '700', color: C.sage },
  cancelBtn:        { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: C.redPale, borderWidth: 1.5, borderColor: C.redBorder, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  cancelBtnText:    { fontSize: 13, fontWeight: '700', color: C.red },
  reviewBtn:        { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: C.amber, borderWidth: 1.5, borderColor: '#d97706', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  reviewBtnText:    { fontSize: 13, fontWeight: '700', color: C.white },
  viewReviewBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.amberBorder, paddingVertical: 9, borderRadius: 10, backgroundColor: C.amberPale },
  viewReviewBtnText:{ fontSize: 13, fontWeight: '700', color: '#92400e' },

  // ── Overlay ────────────────────────────────────────────────────────────────
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  overlayBox:     { backgroundColor: C.white, borderRadius: 14, padding: 28, alignItems: 'center', gap: 12, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  overlayBoxText: { fontSize: 15, color: '#333', fontWeight: '600' },
});

export default ListOrdersScreen;