import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

import { createReviewApi, archiveMyReviewApi } from '../../Services/reviewApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type RootStackParamList = {
  CreateReview: {
    orderId: string;
    reviewId?: string;
    items: Array<{ productId: string; name: string; image: string; price: number }>;
  };
  MyReviews: undefined;
  ListOrders: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'CreateReview'>;
  route: RouteProp<RootStackParamList, 'CreateReview'>;
};

// Per-product review state
type ProductReview = {
  rating: number;
  comment: string;
  commentError: string;
  imageUris: string[];
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  forest:       '#2d5016',
  sage:         '#3d6b22',
  sageMed:      '#5a8c35',
  sagePale:     '#e8f5dc',
  sageMid:      '#c8e8b0',
  sageTint:     '#f2fae9',
  ink:          '#111a0a',
  inkSoft:      '#2e4420',
  inkFaint:     '#7a9460',
  mist:         '#f7faf3',
  fog:          '#eef3e8',
  white:        '#ffffff',
  bg:           '#e8f2de',
  headerBg:     '#ddeece',
  border:       '#d5e8c0',
  borderSoft:   '#e8f2dc',
  borderMid:    '#c8e0b0',
  red:          '#b83232',
  redPale:      '#fdf0f0',
  orange:       '#e65100',
  orangePale:   '#fff3e0',
  orangeBorder: '#ffe0b2',
  star:         '#ffc107',
  divider:      '#daecc8',
};

const MAX_CONTENT_WIDTH = 960;

const RATING_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent',
};

