import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import {
  Review,
  ReviewImage,
  getMyReviewsApi,
  updateReviewApi,
  archiveMyReviewApi,
} from '../../Services/reviewApi';

// ─── Palette (matches your full app) ─────────────────────────────────────────
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
  orange:      '#e65100',
  orangePale:  '#fff3e0',
  star:        '#ffc107',
};

const MAX_CONTENT_WIDTH = 960;

// ─── Local types ──────────────────────────────────────────────────────────────
interface EditData {
  rating: number;
  comment: string;
  keepImages: ReviewImage[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getOrderId(order: Review['order']): string {
  if (!order) return 'N/A';
  if (typeof order === 'string') return order;
  return order._id ?? 'N/A';
}

function shortOrderId(id: string) {
  return id === 'N/A' ? 'N/A' : `#${id.slice(-8).toUpperCase()}`;
}

function getProductImageUrl(product?: Review['product']): string | undefined {
  if (!product) return undefined;
  const imgs = product.images;
  if (!imgs || imgs.length === 0) return undefined;
  const first = imgs[0];
  if (typeof first === 'string') return first;
  return (first as ReviewImage).url ?? undefined;
}

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 24 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange?.(star)} disabled={!onChange} activeOpacity={0.7}>
          <Ionicons name={value >= star ? 'star' : 'star-outline'} size={size} color={value >= star ? C.star : C.sageMid} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
const MyReviewsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { height: windowHeight } = useWindowDimensions();

