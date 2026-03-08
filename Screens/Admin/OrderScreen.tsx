import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Modal,
  ActivityIndicator, Platform, TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { getAuthToken } from '../Cart/cartUtils';
import { styles } from '../../Styles/OrderScreen.styles';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

interface OrderUser {
  _id?: string;
  name?: string;
  email?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  image: string;
  price: number;
  product: string;
}

interface ShippingInfo {
  address: string;
  city: string;
  postalCode: string;
  phoneNo: string;
  country: string;
}

interface Order {
  id: string;
  user: OrderUser | string;
  orderItems: OrderItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: { id: string; status: string };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  orderStatus: OrderStatus;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS: OrderStatus[] = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<OrderStatus, string> = {
  Processing: '#f59e0b',
  Shipped:    '#3b82f6',
  Delivered:  '#10b981',
  Cancelled:  '#ef4444',
};

const STATUS_BG: Record<OrderStatus, string> = {
  Processing: '#FFF8E6',
  Shipped:    '#EFF6FF',
  Delivered:  '#ECFDF5',
  Cancelled:  '#FEF2F2',
};

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
  Processing: 'time-outline',
  Shipped:    'airplane-outline',
  Delivered:  'checkmark-circle-outline',
  Cancelled:  'close-circle-outline',
};

