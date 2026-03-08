import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { styles } from '../../Styles/ReviewScreen.styles';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReviewImage {
  public_id: string;
  url: string;
}

interface ReviewUser {
  _id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
}

interface ReviewProduct {
  _id: string;
  name?: string;
  price?: number;
  images?: ReviewImage[];
}

interface Review {
  id: string;
  _id: string;
  user: ReviewUser | null;
  product: ReviewProduct | null;
  rating: number;
  comment: string;
  images: ReviewImage[];
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getUserDisplayName = (user: ReviewUser | null): string => {
  if (!user) return 'Unknown User';
  if (user.name) return user.name;
  if (user.first_name || user.last_name)
    return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return user.email ?? 'Unknown User';
};

const getInitials = (user: ReviewUser | null): string => {
  const name = getUserDisplayName(user);
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => (
  <View style={{ flexDirection: 'row', gap: 1 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={size}
        color={star <= rating ? '#C8A84B' : '#C5D9B0'}
      />
    ))}
  </View>
);

const StatusBadge: React.FC<{ archived: boolean }> = ({ archived }) => (
  <View
    style={[
      styles.badge,
      {
        backgroundColor: archived ? '#FFF3E0' : '#E8F5E0',
        borderColor: archived ? '#C8A84B' : '#4A7C2F',
      },
    ]}
  >
    <View style={[styles.badgeDot, { backgroundColor: archived ? '#C8A84B' : '#4A7C2F' }]} />
    <Text style={[styles.badgeText, { color: archived ? '#8D6E00' : '#2D5016' }]}>
      {archived ? 'Archived' : 'Active'}
    </Text>
  </View>
);

// ── Review Detail Modal ────────────────────────────────────────────────────────

interface ModalProps {
  review: Review | null;
  visible: boolean;
  isAdmin: boolean;
  actionLoading: boolean;
  onClose: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

const ReviewDetailModal: React.FC<ModalProps> = ({
  review, visible, isAdmin, actionLoading, onClose, onArchive, onUnarchive,
}) => {
  if (!review) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review Detail</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#2D5016" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Product */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>🛒 Product</Text>
              <View style={styles.modalProductRow}>
                {review.product?.images?.[0]?.url ? (
                  <Image source={{ uri: review.product.images[0].url }} style={styles.modalProductImage} />
                ) : (
                  <View style={[styles.modalProductImage, styles.modalProductImagePlaceholder]}>
                    <Text style={{ fontSize: 20 }}>🥑</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalProductName}>{review.product?.name ?? 'Unknown Product'}</Text>
                  {review.product?.price !== undefined && (
                    <Text style={styles.modalProductPrice}>₱{Number(review.product.price).toFixed(2)}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Reviewer */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>👤 Reviewer</Text>
              <View style={styles.modalUserRow}>
                {review.user?.avatar ? (
                  <Image source={{ uri: review.user.avatar }} style={styles.modalAvatar} />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarInitials}>{getInitials(review.user)}</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.modalUserName}>{getUserDisplayName(review.user)}</Text>
                  {review.user?.email && (
                    <Text style={styles.modalUserEmail}>{review.user.email}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>⭐ Rating</Text>
              <View style={styles.modalRatingRow}>
                <StarRating rating={review.rating} size={22} />
                <Text style={styles.modalRatingNum}>{review.rating}/5</Text>
              </View>
            </View>

            {/* Comment */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>💬 Comment</Text>
              <View style={styles.modalCommentBox}>
                <Text style={styles.modalCommentText}>{review.comment}</Text>
              </View>
            </View>

            {/* Images */}
            {review.images?.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>📷 Photos ({review.images.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
                    {review.images.map((img, i) => (
                      <Image key={i} source={{ uri: img.url }} style={styles.modalReviewImage} />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Timeline */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>📅 Timeline</Text>
              <View style={styles.modalMetaBox}>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaKey}>Reviewed on</Text>
                  <Text style={styles.modalMetaVal}>{formatDate(review.createdAt)}</Text>
                </View>
                {review.isArchived && review.archivedAt && (
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaKey}>Archived on</Text>
                    <Text style={[styles.modalMetaVal, { color: '#C8A84B' }]}>
                      {formatDate(review.archivedAt)}
                    </Text>
                  </View>
                )}
                <View style={[styles.modalMetaRow, { marginBottom: 0 }]}>
                  <Text style={styles.modalMetaKey}>Status</Text>
                  <StatusBadge archived={review.isArchived} />
                </View>
              </View>
            </View>

            {/* Admin Actions */}
            {isAdmin && (
              <View style={[styles.modalSection, { marginBottom: 8 }]}>
                {review.isArchived ? (
                  <TouchableOpacity
                    style={styles.unarchiveBtn}
                    onPress={() => onUnarchive(review.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="archive-arrow-up-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Restore Review</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.archiveBtnFull}
                    onPress={() => onArchive(review.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="archive-arrow-down-outline" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Archive Review</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── Confirm Modal (cross-platform, replaces Alert.alert / window.confirm) ─────

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible, title, message, confirmLabel, confirmColor = '#C0392B',
  icon = '❓', onConfirm, onCancel,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 380,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
      }}>
        {/* Icon */}
        <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>{icon}</Text>

        {/* Title */}
        <Text style={{
          fontSize: 18,
          fontWeight: '800',
          color: '#2D5016',
          textAlign: 'center',
          marginBottom: 8,
        }}>{title}</Text>

        {/* Message */}
        <Text style={{
          fontSize: 14,
          color: '#5A7A40',
          textAlign: 'center',
          lineHeight: 20,
          marginBottom: 24,
        }}>{message}</Text>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={onCancel}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: '#F0F4EC',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#5A7A40' }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: confirmColor,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ── Table Row ──────────────────────────────────────────────────────────────────

interface RowProps {
  review: Review;
  index: number;
  isAdmin: boolean;
  actionLoading: boolean;
  onPress: () => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

const TableRow: React.FC<RowProps> = ({
  review, index, isAdmin, actionLoading, onPress, onArchive, onUnarchive,
}) => {
  const isEven = index % 2 === 0;
  // Cross-platform action guard — prevents row's onPress from firing when
  // an action button is tapped (works on both web and native)
  const actionFiredRef = useRef(false);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        if (actionFiredRef.current) {
          actionFiredRef.current = false;
          return;
        }
        onPress();
      }}
      style={[
        styles.tableRow,
        review.isArchived ? styles.tableRowArchived : (isEven ? styles.tableRowEven : {}),
      ]}
    >
      {/* Archived left accent */}
      {review.isArchived && (
        <View style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          backgroundColor: '#C8A84B',
        }} />
      )}

      {/* User */}
      <View style={[styles.colUser, { paddingLeft: review.isArchived ? 6 : 0 }]}>
        <View style={styles.userCellInner}>
          {review.user?.avatar ? (
            <Image source={{ uri: review.user.avatar }} style={styles.tableAvatar} />
          ) : (
            <View style={styles.tableAvatarPlaceholder}>
              <Text style={styles.tableAvatarInitials}>{getInitials(review.user)}</Text>
            </View>
          )}
          <Text style={styles.tableUserName} numberOfLines={2}>
            {getUserDisplayName(review.user)}
          </Text>
        </View>
      </View>

      {/* Product */}
      <View style={styles.colProduct}>
        <View style={styles.productCellInner}>
          {review.product?.images?.[0]?.url ? (
            <Image source={{ uri: review.product.images[0].url }} style={styles.tableProductThumb} />
          ) : (
            <View style={[styles.tableProductThumb, styles.tableProductThumbPlaceholder]}>
              <Text style={{ fontSize: 12 }}>🥑</Text>
            </View>
          )}
          <Text style={styles.tableProductName} numberOfLines={2}>
            {review.product?.name ?? '—'}
          </Text>
        </View>
      </View>

      {/* Rating */}
      <View style={styles.colRating}>
        <View style={styles.ratingCellInner}>
          <StarRating rating={review.rating} size={12} />
          <Text style={styles.ratingNum}>{review.rating}/5</Text>
        </View>
      </View>

      {/* Comment */}
      <View style={styles.colComment}>
        <Text style={[styles.tableCell, { textAlign: 'left', fontSize: 12, color: '#444' }]} numberOfLines={2}>
          {review.comment}
        </Text>
      </View>

      {/* Status */}
      <View style={styles.colStatus}>
        <StatusBadge archived={review.isArchived} />
      </View>

      {/* Date */}
      <View style={styles.colDate}>
        <Text style={[styles.tableCell, { fontSize: 11, color: '#6A8A50' }]}>
          {formatDate(review.createdAt)}
        </Text>
      </View>

      {/* Actions */}
      {isAdmin && (
        <View style={styles.colActions}>
          <View style={styles.actionsCellInner}>
            {/* Eye / Detail */}
            <TouchableOpacity
              style={styles.tableDetailBtn}
              onPress={() => {
                actionFiredRef.current = true;
                onPress();
              }}
            >
              <Ionicons name="eye-outline" size={14} color="#4A7C2F" />
            </TouchableOpacity>

            {/* Archive / Restore */}
            {review.isArchived ? (
              <TouchableOpacity
                style={styles.tableRestoreBtn}
                onPress={() => {
                  actionFiredRef.current = true;
                  onUnarchive(review.id);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ width: 14, height: 14 }} />
                ) : (
                  <MaterialCommunityIcons name="archive-arrow-up-outline" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.tableArchiveBtn}
                onPress={() => {
                  actionFiredRef.current = true;
                  onArchive(review.id);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ width: 14, height: 14 }} />
                ) : (
                  <MaterialCommunityIcons name="archive-arrow-down-outline" size={14} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────────

const ReviewScreen: React.FC = () => {
  const [reviews, setReviews]               = useState<Review[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [modalVisible, setModalVisible]     = useState(false);
  const [filter, setFilter]                 = useState<'all' | 'active' | 'archived'>('all');
  const [search, setSearch]                 = useState('');
  const [isAdmin, setIsAdmin]               = useState(false);

  // ── Confirm modal state ───────────────────────────────────────────────────
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: string;
    icon: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'OK',
    confirmColor: '#C0392B',
    icon: '❓',
    onConfirm: () => {},
  });

  const showConfirm = (opts: {
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor?: string;
    icon?: string;
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      visible: true,
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.confirmLabel,
      confirmColor: opts.confirmColor ?? '#C0392B',
      icon: opts.icon ?? '❓',
      onConfirm: opts.onConfirm,
    });
  };

  const hideConfirm = () =>
    setConfirmModal((prev) => ({ ...prev, visible: false }));

  const checkAdmin = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsAdmin(user?.role === 'admin');
      }
    } catch {}
  };

  const fetchReviews = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/reviews/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Failed to fetch reviews');
      setReviews(data.reviews ?? []);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err?.message ?? 'Failed to load reviews.');
      } else {
        Alert.alert('Error', err?.message ?? 'Failed to load reviews.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkAdmin();
    fetchReviews();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews(true);
  };

  const handleArchive = useCallback((reviewId: string) => {
    showConfirm({
      title: 'Archive Review',
      message: 'This review will be hidden from public view. You can restore it later.',
      confirmLabel: 'Archive',
      confirmColor: '#C0392B',
      icon: '📦',
      onConfirm: async () => {
        hideConfirm();
        setActionLoading(reviewId);
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/api/admin/review/${reviewId}/archive`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message ?? 'Failed to archive review');
          setModalVisible(false);
          setSelectedReview(null);
          await fetchReviews(true);
        } catch (err: any) {
          showConfirm({
            title: 'Error',
            message: err?.message ?? 'Failed to archive review.',
            confirmLabel: 'OK',
            confirmColor: '#4A7C2F',
            icon: '❌',
            onConfirm: hideConfirm,
          });
        } finally {
          setActionLoading(null);
        }
      },
    });
  }, [fetchReviews]);

  const handleUnarchive = useCallback((reviewId: string) => {
    showConfirm({
      title: 'Restore Review',
      message: 'This review will be made visible to the public again.',
      confirmLabel: 'Restore',
      confirmColor: '#4A7C2F',
      icon: '🌿',
      onConfirm: async () => {
        hideConfirm();
        setActionLoading(reviewId);
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_BASE_URL}/api/admin/review/${reviewId}/restore`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message ?? 'Failed to restore review');
          setModalVisible(false);
          setSelectedReview(null);
          await fetchReviews(true);
        } catch (err: any) {
          showConfirm({
            title: 'Error',
            message: err?.message ?? 'Failed to restore review.',
            confirmLabel: 'OK',
            confirmColor: '#4A7C2F',
            icon: '❌',
            onConfirm: hideConfirm,
          });
        } finally {
          setActionLoading(null);
        }
      },
    });
  }, [fetchReviews]);

  const openDetail = (review: Review) => {
    setSelectedReview(review);
    setModalVisible(true);
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesFilter =
      filter === 'all' ? true : filter === 'active' ? !r.isArchived : r.isArchived;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      getUserDisplayName(r.user).toLowerCase().includes(q) ||
      (r.product?.name ?? '').toLowerCase().includes(q) ||
      r.comment.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const activeCount   = reviews.filter((r) => !r.isArchived).length;
  const archivedCount = reviews.filter((r) => r.isArchived).length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2D5016" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
          <Text style={styles.headerTitle}>Reviews</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchReviews()}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{reviews.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#4A7C2F' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#C8A84B' }]}>{archivedCount}</Text>
          <Text style={styles.statLabel}>Archived</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#C8A84B' }]}>⭐ {avgRating}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#6A8A50" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by user, product, comment…"
          placeholderTextColor="#A0B89A"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#A0B89A" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'active', 'archived'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f === 'all' ? '🌿 All' : f === 'active' ? '✅ Active' : '📦 Archived'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Table */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A7C2F" />
          <Text style={styles.loadingText}>Loading reviews…</Text>
        </View>
      ) : filteredReviews.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🥑</Text>
          <Text style={styles.emptyTitle}>No reviews found</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Try a different search term' : 'Nothing here yet'}
          </Text>
        </View>
      ) : (
        <View style={styles.tableWrapper}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.colUser}>
              <Text style={styles.tableHeaderCell}>User</Text>
            </View>
            <View style={styles.colProduct}>
              <Text style={styles.tableHeaderCell}>Product</Text>
            </View>
            <View style={styles.colRating}>
              <Text style={styles.tableHeaderCell}>Rating</Text>
            </View>
            <View style={styles.colComment}>
              <Text style={styles.tableHeaderCell}>Comment</Text>
            </View>
            <View style={styles.colStatus}>
              <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            <View style={styles.colDate}>
              <Text style={styles.tableHeaderCell}>Date</Text>
            </View>
            {isAdmin && (
              <View style={styles.colActions}>
                <Text style={styles.tableHeaderCell}>Actions</Text>
              </View>
            )}
          </View>

          {/* Data Rows */}
          <ScrollView
            style={styles.tableScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4A7C2F']}
                tintColor="#4A7C2F"
              />
            }
          >
            {filteredReviews.map((item, index) => (
              <TableRow
                key={item.id}
                review={item}
                index={index}
                isAdmin={isAdmin}
                actionLoading={actionLoading === item.id}
                onPress={() => openDetail(item)}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Detail modal */}
      <ReviewDetailModal
        review={selectedReview}
        visible={modalVisible}
        isAdmin={isAdmin}
        actionLoading={actionLoading === selectedReview?._id}
        onClose={() => {
          setModalVisible(false);
          setSelectedReview(null);
        }}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
      />

      {/* Confirm / Alert modal (cross-platform) */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmColor={confirmModal.confirmColor}
        icon={confirmModal.icon}
        onConfirm={confirmModal.onConfirm}
        onCancel={hideConfirm}
      />
    </View>
  );
};

export default ReviewScreen;