  const [reviews, setReviews]                 = useState<Review[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [editModalOpen, setEditModalOpen]     = useState(false);
  const [selectedReview, setSelectedReview]   = useState<Review | null>(null);
  const [editData, setEditData]               = useState<EditData>({ rating: 0, comment: '', keepImages: [] });
  const [newImageUris, setNewImageUris]       = useState<string[]>([]);
  const [imagePreview, setImagePreview]       = useState<string[]>([]);
  const [updating, setUpdating]               = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiving, setArchiving]             = useState(false);
  const [carouselIndexes, setCarouselIndexes] = useState<Record<string, number>>({});

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyReviewsApi();
      if (res.success) {
        setReviews(res.data ?? []);
      } else {
        Alert.alert('Error', res.message ?? 'Failed to fetch reviews');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyReviews(); }, [fetchMyReviews]);
  useFocusEffect(useCallback(() => { fetchMyReviews(); }, [fetchMyReviews]));

  // ─── Image picker ────────────────────────────────────────────────────────────
  const pickImages = async () => {
    if (imagePreview.length >= 5) { Alert.alert('Limit reached', 'Maximum 5 images allowed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const remaining = 5 - imagePreview.length;
    const selected  = result.assets.slice(0, remaining).map((a) => a.uri);
    setNewImageUris((prev) => [...prev, ...selected]);
    setImagePreview((prev) => [...prev, ...selected]);
  };

  const removeImage = (index: number) => {
    const existingCount = editData.keepImages.length;
    if (index < existingCount) {
      setEditData((prev) => ({ ...prev, keepImages: prev.keepImages.filter((_, i) => i !== index) }));
    } else {
      const newIdx = index - existingCount;
      setNewImageUris((prev) => prev.filter((_, i) => i !== newIdx));
    }
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Open dialogs ────────────────────────────────────────────────────────────
  const openEditModal = (review: Review) => {
    setSelectedReview(review);
    setEditData({ rating: review.rating, comment: review.comment, keepImages: review.images ?? [] });
    setImagePreview((review.images ?? []).map((img) => img.url));
    setNewImageUris([]);
    setEditModalOpen(true);
  };

  const openArchiveModal = (review: Review) => {
    setSelectedReview(review);
    setArchiveModalOpen(true);
  };

  // ─── Update ──────────────────────────────────────────────────────────────────
  const handleUpdateReview = async () => {
    if (editData.rating === 0) { Alert.alert('Validation', 'Please select a rating'); return; }
    if (!editData.comment.trim()) { Alert.alert('Validation', 'Please write a comment'); return; }
    try {
      setUpdating(true);
      const res = await updateReviewApi(selectedReview!._id, {
        rating:  editData.rating,
        comment: editData.comment,
        imageUris:          newImageUris.length > 0 ? newImageUris : undefined,
        keepImagePublicIds: editData.keepImages.map((img) => img.public_id),
      });
      if (res.success) {
        Alert.alert('Success', 'Review updated successfully');
        setEditModalOpen(false);
        fetchMyReviews();
      } else {
        Alert.alert('Error', res.message ?? 'Failed to update review');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to update review');
    } finally {
      setUpdating(false);
    }
  };

  // ─── Archive ─────────────────────────────────────────────────────────────────
  const handleArchiveReview = async () => {
    try {
      setArchiving(true);
      const res = await archiveMyReviewApi(selectedReview!._id);
      if (res.success) {
        Alert.alert('Archived', 'Your review has been archived');
        setArchiveModalOpen(false);
        fetchMyReviews();
      } else {
        Alert.alert('Error', res.message ?? 'Failed to archive review');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to archive review');
    } finally {
      setArchiving(false);
    }
  };

  // ─── Carousel ────────────────────────────────────────────────────────────────
  const carouselNext = (id: string, max: number) =>
    setCarouselIndexes((prev) => ({ ...prev, [id]: Math.min((prev[id] ?? 0) + 1, max) }));
  const carouselPrev = (id: string) =>
    setCarouselIndexes((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 0) - 1, 0) }));

  // ─── Review card ─────────────────────────────────────────────────────────────
  const renderReview = ({ item: review }: { item: Review }) => {
    const currentIdx    = carouselIndexes[review._id] ?? 0;
    const hasImages     = review.images && review.images.length > 0;
    const orderId       = getOrderId(review.order);
    const productImgUrl = getProductImageUrl(review.product);

    return (
      <View style={s.card}>
        {/* Product info */}
        <View style={s.cardTop}>
          {productImgUrl ? (
            <Image source={{ uri: productImgUrl }} style={s.productImage} resizeMode="cover" />
          ) : (
            <View style={[s.productImage, s.productImagePlaceholder]}>
              <Ionicons name="image-outline" size={28} color={C.sageMid} />
            </View>
          )}
          <View style={s.productMeta}>
            <Text style={s.productName} numberOfLines={2}>{review.product?.name ?? '—'}</Text>
            <Text style={s.productPrice}>
              ₱{review.product?.price != null ? review.product.price.toFixed(2) : '—'}
            </Text>
            <View style={s.orderPill}>
              <Text style={s.orderPillLabel}>Order</Text>
              <Text style={s.orderPillId}>{shortOrderId(orderId)}</Text>
            </View>
          </View>
        </View>

        {/* Rating + date */}
        <View style={s.ratingRow}>
          <StarRating value={review.rating} size={18} />
          <View style={s.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={C.inkFaint} />
            <Text style={s.dateText}>{formatDate(review.createdAt)}</Text>
          </View>
        </View>

        {/* Comment */}
        <Text style={s.commentText}>{review.comment}</Text>

        {/* Image carousel */}
        {hasImages && (
          <View style={s.carouselContainer}>
            <Image source={{ uri: review.images[currentIdx].url }} style={s.carouselImage} resizeMode="cover" />
            {review.images.length > 1 && (
              <>
                {currentIdx > 0 && (
                  <TouchableOpacity style={[s.carouselBtn, { left: 8 }]} onPress={() => carouselPrev(review._id)}>
                    <Ionicons name="chevron-back" size={20} color={C.white} />
                  </TouchableOpacity>
                )}
                {currentIdx < review.images.length - 1 && (
                  <TouchableOpacity style={[s.carouselBtn, { right: 8 }]} onPress={() => carouselNext(review._id, review.images.length - 1)}>
                    <Ionicons name="chevron-forward" size={20} color={C.white} />
                  </TouchableOpacity>
                )}
                <View style={s.carouselCounter}>
                  <Text style={s.carouselCounterText}>{currentIdx + 1} / {review.images.length}</Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.editBtn} onPress={() => openEditModal(review)} activeOpacity={0.8}>
            <Ionicons name="create-outline" size={15} color={C.white} />
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.archiveBtn} onPress={() => openArchiveModal(review)} activeOpacity={0.8}>
            <Ionicons name="archive-outline" size={15} color={C.orange} />
            <Text style={s.archiveBtnText}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.orderBtn} onPress={() => navigation.navigate('OrderDetails', { id: orderId })} activeOpacity={0.8}>
            <Ionicons name="bag-outline" size={15} color={C.sage} />
            <Text style={s.orderBtnText}>View Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  const HEADER_HEIGHT = 70;

  return (
    <SafeAreaView style={s.safeArea}>

      {/* ── Header (matches ListOrders) ── */}
      <View style={s.headerBar}>
        <View style={s.headerContent}>
          <View style={s.headerTopRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color={C.sage} />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Reviews</Text>
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{reviews.length}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={C.sage} />
          <Text style={s.loadingText}>Loading your reviews…</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={s.centered}>
          <Ionicons name="star-outline" size={72} color={C.sageMid} />
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySubtitle}>Purchase and receive products to start writing reviews</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('ListOrders')}>
            <Text style={s.emptyBtnText}>View My Orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // THE FIX: explicit pixel height same as all other screens
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={renderReview}
          style={{ height: windowHeight - HEADER_HEIGHT, backgroundColor: C.bg }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={true}
        />
      )}

      {/* ══ EDIT MODAL ══ */}
      <Modal visible={editModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalOpen(false)}>
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Edit Review</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(false)}>
              <Ionicons name="close" size={24} color={C.inkFaint} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalScroll} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.modalInner}>
              <Text style={s.modalProductName}>{selectedReview?.product?.name}</Text>

              <Text style={s.fieldLabel}>Rating *</Text>
              <StarRating value={editData.rating} onChange={(v) => setEditData((prev) => ({ ...prev, rating: v }))} size={32} />

              <Text style={[s.fieldLabel, { marginTop: 20 }]}>Review *</Text>
              <TextInput
                style={s.textInput}
                multiline
                numberOfLines={5}
                placeholder="Share your thoughts about this product..."
                placeholderTextColor={C.sageMid}
                value={editData.comment}
                onChangeText={(t) => setEditData((prev) => ({ ...prev, comment: t }))}
              />

              <Text style={[s.fieldLabel, { marginTop: 20 }]}>Photos (Optional – {imagePreview.length}/5)</Text>
              <TouchableOpacity style={[s.uploadBtn, imagePreview.length >= 5 && { opacity: 0.4 }]} onPress={pickImages} disabled={imagePreview.length >= 5}>
                <Ionicons name="cloud-upload-outline" size={18} color={C.sage} />
                <Text style={s.uploadBtnText}>Upload Images</Text>
              </TouchableOpacity>

              {imagePreview.length > 0 && (
                <View style={s.previewGrid}>
                  {imagePreview.map((uri, i) => (
                    <View key={`${uri}-${i}`} style={s.previewItem}>
                      <Image source={{ uri }} style={s.previewImage} />
                      <TouchableOpacity style={s.previewRemove} onPress={() => removeImage(i)}>
                        <Ionicons name="trash" size={14} color={C.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={s.modalActions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setEditModalOpen(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.updateBtn} onPress={handleUpdateReview} disabled={updating}>
              {updating ? <ActivityIndicator color={C.white} /> : <Text style={s.updateBtnText}>Update Review</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══ ARCHIVE MODAL ══ */}
      <Modal visible={archiveModalOpen} animationType="fade" transparent onRequestClose={() => setArchiveModalOpen(false)}>
        <View style={s.archiveBackdrop}>
          <View style={s.archiveBox}>
            <View style={s.archiveIconCircle}>
              <Ionicons name="archive-outline" size={28} color={C.orange} />
            </View>
            <Text style={s.archiveTitle}>Archive Review</Text>
            <Text style={s.archiveMsg}>
              This review will be hidden from the product page. You can ask support to restore it if needed.
            </Text>
            {selectedReview && (
              <View style={s.archivePreview}>
                <Text style={s.archivePreviewName}>{selectedReview.product?.name}</Text>
                <StarRating value={selectedReview.rating} size={16} />
                <Text style={s.archivePreviewComment} numberOfLines={3}>{selectedReview.comment}</Text>
              </View>
            )}
            <View style={s.archiveActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setArchiveModalOpen(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmArchiveBtn} onPress={handleArchiveReview} disabled={archiving}>
                {archiving ? <ActivityIndicator color={C.white} /> : <Text style={s.confirmArchiveText}>Archive</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles (all inline) ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // ── Header (matches ListOrders exactly) ────────────────────────────────────
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
  backBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: '#f0f7e8', borderWidth: 1.5, borderColor: C.borderMid },
  backText:      { fontSize: 13, color: C.sageMed, fontWeight: '700' },
  headerTitle:   { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  countBadge:    { backgroundColor: C.sage, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, minWidth: 28, alignItems: 'center' },
  countBadgeText:{ color: C.white, fontSize: 12, fontWeight: '800' },

  // ── States ─────────────────────────────────────────────────────────────────
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  loadingText:   { fontSize: 15, color: C.inkFaint },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: C.inkSoft, marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: C.inkFaint, textAlign: 'center', lineHeight: 20 },
  emptyBtn:      { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: C.sage, borderRadius: 12 },
  emptyBtnText:  { color: C.white, fontWeight: '700', fontSize: 14 },

  // ── List ───────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    // Centered max-width — same as ListOrders listInner
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center' as const,
  },

  // ── Review Card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderSoft,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#1a3a05', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.08)' } as any,
    }),
  },
  cardTop:              { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: C.borderSoft },
  productImage:         { width: 72, height: 72, borderRadius: 10, backgroundColor: C.sagePale, borderWidth: 1, borderColor: C.border },
  productImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productMeta:          { flex: 1, gap: 4, justifyContent: 'center' },
  productName:          { fontSize: 14, fontWeight: '700', color: C.inkSoft, lineHeight: 20 },
  productPrice:         { fontSize: 13, color: C.sageMed, fontWeight: '600' },
  orderPill:            { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: C.fog, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  orderPillLabel:       { fontSize: 10, color: C.inkFaint, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  orderPillId:          { fontSize: 11, color: C.inkSoft, fontWeight: '800', letterSpacing: 0.5 },

  ratingRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  dateText:    { fontSize: 12, color: C.inkFaint },
  commentText: { fontSize: 14, color: C.inkSoft, lineHeight: 22, paddingHorizontal: 14, paddingBottom: 12 },

  // ── Carousel ───────────────────────────────────────────────────────────────
  carouselContainer: { position: 'relative', marginHorizontal: 14, marginBottom: 12, borderRadius: 10, overflow: 'hidden', width: 260, height: 200, alignSelf: 'flex-start' },
  carouselImage:     { width: '100%', height: '100%', borderRadius: 10 },
  carouselBtn:       { position: 'absolute', top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  carouselCounter:   { position: 'absolute', bottom: 8, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  carouselCounterText: { color: C.white, fontSize: 11, fontWeight: '600' },

  // ── Action buttons ─────────────────────────────────────────────────────────
  actionsRow:     { flexDirection: 'row', gap: 8, padding: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.borderSoft },
  editBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: C.sage },
  editBtnText:    { color: C.white, fontSize: 13, fontWeight: '700' },
  archiveBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: C.orangePale, borderWidth: 1.5, borderColor: '#ffd0a0' },
  archiveBtnText: { color: C.orange, fontSize: 13, fontWeight: '700' },
  orderBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border },
  orderBtnText:   { color: C.sage, fontSize: 13, fontWeight: '700' },

  // ── Edit Modal ─────────────────────────────────────────────────────────────
  modalSafe:        { flex: 1, backgroundColor: C.bg },
  modalHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.headerBg, borderBottomWidth: 1, borderBottomColor: C.borderMid },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: C.inkSoft },
  modalScroll:      { flex: 1 },
  modalInner:       { padding: 16, maxWidth: MAX_CONTENT_WIDTH, width: '100%', alignSelf: 'center' as const },
  modalProductName: { fontSize: 16, fontWeight: '700', color: C.inkSoft, marginBottom: 20, lineHeight: 22 },
  fieldLabel:       { fontSize: 12, fontWeight: '700', color: C.sageMed, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  textInput:        { backgroundColor: C.white, borderWidth: 1.5, borderColor: C.borderMid, borderRadius: 12, padding: 12, fontSize: 14, color: C.inkSoft, minHeight: 110, textAlignVertical: 'top', lineHeight: 22 },
  uploadBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.borderMid, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12, justifyContent: 'center' },
  uploadBtnText:    { color: C.sage, fontWeight: '600', fontSize: 14 },
  previewGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewItem:      { position: 'relative', width: 80, height: 80 },
  previewImage:     { width: 80, height: 80, borderRadius: 8 },
  previewRemove:    { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },

  modalActions:  { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: C.borderSoft, backgroundColor: C.white },
  cancelBtn:     { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.fog, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.inkFaint },
  updateBtn:     { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: C.sage, alignItems: 'center' },
  updateBtnText: { fontSize: 15, fontWeight: '700', color: C.white },

  // ── Archive Modal ──────────────────────────────────────────────────────────
  archiveBackdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  archiveBox:          { backgroundColor: C.white, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, width: '100%', maxWidth: 380, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
  archiveIconCircle:   { width: 60, height: 60, borderRadius: 30, backgroundColor: C.orangePale, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  archiveTitle:        { fontSize: 18, fontWeight: '800', color: C.inkSoft, marginBottom: 8, textAlign: 'center' },
  archiveMsg:          { fontSize: 14, color: C.inkFaint, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  archivePreview:      { width: '100%', backgroundColor: C.mist, borderRadius: 10, padding: 12, marginBottom: 20, gap: 6, borderWidth: 1, borderColor: C.borderSoft },
  archivePreviewName:  { fontSize: 14, fontWeight: '700', color: C.inkSoft },
  archivePreviewComment: { fontSize: 13, color: C.inkFaint, lineHeight: 18, marginTop: 4 },
  archiveActions:      { flexDirection: 'row', gap: 10, width: '100%' },
  confirmArchiveBtn:   { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: C.orange, alignItems: 'center' },
  confirmArchiveText:  { color: C.white, fontWeight: '700', fontSize: 15 },
});

export default MyReviewsScreen;