const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  Processing: ['Processing', 'Shipped', 'Cancelled'],
  Shipped:    ['Shipped', 'Delivered'],
  Delivered:  [],
  Cancelled:  [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserName(user: OrderUser | string): string {
  if (!user) return 'Unknown';
  if (typeof user === 'string') return 'Customer';
  return user.name || user.email || 'Unknown';
}

function getInitials(user: OrderUser | string): string {
  const name = getUserName(user);
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function exportToCSV(orders: Order[]) {
  if (Platform.OS !== 'web') return;
  const rows = [
    ['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Date'],
    ...orders.map((o) => [
      o.id,
      getUserName(o.user),
      String(o.orderItems?.length ?? 0),
      `PHP ${(o.totalPrice ?? 0).toFixed(2)}`,
      o.orderStatus,
      formatDate(o.createdAt),
    ]),
  ];
  const csv  = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Confirm / Alert Popup Modal ──────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible, title, message,
  confirmLabel, confirmColor = '#2D5016',
  icon = 'information-circle', iconColor = '#2D5016',
  showCancel = true,
  onConfirm, onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.confirmOverlay}>
      <View style={styles.confirmCard}>
        {/* Icon */}
        <View style={[styles.confirmIconCircle, { backgroundColor: (iconColor ?? '#2D5016') + '1A' }]}>
          <Ionicons name={icon} size={30} color={iconColor} />
        </View>

        {/* Text */}
        <Text style={styles.confirmTitle}>{title}</Text>
        <Text style={styles.confirmMessage}>{message}</Text>

        {/* Buttons */}
        <View style={styles.confirmBtnRow}>
          {showCancel && (
            <TouchableOpacity style={styles.confirmBtnCancel} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.confirmBtnCancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.confirmBtnAction, { backgroundColor: confirmColor }]}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnActionText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Table Row ────────────────────────────────────────────────────────────────

interface RowProps {
  order: Order;
  index: number;
  onPress: () => void;
}

const TableRow: React.FC<RowProps> = ({ order, index, onPress }) => {
  const isEven = index % 2 === 0;
  const color  = STATUS_COLORS[order.orderStatus];
  const bg     = STATUS_BG[order.orderStatus];
  const icon   = STATUS_ICONS[order.orderStatus];
  const actionFiredRef = useRef(false);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        if (actionFiredRef.current) { actionFiredRef.current = false; return; }
        onPress();
      }}
      style={[styles.tableRow, isEven ? styles.tableRowEven : {}]}
    >
      {/* Order ID */}
      <View style={styles.colId}>
        <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Customer */}
      <View style={styles.colCustomer}>
        <View style={styles.userCellInner}>
          <View style={styles.tableAvatarPlaceholder}>
            <Text style={styles.tableAvatarInitials}>{getInitials(order.user)}</Text>
          </View>
          <Text style={styles.tableUserName} numberOfLines={2}>
            {getUserName(order.user)}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.colItems}>
        <Text style={[styles.tableCell, { fontWeight: '700' }]}>
          {order.orderItems?.length ?? 0}
        </Text>
      </View>

      {/* Total */}
      <View style={styles.colTotal}>
        <Text style={[styles.tableCell, { fontWeight: '700', color: '#4A7C2F' }]}>
          ₱{(order.totalPrice ?? 0).toFixed(0)}
        </Text>
      </View>

      {/* Status */}
      <View style={styles.colStatus}>
        <View style={[styles.badge, { backgroundColor: bg, borderColor: color }]}> 
          <Ionicons name={icon} size={14} color={color} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color, fontWeight: '700', fontSize: 12 }]}>{order.orderStatus}</Text>
        </View>
      </View>

      {/* Date */}
      <View style={styles.colDate}>
        <Text style={[styles.tableCell, { fontSize: 11, color: '#6A8A50' }]}>
          {formatDate(order.createdAt)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.colActions}>
        <View style={styles.actionsCellInner}>
          <TouchableOpacity
            style={styles.tableViewBtn}
            onPress={() => { actionFiredRef.current = true; onPress(); }}
          >
            <Ionicons name="eye-outline" size={14} color="#4A7C2F" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const OrderScreen: React.FC = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isDesktop = dimensions.width >= 768;

  // ── Data ────────────────────────────────────────────────────────────────
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating]     = useState(false);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');

  // ── Detail modal ─────────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [newStatus, setNewStatus]         = useState<OrderStatus>('Processing');

  // ── Confirm modal ─────────────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    showCancel: boolean;
    onConfirm: () => void;
  }>({
    visible: false, title: '', message: '',
    confirmLabel: 'OK', confirmColor: '#2D5016',
    icon: 'information-circle', iconColor: '#2D5016',
    showCancel: true, onConfirm: () => {},
  });

  const showConfirm = useCallback((opts: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    showCancel?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      visible: true,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel,
      confirmColor: opts.confirmColor ?? '#2D5016',
      icon: opts.icon ?? 'information-circle',
      iconColor: opts.iconColor ?? '#2D5016',
      showCancel: opts.showCancel ?? true,
      onConfirm: opts.onConfirm,
    });
  }, []);

  const hideConfirm = useCallback(() =>
    setConfirmModal((p) => ({ ...p, visible: false })), []);

  // ── Dimension listener ───────────────────────────────────────────────────
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window: w }) => setDimensions(w));
    return () => sub?.remove();
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = await getAuthToken();
      const { data } = await axios.get(`${API_BASE}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setOrders(data.orders ?? []);
      } else {
        showConfirm({
          title: 'Error',
          message: data.message || 'Failed to fetch orders.',
          confirmLabel: 'OK',
          confirmColor: '#ef4444',
          icon: 'alert-circle-outline',
          iconColor: '#ef4444',
          showCancel: false,
          onConfirm: hideConfirm,
        });
      }
    } catch (err: any) {
      showConfirm({
        title: 'Error',
        message: err?.response?.data?.message || 'Failed to fetch orders.',
        confirmLabel: 'OK',
        confirmColor: '#ef4444',
        icon: 'alert-circle-outline',
        iconColor: '#ef4444',
        showCancel: false,
        onConfirm: hideConfirm,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showConfirm, hideConfirm]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = () => { setRefreshing(true); fetchOrders(true); };

  // ── Filters ──────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.orderStatus === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      getUserName(o.user).toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Stats ────────────────────────────────────────────────────────────────
  const revenue    = orders.filter((o) => o.orderStatus !== 'Cancelled').reduce((s, o) => s + (o.totalPrice ?? 0), 0);
  const processing = orders.filter((o) => o.orderStatus === 'Processing').length;
  const shipped    = orders.filter((o) => o.orderStatus === 'Shipped').length;
  const delivered  = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelled  = orders.filter((o) => o.orderStatus === 'Cancelled').length;

  // ── Detail modal helpers ─────────────────────────────────────────────────
  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus);
    setDetailVisible(true);
  };
  const closeDetail = () => { setDetailVisible(false); setSelectedOrder(null); };

  // ── Update status ────────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    if (newStatus === selectedOrder.orderStatus) {
      showConfirm({
        title: 'No Change',
        message: 'The order is already set to that status.',
        confirmLabel: 'OK',
        icon: 'information-circle',
        iconColor: '#2D5016',
        showCancel: false,
        onConfirm: hideConfirm,
      });
      return;
    }

    showConfirm({
      title: 'Update Status',
      message: `Change order status to "${newStatus}"?`,
      confirmLabel: 'Update',
      confirmColor: '#2D5016',
      icon: 'refresh-circle-outline',
      iconColor: '#2D5016',
      onConfirm: async () => {
        hideConfirm();
        setUpdating(true);
        try {
          const token = await getAuthToken();
          const { data } = await axios.put(
            `${API_BASE}/api/admin/order/${selectedOrder.id}`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (data.success) {
            setOrders((prev) =>
              prev.map((o) => o.id === selectedOrder.id ? { ...o, orderStatus: newStatus } : o),
            );
            closeDetail();
            showConfirm({
              title: 'Updated!',
              message: `Order status changed to "${newStatus}".`,
              confirmLabel: 'OK',
              confirmColor: '#4A7C2F',
              icon: 'checkmark-circle-outline',
              iconColor: '#4A7C2F',
              showCancel: false,
              onConfirm: hideConfirm,
            });
          } else {
            showConfirm({
              title: 'Error',
              message: data.message || 'Failed to update order.',
              confirmLabel: 'OK',
              confirmColor: '#ef4444',
              icon: 'alert-circle-outline',
              iconColor: '#ef4444',
              showCancel: false,
              onConfirm: hideConfirm,
            });
          }
        } catch (err: any) {
          showConfirm({
            title: 'Error',
            message: err?.response?.data?.message || 'Failed to update.',
            confirmLabel: 'OK',
            confirmColor: '#ef4444',
            icon: 'alert-circle-outline',
            iconColor: '#ef4444',
            showCancel: false,
            onConfirm: hideConfirm,
          });
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.csvBtn}
              onPress={() => {
                if (filteredOrders.length === 0) {
                  showConfirm({
                    title: 'No Data',
                    message: 'No orders to export.',
                    confirmLabel: 'OK',
                    icon: 'information-circle',
                    iconColor: '#2D5016',
                    showCancel: false,
                    onConfirm: hideConfirm,
                  });
                  return;
                }
                exportToCSV(filteredOrders);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={14} color="#fff" />
              <Text style={styles.csvBtnText}>CSV</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
            {refreshing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { fontSize: 15 }]}>₱{revenue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: STATUS_COLORS.Processing }]}>{processing}</Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: STATUS_COLORS.Shipped }]}>{shipped}</Text>
          <Text style={styles.statLabel}>Shipped</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: STATUS_COLORS.Delivered }]}>{delivered}</Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: STATUS_COLORS.Cancelled }]}>{cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#6A8A50" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Order ID or customer…"
          placeholderTextColor="#A0B89A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#A0B89A" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter Tabs ─────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(['all', ...STATUS_OPTIONS] as const).map((st) => {
          const count = st === 'all' ? orders.length : orders.filter((o) => o.orderStatus === st).length;
          return (
            <TouchableOpacity
              key={st}
              style={[styles.filterTab, filterStatus === st && styles.filterTabActive]}
              onPress={() => setFilterStatus(st)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterTabText, filterStatus === st && styles.filterTabTextActive]}>
                {st === 'all' ? `🌿 All (${count})` :
                 st === 'Processing' ? `⏳ Processing (${count})` :
                 st === 'Shipped' ? `✈️ Shipped (${count})` :
                 st === 'Delivered' ? `✅ Delivered (${count})` :
                 `❌ Cancelled (${count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A7C2F" />
          <Text style={styles.loadingText}>Loading orders…</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different search term' : 'Nothing here yet'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          {/* Header */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.colId}>
              <Text style={styles.tableHeaderCell}>Order</Text>
            </View>
            <View style={styles.colCustomer}>
              <Text style={styles.tableHeaderCell}>Customer</Text>
            </View>
            <View style={styles.colItems}>
              <Text style={styles.tableHeaderCell}>Items</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.tableHeaderCell}>Total</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            <View style={styles.colDate}>
              <Text style={styles.tableHeaderCell}>Date</Text>
            </View>
            <View style={styles.colActions}>
              <Text style={styles.tableHeaderCell}>Actions</Text>
            </View>
          </View>

          {/* Rows */}
          <ScrollView
            style={styles.tableScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />
            }
          >
            {filteredOrders.map((order, index) => (
              <TableRow
                key={order.id}
                order={order}
                index={index}
                onPress={() => openDetail(order)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Order Detail Modal ───────────────────────────────────────────── */}
      <Modal visible={detailVisible} transparent animationType="slide" onRequestClose={closeDetail}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDesktop && styles.modalContainerDesktop]}>
            <View style={styles.modalHandle} />

            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Order Details</Text>
                {selectedOrder && (
                  <Text style={styles.modalSubtitle}>#{selectedOrder.id.slice(-8).toUpperCase()}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={closeDetail}>
                <Ionicons name="close" size={22} color="#2D5016" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Current Status Banner */}
                <View style={[
                  styles.statusBanner,
                  {
                    backgroundColor: STATUS_BG[selectedOrder.orderStatus],
                    borderColor: STATUS_COLORS[selectedOrder.orderStatus],
                  },
                ]}>
                  <Ionicons
                    name={STATUS_ICONS[selectedOrder.orderStatus]}
                    size={20}
                    color={STATUS_COLORS[selectedOrder.orderStatus]}
                  />
                  <Text style={[styles.statusBannerText, { color: STATUS_COLORS[selectedOrder.orderStatus] }]}>
                    {selectedOrder.orderStatus}
                  </Text>
                  <Text style={styles.statusBannerSub}>Current Status</Text>
                </View>

                {/* Customer & Shipping */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>👤 Customer & Shipping</Text>
                  <View style={styles.infoCard}>
                    {[
                      { icon: 'person-outline'   as const, label: 'Customer', value: getUserName(selectedOrder.user) },
                      { icon: 'mail-outline'     as const, label: 'Email',    value: typeof selectedOrder.user !== 'string' ? selectedOrder.user?.email || '—' : '—' },
                      { icon: 'call-outline'     as const, label: 'Phone',    value: selectedOrder.shippingInfo?.phoneNo || '—' },
                    ].map(({ icon, label, value }) => (
                      <View key={label}>
                        <View style={styles.infoRow}>
                          <View style={styles.infoIcon}>
                            <Ionicons name={icon} size={15} color="#4A7C2F" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>{label}</Text>
                            <Text style={styles.infoValue}>{value}</Text>
                          </View>
                        </View>
                        <View style={styles.infoDivider} />
                      </View>
                    ))}
                    <View style={styles.infoRow}>
                      <View style={styles.infoIcon}>
                        <Ionicons name="location-outline" size={15} color="#4A7C2F" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Shipping Address</Text>
                        <Text style={styles.infoValue}>
                          {selectedOrder.shippingInfo?.address}, {selectedOrder.shippingInfo?.city}
                        </Text>
                        <Text style={styles.infoSubValue}>
                          {selectedOrder.shippingInfo?.postalCode}, {selectedOrder.shippingInfo?.country}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Payment */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>💳 Payment</Text>
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Status</Text>
                        {(() => {
                          const isPaid = selectedOrder.paymentInfo?.status === 'succeeded';
                          return (
                            <View style={[styles.payBadge, { backgroundColor: isPaid ? '#10b981' : '#ef4444' }]}>
                              <Ionicons name={isPaid ? 'checkmark-circle' : 'close-circle'} size={13} color="#fff" />
                              <Text style={styles.payBadgeText}>{isPaid ? 'PAID' : 'NOT PAID'}</Text>
                            </View>
                          );
                        })()}
                      </View>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.infoLabel}>Payment ID</Text>
                        <Text style={[styles.infoValue, {
                          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                          fontSize: 11,
                        }]} numberOfLines={1}>
                          {selectedOrder.paymentInfo?.id || '—'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Order Items */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>🛒 Order Items ({selectedOrder.orderItems?.length ?? 0})</Text>
                  <View style={styles.infoCard}>
                    {(selectedOrder.orderItems ?? []).map((item, idx) => (
                      <View key={idx}>
                        <View style={styles.orderItemRow}>
                          <Image source={{ uri: item.image }} style={styles.itemImage} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                            <Text style={styles.itemMeta}>
                              Qty: {item.quantity} × ₱{item.price.toFixed(2)}
                            </Text>
                          </View>
                          <Text style={styles.itemTotal}>₱{(item.quantity * item.price).toFixed(2)}</Text>
                        </View>
                        {idx < (selectedOrder.orderItems.length - 1) && <View style={styles.infoDivider} />}
                      </View>
                    ))}
                  </View>
                </View>

                {/* Pricing */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>💰 Pricing</Text>
                  <View style={styles.infoCard}>
                    {[
                      { label: 'Subtotal',     value: selectedOrder.itemsPrice },
                      { label: 'Shipping',     value: selectedOrder.shippingPrice },
                      { label: 'Tax (12% VAT)', value: selectedOrder.taxPrice },
                    ].map(({ label, value }) => (
                      <View key={label} style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{label}</Text>
                        <Text style={styles.priceValue}>₱{(value ?? 0).toFixed(2)}</Text>
                      </View>
                    ))}
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceLabel, { fontWeight: '800', color: '#2D5016', fontSize: 15 }]}>
                        Grand Total
                      </Text>
                      <Text style={[styles.priceValue, { fontWeight: '800', color: '#4A7C2F', fontSize: 17 }]}>
                        ₱{(selectedOrder.totalPrice ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Timeline */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>📅 Timeline</Text>
                  <View style={styles.infoCard}>
                    {[
                      { label: 'Order Placed', value: selectedOrder.createdAt },
                      { label: 'Paid At',      value: selectedOrder.paidAt },
                      { label: 'Delivered At', value: selectedOrder.deliveredAt },
                    ].map(({ label, value }) => (
                      <View key={label} style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{label}</Text>
                        <Text style={styles.priceValue}>{formatDate(value)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Update Status */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>🔄 Update Status</Text>
                  {ALLOWED_NEXT[selectedOrder.orderStatus].length === 0 ? (
                    <View style={[
                      styles.finalStateBanner,
                      {
                        backgroundColor: selectedOrder.orderStatus === 'Delivered'
                          ? '#ECFDF5' : '#FEF2F2',
                      },
                    ]}>
                      <Ionicons
                        name={selectedOrder.orderStatus === 'Delivered' ? 'checkmark-circle' : 'close-circle'}
                        size={18}
                        color={selectedOrder.orderStatus === 'Delivered' ? '#10b981' : '#ef4444'}
                      />
                      <Text style={[
                        styles.finalStateText,
                        { color: selectedOrder.orderStatus === 'Delivered' ? '#065f46' : '#991b1b' },
                      ]}>
                        {selectedOrder.orderStatus === 'Delivered'
                          ? 'Order delivered. No further updates allowed.'
                          : 'Order cancelled. No further updates allowed.'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.infoCard}>
                      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
                        <Text style={styles.infoLabel}>Select new status:</Text>
                      </View>
                      <View style={styles.pickerWrap}>
                        <Picker
                          selectedValue={newStatus}
                          onValueChange={(v) => setNewStatus(v as OrderStatus)}
                          style={styles.picker}
                        >
                          {ALLOWED_NEXT[selectedOrder.orderStatus].map((st) => (
                            <Picker.Item key={st} label={st} value={st} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}
                </View>

                {/* Modal Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeDetail} activeOpacity={0.8}>
                    <Text style={styles.cancelBtnText}>Close</Text>
                  </TouchableOpacity>

                  {ALLOWED_NEXT[selectedOrder.orderStatus].length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        (updating || newStatus === selectedOrder.orderStatus) && { opacity: 0.5 },
                      ]}
                      onPress={handleUpdateStatus}
                      disabled={updating || newStatus === selectedOrder.orderStatus}
                      activeOpacity={0.85}
                    >
                      {updating
                        ? <ActivityIndicator size="small" color="#fff" />
                        : (
                          <>
                            <Ionicons name="checkmark-outline" size={16} color="#fff" />
                            <Text style={styles.saveBtnText}>Update Status</Text>
                          </>
                        )
                      }
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Confirm / Alert Popup ────────────────────────────────────────── */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmColor={confirmModal.confirmColor}
        icon={confirmModal.icon}
        iconColor={confirmModal.iconColor}
        showCancel={confirmModal.showCancel}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
      />

    </SafeAreaView>
  );
};

export default OrderScreen;