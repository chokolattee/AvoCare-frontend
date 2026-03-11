import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { styles, MAX_CONTENT_WIDTH } from '../../Styles/MarketScreen.styles';
import {
  getCart,
  getCartCount,
  setProductQuantity,
  isLoggedIn,
  Product,
} from '../Cart/cartUtils';
import { getProducts, getCategories } from '../../Services/productApi';
import { Category } from '../../Types/product';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  Home: undefined;
  Community: undefined;
  Scan: undefined;
  Market: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  LoginScreen: undefined;
  Profile: undefined;
  ShippingScreen: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Market'>;
  route: RouteProp<RootStackParamList, 'Market'>;
};

const PADDING = 16;
const GAP = 14;

// ── Strict fixed card dimensions ──────────────────────────────────────────────
// Body uses absolute positioning — every element has an explicit `top` value
// so no external stylesheet padding or margin can ever push anything out of place.
const CARD_IMAGE_RATIO  = 0.85;   // imageHeight = cardWidth × ratio
const BODY_PAD_H        = 10;     // left/right padding inside body

// Absolute `top` for each element inside the body View
const CATEGORY_TOP = 8;
const CATEGORY_H   = 16;    // 1 line, fontSize 11, lineHeight 16

const NAME_TOP = CATEGORY_TOP + CATEGORY_H + 4;   // 28
const NAME_H   = 42;        // 2 lines @ lineHeight 21 — always reserves 2-line height

const FOOTER_TOP = NAME_TOP + NAME_H + 6;          // 76
const FOOTER_H   = 22;

const QTY_TOP = FOOTER_TOP + FOOTER_H + 10;        // 108
const QTY_H   = 36;

const BTN_TOP = QTY_TOP + QTY_H + 8;               // 152
const BTN_H   = 42;

// Total body height = button bottom + bottom padding
const CARD_BODY_HEIGHT = BTN_TOP + BTN_H + 10;     // 204

