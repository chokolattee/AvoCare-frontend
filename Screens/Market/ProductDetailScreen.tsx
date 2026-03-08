import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Product } from '../../Types/product';
import { getProduct } from '../../Services/productApi';
import { getProductReviewsApi, Review } from '../../Services/reviewApi';
import {
  styles,
  DESKTOP_BREAKPOINT,
} from '../../Styles/ProductDetailScreen.styles';
import {
  getCart,
  setProductQuantity,
  getCartCount,
  isLoggedIn,
  CartItem,
} from '../Cart/cartUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  Market: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  LoginScreen: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'ProductDetail'>;
  route: RouteProp<RootStackParamList, 'ProductDetail'>;
};

// ─── Web-safe root container ──────────────────────────────────────────────────

const RootContainer = Platform.OS === 'web' ? View : SafeAreaView;

// ─── Image Carousel with Thumbnails ──────────────────────────────────────────

interface CarouselProps {
  images: string[];
  imageWidth: number;
  imageHeight: number;
}

const ImageCarousel: React.FC<CarouselProps> = ({ images, imageWidth, imageHeight }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
      setActiveIndex(idx);
    },
    [imageWidth],
  );

  const goTo = (idx: number) => {
    flatRef.current?.scrollToIndex({ index: idx, animated: true });
    setActiveIndex(idx);
  };

  if (!images || images.length === 0) {
    return (
      <View style={[styles.carouselPlaceholder, { width: imageWidth, height: imageHeight }]}>
        <Ionicons name="leaf-outline" size={52} color="#a5c890" />
        <Text style={styles.carouselPlaceholderText}>No images available</Text>
      </View>
    );
  }

  if (images.length === 1) {
    return (
      <View>
        <View style={[styles.carouselContainer, { width: imageWidth, height: imageHeight }]}>
          <Image source={{ uri: images[0] }} style={styles.carouselImage} resizeMode="cover" />
        </View>
        <View style={styles.thumbRow}>
          <View style={[styles.thumb, styles.thumbActive]}>
            <Image source={{ uri: images[0] }} style={styles.thumbImage} resizeMode="cover" />
          </View>
        </View>
      </View>
    );
  }

  const arrowTop = Math.floor(imageHeight / 2) - 19;

  return (
    <View style={{ width: imageWidth }}>
      <View style={[styles.carouselContainer, { height: imageHeight }]}>
        <FlatList
          ref={flatRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => (
            <View style={{ width: imageWidth, height: imageHeight, backgroundColor: '#e8f5dc' }}>
              <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />
            </View>
          )}
          getItemLayout={(_, i) => ({ length: imageWidth, offset: imageWidth * i, index: i })}
        />

        {activeIndex > 0 && (
          <TouchableOpacity style={[styles.arrowBtn, styles.arrowLeft, { top: arrowTop }]} onPress={() => goTo(activeIndex - 1)} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
        {activeIndex < images.length - 1 && (
          <TouchableOpacity style={[styles.arrowBtn, styles.arrowRight, { top: arrowTop }]} onPress={() => goTo(activeIndex + 1)} activeOpacity={0.8}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.counterChip}>
          <Text style={styles.counterText}>{activeIndex + 1} / {images.length}</Text>
        </View>
      </View>

      <View style={styles.dotsRow}>
        {images.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.thumbRow}>
        {images.map((img, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.8}>
            <View style={[styles.thumb, i === activeIndex && styles.thumbActive]}>
              <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Review helpers ───────────────────────────────────────────────────────────

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function reviewerName(user?: Review['user']): string {
  if (!user) return 'Anonymous';
  if (user.name) return user.name;
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return full || user.email || 'Anonymous';
}

function ReviewStars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={value >= s ? 'star' : 'star-outline'}
          size={size}
          color={value >= s ? '#ffc107' : '#ccc'}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = review.images ?? [];

  return (
    <View style={rvStyles.card}>
      <View style={rvStyles.cardTop}>
        <View style={rvStyles.avatar}>
          {review.user?.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={rvStyles.avatarImg} />
          ) : (
            <Ionicons name="person-circle-outline" size={36} color="#a5c890" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rvStyles.userName}>{reviewerName(review.user)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <ReviewStars value={review.rating} />
            <Text style={rvStyles.dateText}>{formatReviewDate(review.createdAt)}</Text>
          </View>
        </View>
        <View style={rvStyles.ratingBadge}>
          <Text style={rvStyles.ratingBadgeText}>{review.rating}.0</Text>
        </View>
      </View>

      <Text style={rvStyles.comment}>{review.comment}</Text>

      {images.length > 0 && (
        <View style={rvStyles.imgCarousel}>
          <Image source={{ uri: images[imgIdx].url }} style={rvStyles.img} resizeMode="cover" />
          {images.length > 1 && (
            <>
              {imgIdx > 0 && (
                <TouchableOpacity style={[rvStyles.imgArrow, { left: 6 }]} onPress={() => setImgIdx((i) => i - 1)}>
                  <Ionicons name="chevron-back" size={16} color="#fff" />
                </TouchableOpacity>
              )}
              {imgIdx < images.length - 1 && (
                <TouchableOpacity style={[rvStyles.imgArrow, { right: 6 }]} onPress={() => setImgIdx((i) => i + 1)}>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
              )}
              <View style={rvStyles.imgCounter}>
                <Text style={rvStyles.imgCounterText}>{imgIdx + 1}/{images.length}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ProductDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [reviews, setReviews]               = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewsPage, setReviewsPage]       = useState(1);
  const [reviewsTotal, setReviewsTotal]     = useState(0);
  const [reviewAvg, setReviewAvg]           = useState<{ average: number; total: number } | null>(null);
  const REVIEWS_PER_PAGE = 5;

  const isWeb = Platform.OS === 'web';

  const refreshCartCount = useCallback(async () => {
    const cart = await getCart();
    setCartCount(cart.reduce((sum: number, i: any) => sum + i.quantity, 0));
  }, []);

  useEffect(() => { refreshCartCount(); }, [refreshCartCount]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', refreshCartCount);
    return unsubscribe;
  }, [navigation, refreshCartCount]);

  useEffect(() => { setQuantity(1); }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      Alert.alert(
        'Login Required',
        'Please login to add items to your cart.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('LoginScreen') },
        ],
      );
      return;
    }

    if (product.stock === 0 || product.is_out_of_stock) {
      Alert.alert('Out of Stock', 'This product is currently unavailable.');
      return;
    }

    setAddingToCart(true);
    try {
      const cart = await getCart();
      const existing = cart.find((i) => i.product === product.id);
      const prevQty = existing ? existing.quantity : 0;
      const newQty = prevQty + quantity;

      if (newQty > product.stock) {
        Alert.alert('Insufficient Stock', `Only ${product.stock - prevQty} more unit(s) can be added.`);
        return;
      }

      await setProductQuantity(product, newQty);
      await refreshCartCount();
      setQuantity(1);

      Alert.alert(
        'Added to Cart',
        `${quantity} × ${product.name} added to your cart.`,
        [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
        ],
      );
    } catch {
      Alert.alert('Error', 'Failed to add to cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  const contentWidth = dimensions.width;

  // ← centeredCol only used for the main content, NOT topBar or breadcrumb
  const centeredCol = isWeb
    ? { width: '100%' as const, maxWidth: 1100, alignSelf: 'center' as const }
    : { width: '100%' as const };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getProduct(productId);
        if (res.success && res.data) setProduct(res.data);
        else setError(res.message || 'Product not found');
      } catch {
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const fetchReviews = useCallback(async (page: number, append = false) => {
    try {
      append ? setReviewsLoadingMore(true) : setReviewsLoading(true);
      const res = await getProductReviewsApi(productId, page, REVIEWS_PER_PAGE);
      if (res.success) {
        const list = res.reviews ?? res.data ?? [];
        setReviews((prev) => append ? [...prev, ...list] : list);
        setReviewsTotal(res.pagination?.total ?? list.length);
        if (res.averageRating) setReviewAvg(res.averageRating);
      }
    } catch {
      // silently ignore
    } finally {
      setReviewsLoading(false);
      setReviewsLoadingMore(false);
    }
  }, [productId]);

  useEffect(() => {
    setReviews([]);
    setReviewsPage(1);
    setReviewAvg(null);
    fetchReviews(1, false);
  }, [productId]);

  const loadMoreReviews = () => {
    const nextPage = reviewsPage + 1;
    setReviewsPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const hasMoreReviews = reviews.length < reviewsTotal;

  if (loading) {
    return (
      <RootContainer style={styles.safeArea}>
        <View style={styles.stateWrap}>
          <ActivityIndicator size="large" color="#3d6b22" />
          <Text style={[styles.stateText, { color: '#7a9460' }]}>Loading…</Text>
        </View>
      </RootContainer>
    );
  }

  if (error || !product) {
    return (
      <RootContainer style={styles.safeArea}>
        <View style={styles.stateWrap}>
          <Ionicons name="alert-circle-outline" size={48} color="#b83232" />
          <Text style={[styles.stateText, { color: '#b83232' }]}>{error || 'Product not found'}</Text>
        </View>
      </RootContainer>
    );
  }

  const isOOS = product.is_out_of_stock || product.stock === 0;
  const isDesktop = contentWidth >= DESKTOP_BREAKPOINT;

  const DESKTOP_PAD = 24;
  const DESKTOP_GAP = 24;
  const constrainedWidth = Math.min(contentWidth, 1100);
  const desktopColWidth = isDesktop
    ? Math.floor((constrainedWidth - DESKTOP_PAD * 2 - DESKTOP_GAP) / 2)
    : 0;
  const imageWidth = isDesktop ? desktopColWidth : contentWidth - 24;
  const imageHeight = isDesktop
    ? Math.min(Math.floor(desktopColWidth * 1.1), 570)
    : Math.min(Math.floor(contentWidth * 1.05), 450);

  // ── Content panel ──────────────────────────────────────────────────────────
  const renderContent = () => (
    <>
      <View style={styles.productHeader}>
        <View style={styles.categoryChip}>
          <Ionicons name="pricetag-outline" size={11} color="#5a8c35" />
          <Text style={styles.categoryChipText}>{product.category.name}</Text>
        </View>
        <View style={styles.productNameRow}>
          <Text style={styles.productName}>{product.name}</Text>
          {product.status === 'active' && <View style={styles.liveDot} />}
        </View>
      </View>

      <View style={styles.priceStatusRow}>
        <Text style={styles.price}>₱{product.price.toFixed(2)}</Text>
      </View>

      <View style={styles.stockRow}>
        <View style={[styles.stockPill, isOOS && styles.stockPillOOS]}>
          <Ionicons
            name={isOOS ? 'close-circle-outline' : 'checkmark-circle-outline'}
            size={15}
            color={isOOS ? '#b83232' : '#2d7a28'}
          />
          <Text style={[styles.stockPillText, isOOS && styles.stockPillTextOOS]}>
            {isOOS ? 'Out of Stock' : `${product.stock} in stock`}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {!!product.description && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About this product</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>
      )}

      {(product.nutrition?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nutritional Information</Text>
          <View style={styles.nutritionTable}>
            <View style={styles.nutritionHeader}>
              <Text style={styles.nutritionHeaderText}>Nutrient</Text>
              <Text style={styles.nutritionHeaderText}>Amount</Text>
            </View>
            {product.nutrition.map((entry, idx) => (
              <View key={entry.id ?? idx} style={[styles.nutritionRow, idx % 2 === 0 && styles.nutritionRowAlt]}>
                <Text style={styles.nutritionLabel}>{entry.label}</Text>
                <Text style={styles.nutritionAmount}>{entry.amount}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Details</Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValue}>{product.category.name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>
              {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </Text>
          </View>
          {product.origin ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Origin</Text>
              <Text style={styles.metaValue}>{product.origin}</Text>
            </View>
          ) : null}
          {product.weight ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Net Weight</Text>
              <Text style={styles.metaValue}>{product.weight}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={pdCartStyles.cartSection}>
        {!isOOS && (
          <View style={pdCartStyles.subtotalRow}>
            <Text style={pdCartStyles.subtotalLabel}>Subtotal</Text>
            <Text style={pdCartStyles.subtotalValue}>
              ₱{(product.price * quantity).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={pdCartStyles.actionRow}>
          {!isOOS && (
            <View style={pdCartStyles.qtyRow}>
              <TouchableOpacity
                style={[pdCartStyles.qtyBtn, quantity <= 1 && pdCartStyles.qtyBtnDisabled]}
                onPress={() => setQuantity(q => Math.max(q - 1, 1))}
                disabled={quantity <= 1}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="remove" size={18} color={quantity <= 1 ? '#ccc' : '#3d6b22'} />
              </TouchableOpacity>

              <Text style={pdCartStyles.qtyValue}>{quantity}</Text>

              <TouchableOpacity
                style={[pdCartStyles.qtyBtn, quantity >= product.stock && pdCartStyles.qtyBtnDisabled]}
                onPress={() => setQuantity(q => Math.min(q + 1, product.stock))}
                disabled={quantity >= product.stock}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={18} color={quantity >= product.stock ? '#ccc' : '#3d6b22'} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[pdCartStyles.cartBtn, isOOS && pdCartStyles.cartBtnDisabled, !isOOS && { flex: 1 }]}
            onPress={handleAddToCart}
            disabled={isOOS || addingToCart}
            activeOpacity={0.85}
          >
            {addingToCart ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color={isOOS ? '#aaa' : '#fff'} />
                <Text style={[pdCartStyles.cartBtnText, isOOS && pdCartStyles.cartBtnTextDisabled]}>
                  {isOOS ? 'Out of Stock' : `Add ${quantity > 1 ? `${quantity} ` : ''}to Cart`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <RootContainer style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar — full width, NOT wrapped in centeredCol */}
        <View style={styles.topBar}>
          <View style={styles.topBarInner}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <Ionicons name="arrow-back" size={18} color="#2e4420" />
              <Text style={styles.backText}>Market</Text>
            </TouchableOpacity>

            <Text style={styles.topBarTitle} numberOfLines={1}>{product.name}</Text>

            <TouchableOpacity style={pdCartStyles.cartIconBtn} onPress={() => navigation.navigate('Cart')} activeOpacity={0.8}>
              <Ionicons name="cart-outline" size={22} color="#2e4420" />
              {cartCount > 0 && (
                <View style={pdCartStyles.badge}>
                  <Text style={pdCartStyles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Breadcrumb — full width, NOT wrapped in centeredCol */}
        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={() => navigation.navigate('Market')}>
            <Text style={styles.breadcrumbItem}>Market</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSep}>›</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Market')}>
            <Text style={styles.breadcrumbItem}>{product.category.name}</Text>
          </TouchableOpacity>
          <Text style={styles.breadcrumbSep}>›</Text>
          <Text style={styles.breadcrumbItemActive} numberOfLines={1}>{product.name}</Text>
        </View>

        {/* Content — centeredCol applied here only */}
        <View style={centeredCol}>
          {isDesktop ? (
            <View style={styles.desktopRow}>
              <View style={[styles.desktopImageCol, { width: desktopColWidth }]}>
                <ImageCarousel images={product.images ?? []} imageWidth={desktopColWidth} imageHeight={imageHeight} />
              </View>
              <View style={styles.desktopContentCard}>
                {renderContent()}
              </View>
            </View>
          ) : (
            <>
              <View style={styles.mobileImageWrap}>
                <ImageCarousel images={product.images ?? []} imageWidth={imageWidth} imageHeight={imageHeight} />
              </View>
              <View style={styles.mobileContentCard}>
                {renderContent()}
              </View>
            </>
          )}

          {/* Customer Reviews */}
          <View style={rvStyles.reviewsSection}>
            <View style={rvStyles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="star" size={16} color="#ffc107" />
                <Text style={rvStyles.reviewsSectionTitle}>Customer Reviews</Text>
              </View>
              {reviewAvg && (
                <View style={rvStyles.avgChip}>
                  <Text style={rvStyles.avgVal}>{reviewAvg.average.toFixed(1)}</Text>
                  <ReviewStars value={Math.round(reviewAvg.average)} size={12} />
                  <Text style={rvStyles.avgCount}>({reviewAvg.total})</Text>
                </View>
              )}
            </View>

            {reviewsLoading ? (
              <ActivityIndicator size="small" color="#3d6b22" style={{ marginVertical: 20 }} />
            ) : reviews.length === 0 ? (
              <View style={rvStyles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color="#c8ddb8" />
                <Text style={rvStyles.emptyText}>No reviews yet. Be the first!</Text>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 8 }}>
                {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
              </View>
            )}

            {!reviewsLoading && hasMoreReviews && (
              <TouchableOpacity
                style={rvStyles.loadMoreBtn}
                onPress={loadMoreReviews}
                disabled={reviewsLoadingMore}
                activeOpacity={0.8}
              >
                {reviewsLoadingMore
                  ? <ActivityIndicator size="small" color="#3d6b22" />
                  : <Text style={rvStyles.loadMoreText}>Load more reviews ({reviewsTotal - reviews.length} remaining)</Text>
                }
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </RootContainer>
  );
};

// ─── Cart / buying styles ─────────────────────────────────────────────────────

const pdCartStyles = StyleSheet.create({
  cartSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8f0e0',
    gap: 12,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f9f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  subtotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7a9460',
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d5016',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f4f9f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#c8e0b0',
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#3d6b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    borderColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e4420',
    minWidth: 28,
    textAlign: 'center',
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3d6b22',
    paddingVertical: 14,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  cartBtnDisabled: {
    backgroundColor: '#e0e0e0',
    flex: 1,
  },
  cartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cartBtnTextDisabled: {
    color: '#aaa',
  },
  cartIconBtn: {
    position: 'relative',
    padding: 4,
  },
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
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

// ─── Review styles ────────────────────────────────────────────────────────────

const rvStyles = StyleSheet.create({
  reviewsSection: {
    marginHorizontal: 12,
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0edd4',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  avgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f4f9f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  avgVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e4420',
  },
  avgCount: {
    fontSize: 11,
    color: '#7a9460',
  },
  card: {
    backgroundColor: '#f8fbf5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0edd4',
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5dc',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e4420',
  },
  dateText: {
    fontSize: 11,
    color: '#8aaa6a',
  },
  ratingBadge: {
    backgroundColor: '#3d6b22',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  comment: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
  },
  imgCarousel: {
    height: 200,
    width: 260,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e8f5dc',
    alignSelf: 'flex-start',
  },
  img: {
    width: '100%',
    height: '100%',
  },
  imgArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgCounter: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  imgCounterText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#9ab88a',
  },
  loadMoreBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#c8e0b0',
    backgroundColor: '#f4f9f0',
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3d6b22',
  },
});

export default ProductDetailScreen;