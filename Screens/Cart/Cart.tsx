import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { CartScreenProps } from '../../Navigation/AppNavigator';
import { CartItem, getCart, saveCart, isLoggedIn } from './cartUtils';

// ─── Alert helper ─────────────────────────────────────────────────────────────
function crossAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// ─── Optimistic cart mutation ─────────────────────────────────────────────────
async function mutateCart(
  current: CartItem[],
  transform: (cart: CartItem[]) => CartItem[],
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>,
) {
  const next = transform(current).filter((i) => i != null && !!i.product);
  setCartItems(next);
  await saveCart(next);
  const confirmed = await getCart();
  setCartItems(confirmed.filter((i) => i != null && !!i.product));
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible, title, message,
  confirmLabel = 'Confirm',
  confirmColor = '#c0392b',
  onConfirm, onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
    <TouchableOpacity style={ms.backdrop} activeOpacity={1} onPress={onCancel}>
      <TouchableOpacity activeOpacity={1} style={ms.card}>
        <View style={[ms.iconCircle, { backgroundColor: confirmColor + '22' }]}>
          <Ionicons name="trash-outline" size={28} color={confirmColor} />
        </View>
        <Text style={ms.title}>{title}</Text>
        <Text style={ms.message}>{message}</Text>
        <View style={ms.row}>
          <TouchableOpacity style={ms.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={ms.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ms.confirmBtn, { backgroundColor: confirmColor }]} onPress={onConfirm} activeOpacity={0.85}>
            <Text style={ms.confirmText}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, width: '100%', maxWidth: 360, alignItems: 'center', elevation: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#555' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Heights ──────────────────────────────────────────────────────────────────
const HEADER_HEIGHT  = 64;   // header bar
const SUMMARY_HEIGHT = 220;  // summary bar (approx, adjust if needed)

// ─── Main Cart Component ──────────────────────────────────────────────────────
const Cart: React.FC<CartScreenProps> = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();

  const [cartItems, setCartItems]   = useState<CartItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [modal, setModal] = useState<{
    visible: boolean; title: string; message: string;
    confirmLabel: string; confirmColor: string; onConfirm: () => void;
  }>({ visible: false, title: '', message: '', confirmLabel: 'Confirm', confirmColor: '#c0392b', onConfirm: () => {} });

  const showConfirm = useCallback((title: string, message: string, confirmLabel: string, onConfirm: () => void, confirmColor = '#c0392b') => {
    setModal({ visible: true, title, message, confirmLabel, confirmColor, onConfirm });
  }, []);
  const hideModal = useCallback(() => setModal((p) => ({ ...p, visible: false })), []);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) { navigation.replace('LoginScreen' as any); return; }
      const cart = await getCart();
      setCartItems(cart.filter((i) => i != null && !!i.product));
    } catch {
      crossAlert('Error', 'Failed to load cart.');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => { loadCart(); }, [loadCart]));

  const increaseQty = useCallback(async (item: CartItem) => {
    if (item.quantity >= item.stock || updatingId) return;
    setUpdatingId(item.product);
    try {
      await mutateCart(cartItems,
        (cart) => cart.map((i) => i.product === item.product ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i),
        setCartItems);
    } finally { setUpdatingId(null); }
  }, [cartItems, updatingId]);

  const decreaseQty = useCallback(async (item: CartItem) => {
    if (item.quantity <= 1 || updatingId) return;
    setUpdatingId(item.product);
    try {
      await mutateCart(cartItems,
        (cart) => cart.map((i) => i.product === item.product ? { ...i, quantity: Math.max(i.quantity - 1, 1) } : i),
        setCartItems);
    } finally { setUpdatingId(null); }
  }, [cartItems, updatingId]);

  const removeItem = useCallback((productId: string) => {
    showConfirm('Remove Item', 'Remove this item from your cart?', 'Remove', async () => {
      hideModal();
      setUpdatingId(productId);
      try {
        await mutateCart(cartItems, (cart) => cart.filter((i) => i.product !== productId), setCartItems);
      } catch { crossAlert('Error', 'Failed to remove item.'); }
      finally { setUpdatingId(null); }
    });
  }, [cartItems, showConfirm, hideModal]);

  const clearCart = useCallback(() => {
    showConfirm('Clear Cart', 'Remove all items? This cannot be undone.', 'Clear All', async () => {
      hideModal();
      setUpdatingId('clearing');
      try { await mutateCart(cartItems, () => [], setCartItems); }
      catch { crossAlert('Error', 'Failed to clear cart.'); }
      finally { setUpdatingId(null); }
    });
  }, [cartItems, showConfirm, hideModal]);

  const handleCheckout = useCallback(async () => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) { navigation.replace('LoginScreen' as any); return; }
    navigation.navigate('ShippingScreen');
  }, [navigation]);

  const totalUnits = cartItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cartItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const isClearing = updatingId === 'clearing';

  // ── THE FIX: compute exact pixel height for the FlatList ──────────────────
  // windowHeight - header - summary = exact space the list can use.
  // This gives the FlatList a hard bounded height so it MUST scroll internally.
  const listHeight = windowHeight - HEADER_HEIGHT - SUMMARY_HEIGHT;

  const renderItem = useCallback(({ item }: { item: CartItem }) => {
    const isUpdating  = updatingId === item.product;
    const canDecrease = item.quantity > 1 && !isUpdating && !isClearing;
    const canIncrease = item.quantity < item.stock && !isUpdating && !isClearing;

    return (
      <View style={s.card}>
        <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { productId: item.product })} activeOpacity={0.85}>
          <Image source={{ uri: item.image || undefined }} style={s.image} defaultSource={require('../../assets/logo.png')} />
        </TouchableOpacity>

        <View style={s.details}>
          <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { productId: item.product })}>
            <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          </TouchableOpacity>
          <Text style={s.price}>₱{item.price.toFixed(2)} each</Text>
          <Text style={s.stock}>{item.stock} in stock</Text>

          <View style={s.qtyRow}>
            <TouchableOpacity style={[s.qtyBtn, !canDecrease && s.qtyBtnOff]} onPress={() => decreaseQty(item)} disabled={!canDecrease} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="remove" size={16} color={canDecrease ? '#3d6b22' : '#ccc'} />
            </TouchableOpacity>

            {isUpdating
              ? <ActivityIndicator size="small" color="#3d6b22" style={{ width: 32 }} />
              : <Text style={s.qtyVal}>{item.quantity}</Text>}

            <TouchableOpacity style={[s.qtyBtn, !canIncrease && s.qtyBtnOff]} onPress={() => increaseQty(item)} disabled={!canIncrease} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add" size={16} color={canIncrease ? '#3d6b22' : '#ccc'} />
            </TouchableOpacity>

            <Text style={s.subtotal}>₱{(item.quantity * item.price).toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[s.deleteBtn, (isUpdating || isClearing) && { opacity: 0.3 }]} onPress={() => removeItem(item.product)} disabled={isUpdating || isClearing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {isUpdating ? <ActivityIndicator size="small" color="#c0392b" /> : <Ionicons name="trash-outline" size={18} color="#c0392b" />}
        </TouchableOpacity>
      </View>
    );
  }, [updatingId, isClearing, navigation, increaseQty, decreaseQty, removeItem]);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#3d6b22" />
          <Text style={s.loadingText}>Loading cart…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ConfirmModal
        visible={modal.visible} title={modal.title} message={modal.message}
        confirmLabel={modal.confirmLabel} confirmColor={modal.confirmColor}
        onConfirm={modal.onConfirm} onCancel={hideModal}
      />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.navigate('MainTabs')} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color="#2e4420" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Cart</Text>
        {cartItems.length > 0
          ? <TouchableOpacity onPress={clearCart} disabled={isClearing} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {isClearing ? <ActivityIndicator size="small" color="#c0392b" /> : <Text style={s.clearText}>Clear</Text>}
            </TouchableOpacity>
          : <View style={{ width: 48 }} />
        }
      </View>

      {cartItems.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="cart-outline" size={80} color="#c8e0b0" />
          <Text style={s.emptyTitle}>Your cart is empty</Text>
          <Text style={s.emptySub}>Add some products to get started!</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('MainTabs')} activeOpacity={0.85}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={s.shopBtnText}>Browse Marketplace</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/*
           * THE FIX: explicit pixel height = window - header - summary.
           * This forces the FlatList to have a hard bounded height,
           * so content that overflows MUST scroll internally.
           * Works on web AND mobile regardless of parent overflow settings.
           */}
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.product}
            renderItem={renderItem}
            style={[s.list, { height: listHeight }]}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={true}
            ListHeaderComponent={
              <Text style={s.itemCount}>{totalUnits} item{totalUnits !== 1 ? 's' : ''} in cart</Text>
            }
          />

          {/* Sticky summary — always visible below the list */}
          <View style={s.summary}>
            <View style={s.summaryInner}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Items ({totalUnits})</Text>
                <Text style={s.summaryValue}>₱{totalPrice.toFixed(2)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Shipping</Text>
                <Text style={[s.summaryValue, { color: '#aaa', fontStyle: 'italic', fontWeight: '400' }]}>Calculated at checkout</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Est. Total</Text>
                <Text style={s.totalValue}>₱{totalPrice.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={s.checkoutBtn} onPress={handleCheckout} activeOpacity={0.85}>
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={s.checkoutText}>Proceed to Checkout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.continueBtn} onPress={() => navigation.navigate('MainTabs')} activeOpacity={0.8}>
                <Text style={s.continueText}>← Continue Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#e8f2de' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#7a9460', fontSize: 14 },

  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#f4faed',
    borderBottomWidth: 1, borderBottomColor: '#e8f0e0',
  },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e4f0d8', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2e4420' },
  clearText:   { fontSize: 13, color: '#c0392b', fontWeight: '600', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fdf0ee', overflow: 'hidden' },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#2e4420', marginTop: 8 },
  emptySub:   { fontSize: 14, color: '#888', textAlign: 'center' },
  shopBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3d6b22', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginTop: 8 },
  shopBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },

  // FlatList — height set dynamically via listHeight, do NOT use flex here
  list:        { backgroundColor: '#e8f2de' },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  itemCount:   { fontSize: 12, color: '#8aab6e', fontWeight: '700', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    flexDirection: 'row', backgroundColor: '#f4faed',
    borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#dceece', gap: 14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  image:    { width: 88, height: 88, borderRadius: 12, backgroundColor: '#d8edca' },
  details:  { flex: 1, gap: 4, justifyContent: 'center' },
  name:     { fontSize: 14, fontWeight: '700', color: '#2e4420', lineHeight: 20 },
  price:    { fontSize: 13, color: '#5a8c35', fontWeight: '500' },
  stock:    { fontSize: 11, color: '#aaa' },
  subtotal: { fontSize: 15, fontWeight: '800', color: '#2e4420', marginLeft: 'auto' },

  qtyRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn:    { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: '#3d6b22', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef7e4' },
  qtyBtnOff: { borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  qtyVal:    { fontSize: 15, fontWeight: '700', color: '#2e4420', minWidth: 26, textAlign: 'center' },
  deleteBtn: { alignSelf: 'flex-start', padding: 6, borderRadius: 8, backgroundColor: '#fdf0ee', marginTop: 2 },

  summary: {
    backgroundColor: '#f4faed',
    borderTopWidth: 1, borderTopColor: '#dceece',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  summaryInner: {
    paddingHorizontal: 20, paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 8, maxWidth: 640, width: '100%', alignSelf: 'center',
  },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#777' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#dceece', paddingTop: 10, marginTop: 2 },
  totalLabel:   { fontSize: 16, fontWeight: '700', color: '#2e4420' },
  totalValue:   { fontSize: 22, fontWeight: '800', color: '#3d6b22' },
  checkoutBtn:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3d6b22', paddingVertical: 15, borderRadius: 14, marginTop: 6,
    ...Platform.select({
      ios:     { shadowColor: '#3d6b22', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  continueBtn:  { alignItems: 'center', paddingVertical: 6 },
  continueText: { fontSize: 14, color: '#5a8c35', fontWeight: '500' },
});

export default Cart;