function getColumns(width: number): number {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MarketScreen: React.FC<Props> = ({ navigation }) => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartToast, setCartToast] = useState<{ qty: number; name: string } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWeb = Platform.OS === 'web';

  const effectiveWidth = isWeb
    ? Math.min(dimensions.width, MAX_CONTENT_WIDTH) - PADDING * 2
    : dimensions.width - PADDING * 2;
  const columns = getColumns(dimensions.width);
  const cardWidth   = Math.floor((effectiveWidth - GAP * (columns - 1)) / columns);
  const imageHeight = Math.floor(cardWidth * CARD_IMAGE_RATIO);
  const cardHeight  = imageHeight + CARD_BODY_HEIGHT; // always identical across all cards

  const refreshCartCount = useCallback(async () => {
    const count = await getCartCount();
    setCartCount(count);
  }, []);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [prodRes, catRes] = await Promise.all([
          getProducts({ status: 'active' }),
          getCategories(),
        ]);
        if (prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
          const initQty: Record<string, number> = {};
          prodRes.data.forEach((p: Product) => { initQty[p.id] = 1; });
          setQuantities(initQty);
        }
        if (catRes.success && catRes.data) setCategories(catRes.data);
      } catch {
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refreshCartCount);
    return unsubscribe;
  }, [navigation, refreshCartCount]);

  useEffect(() => { refreshCartCount(); }, [refreshCartCount]);

  // ─── Toast helper ─────────────────────────────────────────────────────
  const showCartToast = useCallback((qty: number, name: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setCartToast({ qty, name });
    toastTimer.current = setTimeout(() => setCartToast(null), 3500);
  }, []);

  // ─── Quantity helpers ──────────────────────────────────────────────────
  const getQty = (productId: string) => quantities[productId] ?? 1;

  const increaseQty = (productId: string, stock: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.min((prev[productId] ?? 1) + 1, stock),
    }));
  };

  const decreaseQty = (productId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max((prev[productId] ?? 1) - 1, 1),
    }));
  };

  // ─── Add to cart ───────────────────────────────────────────────────────
  const handleAddToCart = useCallback(
    async (product: Product) => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        setShowLoginModal(true);
        return;
      }

      if (product.stock === 0 || product.is_out_of_stock) {
        Alert.alert('Out of Stock', 'This product is currently unavailable.');
        return;
      }

      const qty = getQty(product.id);
      setAddingToCart(product.id);

      try {
        const cart = await getCart();
        const existing = cart.find((i) => i.product === product.id);
        const prevQty = existing ? existing.quantity : 0;
        const newQty = prevQty + qty;

        if (newQty > product.stock) {
          Alert.alert(
            'Insufficient Stock',
            `Only ${product.stock - prevQty} more unit(s) can be added.`,
          );
          return;
        }

        await setProductQuantity(product, newQty);
        await refreshCartCount();
        setQuantities((prev) => ({ ...prev, [product.id]: 1 }));

        if (isWeb) {
          showCartToast(qty, product.name);
        } else {
          Alert.alert(
            'Added to Cart',
            `${qty} × ${product.name} added to your cart.`,
            [
              { text: 'Continue Shopping', style: 'cancel' },
              { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
            ],
          );
        }
      } catch {
        if (isWeb) {
          showCartToast(-1, '');
        } else {
          Alert.alert('Error', 'Failed to add to cart.');
        }
      } finally {
        setAddingToCart(null);
      }
    },
    [navigation, refreshCartCount, quantities, isWeb, showCartToast],
  );

  // ─── Filtering ─────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category.id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedCatName =
    selectedCategory === 'all'
      ? 'All'
      : (categories.find((c) => c.id === selectedCategory)?.name ?? 'All');

  const selectCategory = (id: string) => {
    setSelectedCategory(id);
    setDropdownOpen(false);
  };

  const centeredCol = isWeb
    ? { width: '100%' as const, maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const }
    : { width: '100%' as const };

  // ─── Render card ───────────────────────────────────────────────────────
  // Key rule: card has an explicit fixed height = imageHeight + CARD_BODY_HEIGHT
  // Inside body, text sections have fixed heights via numberOfLines + minHeight,
  // and the action group is pinned to the bottom with flex layout.
  const renderCard = useCallback(
    (product: Product) => {
      const thumb = product.images?.[0];
      const isOOS = product.is_out_of_stock || product.stock === 0;
      const isAdding = addingToCart === product.id;
      const qty = getQty(product.id);

      return (
        <TouchableOpacity
          key={product.id}
          style={[
            styles.card,
            {
              width: cardWidth,
              height: cardHeight,          // ← explicit fixed height
              overflow: 'hidden',          // clip anything that overflows
            },
          ]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
        >
          {/* ── Image block — fixed height ── */}
          <View style={[styles.cardImageWrap, { height: imageHeight }]}>
            {thumb ? (
              <Image
                source={{ uri: thumb }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="leaf-outline" size={32} color="#a5c890" />
                <Text style={styles.cardImagePlaceholderText}>No image</Text>
              </View>
            )}
            {isOOS && (
              <View style={styles.oosOverlay}>
                <Text style={styles.oosText}>Out of Stock</Text>
              </View>
            )}
            {(product.images?.length ?? 0) > 1 && (
              <View style={styles.imageCountBadge}>
                <Ionicons name="images-outline" size={11} color="#fff" />
                <Text style={styles.imageCountText}>{product.images!.length}</Text>
              </View>
            )}
          </View>

          {/* ── Body — absolutely positioned so no stylesheet can shift anything ── */}
          <View
            style={{
              width: cardWidth,
              height: CARD_BODY_HEIGHT,
              position: 'relative',
              overflow: 'hidden',
              // Reset any padding the shared `styles.cardBody` might apply
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
            }}
          >
            {/* Category — 1 line */}
            <Text
              style={[
                styles.cardCategory,
                {
                  position: 'absolute',
                  top: CATEGORY_TOP,
                  left: BODY_PAD_H,
                  right: BODY_PAD_H,
                  height: CATEGORY_H,
                  lineHeight: CATEGORY_H,
                  // Wipe any inherited margin
                  margin: 0,
                  padding: 0,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {product.category.name}
            </Text>

            {/* Name — always 2 lines of height, even if 1 line of text */}
            <Text
              style={[
                styles.cardName,
                {
                  position: 'absolute',
                  top: NAME_TOP,
                  left: BODY_PAD_H,
                  right: BODY_PAD_H,
                  height: NAME_H,
                  lineHeight: 21,
                  margin: 0,
                  padding: 0,
                },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {product.name}
            </Text>

            {/* Price + stock badge */}
            <View
              style={[
                styles.cardFooter,
                {
                  position: 'absolute',
                  top: FOOTER_TOP,
                  left: BODY_PAD_H,
                  right: BODY_PAD_H,
                  height: FOOTER_H,
                  margin: 0,
                  padding: 0,
                  alignItems: 'center',
                },
              ]}
            >
              <Text style={styles.cardPrice}>₱{product.price.toFixed(2)}</Text>
              <View style={[styles.stockBadge, isOOS && styles.stockBadgeOOS]}>
                <Text style={[styles.stockText, isOOS && styles.stockTextOOS]}>
                  {isOOS ? 'OOS' : String(product.stock)}
                </Text>
              </View>
            </View>

            {/* Qty stepper — always rendered at exactly QTY_TOP.
                OOS cards: invisible (opacity 0) but still occupies space
                so the button always lands at exactly BTN_TOP. */}
            <View
              style={[
                cardCartStyles.qtyRow,
                {
                  position: 'absolute',
                  top: QTY_TOP,
                  left: BODY_PAD_H,
                  right: BODY_PAD_H,
                  height: QTY_H,
                  margin: 0,
                },
                isOOS && { opacity: 0 },
              ]}
              pointerEvents={isOOS ? 'none' : 'auto'}
            >
              <TouchableOpacity
                style={[cardCartStyles.qtyBtn, qty <= 1 && cardCartStyles.qtyBtnDisabled]}
                onPress={() => decreaseQty(product.id)}
                disabled={qty <= 1}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="remove" size={14} color={qty <= 1 ? '#ccc' : '#3d6b22'} />
              </TouchableOpacity>
              <Text style={cardCartStyles.qtyText}>{qty}</Text>
              <TouchableOpacity
                style={[cardCartStyles.qtyBtn, qty >= product.stock && cardCartStyles.qtyBtnDisabled]}
                onPress={() => increaseQty(product.id, product.stock)}
                disabled={qty >= product.stock}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="add" size={14} color={qty >= product.stock ? '#ccc' : '#3d6b22'} />
              </TouchableOpacity>
            </View>

            {/* Add to Cart — always at exactly BTN_TOP regardless of anything above */}
            <TouchableOpacity
              style={[
                cardCartStyles.btn,
                {
                  position: 'absolute',
                  top: BTN_TOP,
                  left: BODY_PAD_H,
                  right: BODY_PAD_H,
                  height: BTN_H,
                  margin: 0,
                },
                isOOS && cardCartStyles.btnDisabled,
              ]}
              onPress={() => handleAddToCart(product)}
              disabled={isOOS || isAdding}
              activeOpacity={0.8}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={14} color={isOOS ? '#aaa' : '#fff'} />
                  <Text style={[cardCartStyles.btnText, isOOS && cardCartStyles.btnTextDisabled]}>
                    {isOOS ? 'Unavailable' : 'Add to Cart'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [cardWidth, cardHeight, imageHeight, navigation, addingToCart, quantities, handleAddToCart],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ══ LOGIN REQUIRED POPUP ══ */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={loginModalStyles.overlay}>
          <View style={loginModalStyles.card}>
            <View style={loginModalStyles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={32} color="#3d6b22" />
            </View>
            <Text style={loginModalStyles.title}>Login Required</Text>
            <Text style={loginModalStyles.body}>
              Please log in to add items to your cart and start shopping.
            </Text>
            <TouchableOpacity
              style={loginModalStyles.loginBtn}
              activeOpacity={0.85}
              onPress={() => {
                setShowLoginModal(false);
                (navigation as any).navigate('LoginScreen');
              }}
            >
              <Text style={loginModalStyles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={loginModalStyles.cancelBtn}
              activeOpacity={0.7}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={loginModalStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ CART TOAST (web only) ══ */}
      {isWeb && cartToast && cartToast.qty > 0 && (
        <View style={toastStyles.overlay} pointerEvents="box-none">
          <View style={toastStyles.toast}>
            <View style={toastStyles.iconWrap}>
              <Ionicons name="checkmark-circle" size={22} color="#3d6b22" />
            </View>
            <View style={toastStyles.textWrap}>
              <Text style={toastStyles.title}>Added to Cart</Text>
              <Text style={toastStyles.body} numberOfLines={2}>
                {cartToast.qty} × {cartToast.name}
              </Text>
            </View>
            <View style={toastStyles.actions}>
              <TouchableOpacity
                style={toastStyles.viewCartBtn}
                onPress={() => { setCartToast(null); navigation.navigate('Cart'); }}
                activeOpacity={0.8}
              >
                <Text style={toastStyles.viewCartText}>View Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCartToast(null)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={toastStyles.closeBtn}
              >
                <Ionicons name="close" size={16} color="#7aad4e" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.outerScroll}
        contentContainerStyle={styles.outerScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setDropdownOpen(false)}
      >
        {/* ══ HEADER ══ */}
        <View style={styles.headerBar}>
          <View style={centeredCol}>
            <View style={styles.headerInner}>
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleRow}>
                  <Text style={styles.headerTitle}>Marketplace</Text>
                  <View style={styles.headerDot} />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={styles.headerCount}>
                    {loading ? '…' : `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`}
                  </Text>

                  <TouchableOpacity
                    onPress={async () => {
                      const loggedIn = await isLoggedIn();
                      if (!loggedIn) { setShowLoginModal(true); return; }
                      navigation.navigate('Cart');
                    }}
                    style={cardCartStyles.cartIcon}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cart-outline" size={24} color="#3d6b22" />
                    {cartCount > 0 && (
                      <View style={cardCartStyles.badge}>
                        <Text style={cardCartStyles.badgeText}>
                          {cartCount > 99 ? '99+' : cartCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlsRow}>
                <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
                  <Ionicons name="search-outline" size={17} color="#7aad4e" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search products…"
                    placeholderTextColor="#a8c48a"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={16} color="#a8c48a" />
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.categoryTrigger, dropdownOpen && styles.categoryTriggerOpen]}
                  onPress={() => setDropdownOpen((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="filter-outline"
                    size={14}
                    color={dropdownOpen ? '#fff' : '#5a8c35'}
                  />
                  <Text
                    style={[
                      styles.categoryTriggerText,
                      dropdownOpen && styles.categoryTriggerTextOpen,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCatName}
                  </Text>
                  <Ionicons
                    name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={dropdownOpen ? '#fff' : '#5a8c35'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ══ DROPDOWN ══ */}
        {dropdownOpen && (
          <View style={styles.dropdownPanel}>
            <View style={[styles.dropdownPanelInner, centeredCol]}>
              <View style={styles.dropdownPanelHeader}>
                <Text style={styles.dropdownPanelHeaderText}>Filter by Category</Text>
                <TouchableOpacity
                  style={styles.dropdownCloseBtn}
                  onPress={() => setDropdownOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={14} color="#4a6635" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.dropdownScrollView}
                showsVerticalScrollIndicator
                bounces={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedCategory === 'all' && styles.dropdownItemActive,
                  ]}
                  onPress={() => selectCategory('all')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.dropdownDot, selectedCategory === 'all' && styles.dropdownDotActive]} />
                  <Text style={[styles.dropdownItemText, selectedCategory === 'all' && styles.dropdownItemTextActive]}>
                    All Categories
                  </Text>
                  {selectedCategory === 'all' && (
                    <View style={styles.dropdownCheckCircle}>
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>

                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.dropdownItem, selectedCategory === cat.id && styles.dropdownItemActive]}
                    onPress={() => selectCategory(cat.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.dropdownDot, selectedCategory === cat.id && styles.dropdownDotActive]} />
                    <Text style={[styles.dropdownItemText, selectedCategory === cat.id && styles.dropdownItemTextActive]}>
                      {cat.name}
                    </Text>
                    {selectedCategory === cat.id && (
                      <View style={styles.dropdownCheckCircle}>
                        <Ionicons name="checkmark" size={13} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ══ PRODUCT GRID ══ */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3d6b22" />
            <Text style={styles.loadingText}>Loading products…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={48} color="#b83232" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="leaf-outline" size={54} color="#c8e8b0" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubText}>Try a different search or category</Text>
          </View>
        ) : (
          <View style={[styles.feedWrap, centeredCol]}>
            <View style={styles.resultsBar}>
              <Text style={styles.resultsText}>
                {filtered.length} RESULT{filtered.length !== 1 ? 'S' : ''}
                {selectedCategory !== 'all' ? ` · ${selectedCatName}` : ''}
              </Text>
            </View>
            <View style={[styles.grid, { gap: GAP }]}>
              {filtered.map(renderCard)}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Toast styles ─────────────────────────────────────────────────────────────

const toastStyles = StyleSheet.create({
  overlay: {
    position: 'absolute' as any,
    bottom: 32,
    right: 24,
    zIndex: 9999,
    pointerEvents: 'box-none' as any,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3d6b22',
    maxWidth: 340,
    minWidth: 260,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: '#2e4420', marginBottom: 2 },
  body: { fontSize: 12, color: '#5a7a45' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewCartBtn: {
    backgroundColor: '#3d6b22', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12,
  },
  viewCartText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  closeBtn: { padding: 2 },
});

// ─── Card-level styles ────────────────────────────────────────────────────────

const cardCartStyles = StyleSheet.create({
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8faf7',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3d6b22',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddeece',
  },
  qtyBtnDisabled: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e4420',
    minWidth: 24,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3d6b22',
    borderRadius: 12,
  },
  btnDisabled: { backgroundColor: '#e0e0e0' },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  btnTextDisabled: { color: '#aaa' },
  cartIcon: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

// ─── Login modal styles ───────────────────────────────────────────────────────

const loginModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eaf4e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a0f',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#5a7a45',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#3d6b22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#8aaa72', fontSize: 14, fontWeight: '500' },
});

export default MarketScreen;