// ─── StarRating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 32 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={s.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} activeOpacity={0.7}>
          <Ionicons name={value >= star ? 'star' : 'star-outline'} size={size} color={value >= star ? C.star : C.sageMid} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Progress Indicator ───────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  if (total <= 1) return null;
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i < current   && s.dotDone,
            i === current  && s.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const CreateReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, reviewId, items } = route.params;
  const { height: windowHeight } = useWindowDimensions();

  const validItems = items.filter((i) => {
    const id = i.productId;
    return typeof id === 'string' && id.trim().length === 24;
  });

  // Each product gets its own review state
  const [reviews, setReviews] = useState<Record<string, ProductReview>>(() =>
    Object.fromEntries(
      validItems.map((item) => [
        item.productId,
        { rating: 0, comment: '', commentError: '', imageUris: [] },
      ]),
    ),
  );

  // Which product card is currently expanded / focused
  const [activeIndex, setActiveIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [archiving,  setArchiving]  = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateReview = (productId: string, patch: Partial<ProductReview>) => {
    setReviews((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], ...patch },
    }));
  };

  const pickImages = async (productId: string) => {
    const current = reviews[productId]?.imageUris ?? [];
    if (current.length >= 5) { Alert.alert('Limit reached', 'Maximum 5 images per product'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const remaining = 5 - current.length;
    const picked    = result.assets.slice(0, remaining).map((a) => a.uri);
    updateReview(productId, { imageUris: [...current, ...picked] });
  };

  const removeImage = (productId: string, index: number) => {
    const current = reviews[productId]?.imageUris ?? [];
    updateReview(productId, { imageUris: current.filter((_, i) => i !== index) });
  };

  const navigateToMyReviews = () => {
    try { navigation.navigate('MyReviews'); } catch { navigation.goBack(); }
  };

  const handleArchive = () => {
    if (!reviewId) return;
    Alert.alert(
      'Archive Review',
      'This review will no longer be visible publicly. You can restore it from My Reviews.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive', style: 'destructive',
          onPress: async () => {
            try {
              setArchiving(true);
              const res = await archiveMyReviewApi(reviewId);
              if (res.success) {
                Alert.alert('Archived', 'Your review has been archived.', [{ text: 'OK', onPress: navigateToMyReviews }]);
              } else {
                Alert.alert('Error', res.message ?? 'Failed to archive review.');
              }
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Failed to archive review.');
            } finally {
              setArchiving(false);
            }
          },
        },
      ],
    );
  };

  // ── Validate all products before submitting ────────────────────────────────
  const validateAll = (): boolean => {
    let valid = true;
    const updated = { ...reviews };

    validItems.forEach((item) => {
      const r = updated[item.productId];
      if (r.rating === 0 || !r.comment.trim()) {
        valid = false;
        updated[item.productId] = {
          ...r,
          commentError: !r.comment.trim() ? 'Please write a comment' : '',
        };
      }
    });

    setReviews(updated);

    if (!valid) {
      Alert.alert(
        'Incomplete Reviews',
        'Please add a star rating and comment for every product before submitting.',
      );
    }
    return valid;
  };

  // ── Submit all reviews sequentially ───────────────────────────────────────
  const handleSubmit = async () => {
    if (validItems.length === 0) { Alert.alert('Error', 'No valid products found for this order.'); return; }
    if (!validateAll()) return;

    try {
      setSubmitting(true);
      const errors: string[] = [];

      for (const item of validItems) {
        const r = reviews[item.productId];
        const data = await createReviewApi({
          rating:    r.rating,
          comment:   r.comment.trim(),
          productId: item.productId,
          orderId,
          imageUris: r.imageUris.length > 0 ? r.imageUris : undefined,
        });
        if (!data.success) {
          errors.push(`${item.name}: ${data.message ?? 'Failed to submit'}`);
        }
      }

      if (errors.length === 0) {
        Alert.alert('Success', 'All reviews submitted successfully!', [{ text: 'OK', onPress: navigateToMyReviews }]);
      } else if (errors.length < validItems.length) {
        Alert.alert(
          'Partial Success',
          `Some reviews could not be submitted:\n\n${errors.join('\n')}`,
          [{ text: 'OK', onPress: navigateToMyReviews }],
        );
      } else {
        Alert.alert('Error', `Could not submit reviews:\n\n${errors.join('\n')}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to submit reviews');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Completion status ──────────────────────────────────────────────────────
  const completedCount = validItems.filter((item) => {
    const r = reviews[item.productId];
    return r.rating > 0 && r.comment.trim().length > 0;
  }).length;

  const allDone = completedCount === validItems.length && validItems.length > 0;

  const HEADER_HEIGHT = 70;

  return (
    <SafeAreaView style={s.safeArea}>

      {/* ── Header ── */}
      <View style={s.headerBar}>
        <View style={s.headerContent}>
          <View style={s.headerTopRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color={C.sage} />
              <Text style={s.backText}>Back</Text>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Write Reviews</Text>
              {validItems.length > 1 && (
                <Text style={s.headerSub}>{completedCount}/{validItems.length} completed</Text>
              )}
            </View>
            <View style={{ width: 70 }} />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ height: windowHeight - HEADER_HEIGHT, backgroundColor: C.bg }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={s.inner}>

          {/* Archive banner */}
          {reviewId && (
            <View style={s.archiveBanner}>
              <Ionicons name="archive-outline" size={18} color={C.orange} />
              <Text style={s.archiveBannerText}>Want to remove this review from public view?</Text>
              <TouchableOpacity style={s.archiveBtn} onPress={handleArchive} disabled={archiving} activeOpacity={0.8}>
                {archiving ? (
                  <ActivityIndicator size="small" color={C.orange} />
                ) : (
                  <>
                    <Ionicons name="archive" size={14} color={C.orange} />
                    <Text style={s.archiveBtnText}>Archive</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Invalid-items warning */}
          {validItems.length === 0 && (
            <View style={s.archiveBanner}>
              <Ionicons name="warning-outline" size={18} color={C.orange} />
              <Text style={[s.archiveBannerText, { color: C.orange }]}>
                Unable to load products for this order. Please go back and try again.
              </Text>
            </View>
          )}

          {/* Progress dots (multi-item orders) */}
          {validItems.length > 1 && (
            <ProgressDots total={validItems.length} current={completedCount} />
          )}

          {/* ── One card per product ── */}
          {validItems.map((item, index) => {
            const r        = reviews[item.productId];
            const isActive = index === activeIndex;
            const isDone   = r.rating > 0 && r.comment.trim().length > 0;

            return (
              <View key={item.productId} style={[s.productCard, isDone && s.productCardDone]}>

                {/* Card header — tap to collapse/expand */}
                <TouchableOpacity
                  style={s.cardHeader}
                  onPress={() => setActiveIndex(isActive ? -1 : index)}
                  activeOpacity={0.75}
                >
                  {/* Product thumbnail */}
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={s.cardThumb as any} />
                  ) : (
                    <View style={[s.cardThumb as any, s.cardThumbPlaceholder]}>
                      <Ionicons name="image-outline" size={22} color={C.sageMid} />
                    </View>
                  )}

                  {/* Name + price + mini stars */}
                  <View style={s.cardHeaderMeta}>
                    <Text style={s.cardProductName} numberOfLines={2}>{item.name}</Text>
                    <Text style={s.cardProductPrice}>₱{Number(item.price).toFixed(2)}</Text>
                    {r.rating > 0 && (
                      <View style={s.miniStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name={r.rating >= star ? 'star' : 'star-outline'} size={12} color={r.rating >= star ? C.star : C.sageMid} />
                        ))}
                        <Text style={s.miniRatingLabel}>{RATING_LABELS[r.rating]}</Text>
                      </View>
                    )}
                  </View>

                  {/* Status badge + chevron */}
                  <View style={s.cardHeaderRight}>
                    {isDone ? (
                      <View style={s.badgeDone}>
                        <Ionicons name="checkmark-circle" size={16} color={C.sage} />
                        <Text style={s.badgeDoneText}>Done</Text>
                      </View>
                    ) : (
                      <View style={s.badgePending}>
                        <Text style={s.badgePendingText}>Pending</Text>
                      </View>
                    )}
                    <Ionicons name={isActive ? 'chevron-up' : 'chevron-down'} size={18} color={C.inkFaint} />
                  </View>
                </TouchableOpacity>

                {/* ── Expanded form ── */}
                {isActive && (
                  <View style={s.cardBody}>

                    <View style={s.divider} />

                    {/* Rating */}
                    <View style={s.fieldBlock}>
                      <Text style={s.fieldLabel}>Rating *</Text>
                      <StarRating value={r.rating} onChange={(v) => updateReview(item.productId, { rating: v })} size={34} />
                      {r.rating > 0 && <Text style={s.ratingLabel}>{RATING_LABELS[r.rating]}</Text>}
                    </View>

                    {/* Comment */}
                    <View style={s.fieldBlock}>
                      <Text style={s.fieldLabel}>Your Review *</Text>
                      <TextInput
                        style={[s.textInput, r.commentError ? s.textInputError : null]}
                        multiline
                        numberOfLines={5}
                        placeholder="Share your experience with this product..."
                        placeholderTextColor={C.inkFaint}
                        value={r.comment}
                        onChangeText={(t) => updateReview(item.productId, { comment: t, commentError: '' })}
                        maxLength={1000}
                      />
                      {r.commentError ? (
                        <View style={s.errorRow}>
                          <Ionicons name="alert-circle" size={14} color={C.red} />
                          <Text style={s.errorText}>{r.commentError}</Text>
                        </View>
                      ) : null}
                      <Text style={s.charCount}>{r.comment.length}/1000</Text>
                    </View>

                    {/* Photos */}
                    <View style={s.fieldBlock}>
                      <Text style={s.fieldLabel}>Photos (Optional – {r.imageUris.length}/5)</Text>
                      <TouchableOpacity
                        style={[s.uploadBtn, r.imageUris.length >= 5 && s.uploadBtnDisabled]}
                        onPress={() => pickImages(item.productId)}
                        disabled={r.imageUris.length >= 5}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="cloud-upload-outline" size={18} color={C.sage} />
                        <Text style={s.uploadBtnText}>Upload Photos</Text>
                      </TouchableOpacity>

                      {r.imageUris.length > 0 && (
                        <View style={s.previewGrid}>
                          {r.imageUris.map((uri, i) => (
                            <View key={`${uri}-${i}`} style={s.previewItem}>
                              <Image source={{ uri }} style={s.previewImage as any} />
                              <TouchableOpacity style={s.previewRemove} onPress={() => removeImage(item.productId, i)}>
                                <Ionicons name="trash" size={13} color={C.white} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Next product shortcut */}
                    {index < validItems.length - 1 && (
                      <TouchableOpacity
                        style={s.nextBtn}
                        onPress={() => setActiveIndex(index + 1)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.nextBtnText}>Next Product</Text>
                        <Ionicons name="chevron-forward" size={16} color={C.sage} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Submit all */}
          <TouchableOpacity
            style={[s.submitBtn, (!allDone || submitting || validItems.length === 0) && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || validItems.length === 0}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Ionicons name="star" size={18} color={C.white} />
                <Text style={s.submitBtnText}>
                  {allDone
                    ? `Submit ${validItems.length > 1 ? `${validItems.length} Reviews` : 'Review'}`
                    : `${completedCount}/${validItems.length} Reviews Ready`}
                </Text>
              </>
            )}
          </TouchableOpacity>
          {!allDone && validItems.length > 1 && (
            <Text style={s.submitHint}>Complete all product reviews above to enable submission</Text>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },

  // ── Header ────────────────────────────────────────────────────────────────
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
  headerContent:  { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const },
  headerTopRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCenter:   { alignItems: 'center', flex: 1 },
  backBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: C.fog, borderWidth: 1.5, borderColor: C.borderMid },
  backText:       { fontSize: 13, color: C.sageMed, fontWeight: '700' },
  headerTitle:    { fontSize: 20, fontWeight: '900', color: C.ink, letterSpacing: -0.4 },
  headerSub:      { fontSize: 12, color: C.sageMed, fontWeight: '600', marginTop: 1 },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scrollContent: { paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 48 },
  inner:         { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, gap: 12 },

  // ── Progress dots ─────────────────────────────────────────────────────────
  dotsRow:   { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 4 },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.borderMid },
  dotActive: { backgroundColor: C.sageMed, width: 20 },
  dotDone:   { backgroundColor: C.sage },

  // ── Product card ──────────────────────────────────────────────────────────
  productCard: {
    backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.borderSoft, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#1a3a05', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.08)' } as any,
    }),
  },
  productCardDone: { borderColor: C.sageMed },

  cardHeader:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardThumb:       { width: 60, height: 60, borderRadius: 10, backgroundColor: C.sagePale, borderWidth: 1, borderColor: C.border },
  cardThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardHeaderMeta:  { flex: 1, gap: 3, justifyContent: 'center' },
  cardProductName: { fontSize: 14, fontWeight: '700', color: C.inkSoft, lineHeight: 20 },
  cardProductPrice:{ fontSize: 12, color: C.sageMed, fontWeight: '600' },
  miniStars:       { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  miniRatingLabel: { fontSize: 11, color: C.sageMed, fontWeight: '600', marginLeft: 4 },

  cardHeaderRight: { alignItems: 'flex-end', gap: 6 },
  badgeDone:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.sageTint, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.sageMid },
  badgeDoneText:   { fontSize: 11, color: C.sage, fontWeight: '700' },
  badgePending:    { backgroundColor: C.fog, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: C.borderMid },
  badgePendingText:{ fontSize: 11, color: C.inkFaint, fontWeight: '600' },

  cardBody:   { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
  divider:    { height: 1, backgroundColor: C.divider, marginHorizontal: -16 },
  fieldBlock: { gap: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.sageMed, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Rating ────────────────────────────────────────────────────────────────
  starRow:     { flexDirection: 'row', gap: 8 },
  ratingLabel: { fontSize: 14, color: C.sage, fontWeight: '700' },

  // ── Comment ───────────────────────────────────────────────────────────────
  textInput:       { backgroundColor: C.mist, borderWidth: 1.5, borderColor: C.borderMid, borderRadius: 12, padding: 14, color: C.inkSoft, fontSize: 14, textAlignVertical: 'top', minHeight: 120, lineHeight: 22 },
  textInputError:  { borderColor: C.red, backgroundColor: C.redPale },
  errorRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorText:       { fontSize: 12, color: C.red, flex: 1 },
  charCount:       { alignSelf: 'flex-end', fontSize: 11, color: C.inkFaint, fontWeight: '500' },

  // ── Upload ────────────────────────────────────────────────────────────────
  uploadBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: C.borderMid, borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: C.mist },
  uploadBtnDisabled: { opacity: 0.4 },
  uploadBtnText:     { color: C.sage, fontWeight: '600', fontSize: 14 },
  previewGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewItem:       { position: 'relative', width: 88, height: 88, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.borderMid },
  previewImage:      { width: '100%', height: '100%' },
  previewRemove:     { position: 'absolute', top: 4, right: 4, backgroundColor: C.red, borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  // ── Next button ───────────────────────────────────────────────────────────
  nextBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, paddingTop: 4 },
  nextBtnText: { fontSize: 13, color: C.sage, fontWeight: '700' },

  // ── Archive banner ────────────────────────────────────────────────────────
  archiveBanner:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.orangePale, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.orangeBorder },
  archiveBannerText: { fontSize: 13, color: C.orange, flex: 1, lineHeight: 18, fontWeight: '500' },
  archiveBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: C.orange, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  archiveBtnText:    { color: C.orange, fontWeight: '700', fontSize: 13 },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: C.sage, paddingVertical: 16, borderRadius: 14, marginTop: 4,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  submitBtnDisabled: { backgroundColor: C.borderMid },
  submitBtnText:     { color: C.white, fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  submitHint:        { textAlign: 'center', fontSize: 12, color: C.inkFaint, marginTop: -4 },
});

export default CreateReviewScreen;