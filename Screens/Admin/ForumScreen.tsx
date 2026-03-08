import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  RefreshControl,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { styles } from '../../Styles/ForumScreen.styles';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: string;
  title: string;
  content: string;
  username: string;
  user_id: string;
  author_image?: string;
  category: string;
  imageUrls?: string[];
  likes: number;
  comments_count: number;
  created_at: string;
  archived: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FILTER_TYPES = ['All', 'General', 'Tips', 'Diseases', 'Care'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  general:  '#6366f1',
  tips:     '#10b981',
  diseases: '#ef4444',
  care:     '#f59e0b',
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? '#4A7C2F';
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportToPDF(posts: Post[]) {
  if (Platform.OS !== 'web') return;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

  const rows = posts.map((p, i) => `
    <tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
      <td>${p.username}</td>
      <td>${p.title}</td>
      <td>
        <span style="
          background:${getCategoryColor(p.category)}22;
          color:${getCategoryColor(p.category)};
          padding:2px 10px; border-radius:8px;
          font-size:11px; font-weight:700; text-transform:uppercase;
        ">${p.category}</span>
      </td>
      <td style="text-align:center">❤️ ${p.likes}</td>
      <td style="text-align:center">💬 ${p.comments_count}</td>
      <td>${formatDate(p.created_at)}</td>
    </tr>
  `).join('');

  const totalLikes    = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>AvoCare – Forum Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; background:#F5FAF0; color:#2D5016; padding:32px; }
        .header { background:#2D5016; color:#fff; border-radius:14px; padding:28px 32px; margin-bottom:28px; }
        .header h1 { font-size:26px; font-weight:800; letter-spacing:-0.5px; }
        .header p  { font-size:12px; color:#8DB87A; margin-top:4px; letter-spacing:1.5px; text-transform:uppercase; }
        .meta { display:flex; gap:24px; margin-top:16px; }
        .meta-item { background:rgba(255,255,255,0.12); border-radius:8px; padding:8px 16px; }
        .meta-item .num { display:block; font-size:20px; font-weight:800; }
        .meta-item .lbl { display:block; font-size:10px; color:#8DB87A; }
        table { width:100%; border-collapse:collapse; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(45,80,22,0.08); }
        thead tr { background:#2D5016; }
        thead th { color:#8DB87A; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:12px 14px; text-align:left; }
        tbody td { padding:11px 14px; font-size:13px; color:#2D5016; border-bottom:1px solid #E8F0DF; }
        .footer { margin-top:20px; text-align:right; font-size:11px; color:#6A8A50; }
      </style>
    </head>
    <body>
      <div class="header">
        <p>AvoCare Admin</p>
        <h1>Forum Report</h1>
        <div class="meta">
          <div class="meta-item"><span class="num">${posts.length}</span><span class="lbl">Total Posts</span></div>
          <div class="meta-item"><span class="num">${totalLikes}</span><span class="lbl">Total Likes</span></div>
          <div class="meta-item"><span class="num">${totalComments}</span><span class="lbl">Total Comments</span></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Author</th><th>Title</th><th>Category</th>
            <th>Likes</th><th>Comments</th><th>Date</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="footer">Generated on ${new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}</div>
    </body>
    </html>
  `;

  const blob   = new Blob([html], { type: 'text/html' });
  const url    = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ─── Archive Confirm Modal ────────────────────────────────────────────────────
interface ArchiveConfirmModalProps {
  visible: boolean;
  postTitle?: string;
  archiving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ArchiveConfirmModal: React.FC<ArchiveConfirmModalProps> = ({
  visible,
  postTitle,
  archiving,
  onConfirm,
  onCancel,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onCancel}
  >
    <View style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    }}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxWidth: 380,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
      }}>
        {/* Icon */}
        <View style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#FEF2F2',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Ionicons name="archive-outline" size={30} color="#ef4444" />
        </View>

        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: '#2D5016',
          marginBottom: 8,
          textAlign: 'center',
        }}>
          Archive Post
        </Text>

        <Text style={{
          fontSize: 13,
          color: '#6A8A50',
          textAlign: 'center',
          marginBottom: 6,
          lineHeight: 19,
        }}>
          Are you sure you want to archive this post?
        </Text>

        {postTitle ? (
          <Text style={{
            fontSize: 13,
            color: '#2D5016',
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 24,
            paddingHorizontal: 8,
          }}
            numberOfLines={2}
          >
            "{postTitle}"
          </Text>
        ) : (
          <View style={{ marginBottom: 24 }} />
        )}

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 12,
              backgroundColor: '#F0F5EA',
              alignItems: 'center',
            }}
            onPress={onCancel}
            disabled={archiving}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#4A7C2F' }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 12,
              backgroundColor: '#ef4444',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
            onPress={onConfirm}
            disabled={archiving}
            activeOpacity={0.8}
          >
            {archiving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="archive-outline" size={15} color="#fff" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Archive</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Component ────────────────────────────────────────────────────────────────
const ForumScreen = () => {
  const [searchQuery, setSearchQuery]           = useState('');
  const [refreshing, setRefreshing]             = useState(false);
  const [dimensions, setDimensions]             = useState(Dimensions.get('window'));
  const [posts, setPosts]                       = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts]       = useState<Post[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedPost, setSelectedPost]         = useState<Post | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filterType, setFilterType]             = useState('All');
  const [archiving, setArchiving]               = useState(false);
  const [showArchived, setShowArchived]         = useState(false);

  // ─── Archive confirm state ───────────────────────────────────────────────
  const [archiveConfirmVisible, setArchiveConfirmVisible] = useState(false);
  const [postToArchive, setPostToArchive]                 = useState<Post | null>(null);

  const { width } = dimensions;
  const isDesktop = width >= 768;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => { fetchPosts(); }, [showArchived]);
  useEffect(() => { filterPosts(); }, [searchQuery, posts, filterType]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (!token) { Alert.alert('Error', 'Authentication required'); return; }

      const url = showArchived 
        ? `${API_BASE_URL}/api/forum/?show_archived_only=true`
        : `${API_BASE_URL}/api/forum/`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        Alert.alert('Error', 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const filterPosts = () => {
    let filtered = posts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q)
      );
    }
    if (filterType !== 'All') {
      filtered = filtered.filter((p) => p.category.toLowerCase() === filterType.toLowerCase());
    }
    setFilteredPosts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  // ─── Archive ──────────────────────────────────────────────────────────────
  const archivePost = async (postId: string) => {
    try {
      setArchiving(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/forum/${postId}/admin/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setArchiveConfirmVisible(false);
        setPostToArchive(null);
        setDetailModalVisible(false);
        fetchPosts();
      } else {
        Alert.alert('Error', data.error || 'Failed to archive post');
      }
    } catch (error) {
      console.error('Error archiving post:', error);
      Alert.alert('Error', 'Failed to archive post');
    } finally {
      setArchiving(false);
    }
  };

  // Opens the custom confirm modal instead of Alert
  const confirmArchive = (post: Post) => {
    setPostToArchive(post);
    setArchiveConfirmVisible(true);
  };

  // ─── Unarchive ────────────────────────────────────────────────────────────
  const unarchivePost = async (postId: string) => {
    try {
      setArchiving(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/forum/${postId}/admin/unarchive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setDetailModalVisible(false);
        fetchPosts();
        Alert.alert('Success', 'Post unarchived successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to unarchive post');
      }
    } catch (error) {
      console.error('Error unarchiving post:', error);
      Alert.alert('Error', 'Failed to unarchive post');
    } finally {
      setArchiving(false);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalLikes    = posts.reduce((s, p) => s + p.likes, 0);
  const totalComments = posts.reduce((s, p) => s + p.comments_count, 0);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
            <Text style={styles.headerTitle}>Forum</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7C2F" />
          <Text style={styles.loadingText}>Loading posts…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Archive Confirm Modal ── */}
      <ArchiveConfirmModal
        visible={archiveConfirmVisible}
        postTitle={postToArchive?.title}
        archiving={archiving}
        onConfirm={() => postToArchive && archivePost(postToArchive.id)}
        onCancel={() => {
          if (!archiving) {
            setArchiveConfirmVisible(false);
            setPostToArchive(null);
          }
        }}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
          <Text style={styles.headerTitle}>Forum</Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.pdfBtn}
              onPress={() => {
                if (filteredPosts.length === 0) { Alert.alert('No Data', 'No posts to export.'); return; }
                exportToPDF(filteredPosts);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={14} color="#fff" />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.toggleBtn, !showArchived && styles.toggleBtnActive]}
            onPress={() => setShowArchived(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles" size={16} color={!showArchived ? "#fff" : "#8DB87A"} />
            <Text style={[styles.toggleBtnText, !showArchived && styles.toggleBtnTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, showArchived && styles.toggleBtnActive]}
            onPress={() => setShowArchived(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="archive" size={16} color={showArchived ? "#fff" : "#8DB87A"} />
            <Text style={[styles.toggleBtnText, showArchived && styles.toggleBtnTextActive]}>Archived</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
            {refreshing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={20} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Bar ── */}
      <View style={styles.statsBar}>
        {[
          { num: posts.length, label: showArchived ? 'Archived' : 'Active Posts' },
          { num: totalLikes,    label: 'Total Likes' },
          { num: totalComments, label: 'Comments' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.statDivider} />}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />
        }
      >

        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#6A8A50" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, authors…"
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

        {/* ── Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TYPES.map((type) => {
            const count = type === 'All'
              ? posts.length
              : posts.filter((p) => p.category.toLowerCase() === type.toLowerCase()).length;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                onPress={() => setFilterType(type)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                  {type} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Empty State ── */}
        {filteredPosts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 52 }}>💬</Text>
            <Text style={styles.emptyText}>No posts found</Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ fontSize: 13, color: '#4A7C2F', fontWeight: '600', marginTop: 4 }}>Clear search</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Desktop Table ── */}
        {isDesktop && filteredPosts.length > 0 && (
          <View style={styles.tableWrapper}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <View style={styles.colAuthor}><Text style={styles.tableHeaderText}>Author</Text></View>
              <View style={styles.colTitle}><Text style={styles.tableHeaderText}>Title</Text></View>
              <View style={styles.colCategory}><Text style={styles.tableHeaderText}>Category</Text></View>
              <View style={styles.colStats}><Text style={styles.tableHeaderText}>Stats</Text></View>
              <View style={styles.colDate}><Text style={styles.tableHeaderText}>Date</Text></View>
              <View style={styles.colActions}><Text style={styles.tableHeaderText}>Actions</Text></View>
            </View>

            {/* Rows */}
            {filteredPosts.map((post, index) => (
              <View key={post.id} style={[styles.tableRow, index % 2 !== 0 && styles.tableRowEven]}>
                {/* Author */}
                <View style={styles.colAuthor}>
                  {post.author_image ? (
                    <Image source={{ uri: post.author_image }} style={styles.authorImageTable} />
                  ) : (
                    <View style={styles.authorAvatarTable}>
                      <Text style={styles.authorAvatarTextTable}>{getInitial(post.username)}</Text>
                    </View>
                  )}
                  <Text style={styles.authorNameTable} numberOfLines={1}>{post.username}</Text>
                </View>

                {/* Title */}
                <View style={styles.colTitle}>
                  <Text style={styles.tableCell} numberOfLines={2}>{post.title}</Text>
                </View>

                {/* Category */}
                <View style={styles.colCategory}>
                  <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(post.category)}18` }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(post.category) }]}>
                      {post.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.colStats}>
                  <View style={styles.postStatItem}>
                    <Ionicons name="heart" size={13} color="#ef4444" />
                    <Text style={styles.postStatText}>{post.likes}</Text>
                  </View>
                  <View style={styles.postStatItem}>
                    <Ionicons name="chatbubble" size={13} color="#3b82f6" />
                    <Text style={styles.postStatText}>{post.comments_count}</Text>
                  </View>
                </View>

                {/* Date */}
                <View style={styles.colDate}>
                  <Text style={[styles.tableCell, { fontSize: 11, color: '#6A8A50' }]}>{formatDate(post.created_at)}</Text>
                </View>

                {/* Actions */}
                <View style={styles.colActions}>
                  <TouchableOpacity style={styles.viewButton} onPress={() => { setSelectedPost(post); setDetailModalVisible(true); }}>
                    <Ionicons name="eye-outline" size={15} color="#4A7C2F" />
                  </TouchableOpacity>
                  {showArchived ? (
                    <TouchableOpacity style={styles.unarchiveButton} onPress={() => unarchivePost(post.id)}>
                      <Ionicons name="reload-outline" size={15} color="#10b981" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.archiveButton} onPress={() => confirmArchive(post)}>
                      <Ionicons name="archive-outline" size={15} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Mobile Card View ── */}
        {!isDesktop && filteredPosts.length > 0 && (
          <View style={styles.postsList}>
            {filteredPosts.map((post) => (
              <TouchableOpacity
                key={post.id}
                style={styles.postCard}
                onPress={() => { setSelectedPost(post); setDetailModalVisible(true); }}
                activeOpacity={0.8}
              >
                <View style={styles.postHeader}>
                  {post.author_image ? (
                    <Image source={{ uri: post.author_image }} style={styles.authorImage} />
                  ) : (
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorAvatarText}>{getInitial(post.username)}</Text>
                    </View>
                  )}
                  <View style={styles.postHeaderInfo}>
                    <Text style={styles.authorName}>{post.username}</Text>
                    <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(post.category)}18` }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(post.category) }]}>
                      {post.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>

                <View style={styles.postFooter}>
                  <View style={styles.postStatItem}>
                    <Ionicons name="heart" size={14} color="#ef4444" />
                    <Text style={styles.postStatText}>{post.likes}</Text>
                  </View>
                  <View style={styles.postStatItem}>
                    <Ionicons name="chatbubble" size={14} color="#3b82f6" />
                    <Text style={styles.postStatText}>{post.comments_count}</Text>
                  </View>
                  {showArchived ? (
                    <TouchableOpacity
                      style={styles.unarchiveButtonMobile}
                      onPress={() => unarchivePost(post.id)}
                    >
                      <Ionicons name="reload-outline" size={14} color="#10b981" />
                      <Text style={styles.unarchiveButtonText}>Unarchive</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.archiveButtonMobile}
                      onPress={() => confirmArchive(post)}
                    >
                      <Ionicons name="archive-outline" size={14} color="#ef4444" />
                      <Text style={styles.archiveButtonText}>Archive</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* ── Detail Modal ── */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDesktop && styles.modalContainerDesktop]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Details</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={22} color="#2D5016" />
              </TouchableOpacity>
            </View>

            {selectedPost && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Author banner */}
                <View style={styles.authorInfoModal}>
                  {selectedPost.author_image ? (
                    <Image source={{ uri: selectedPost.author_image }} style={styles.authorImageModal} />
                  ) : (
                    <View style={styles.authorAvatarModal}>
                      <Text style={styles.authorAvatarTextModal}>{getInitial(selectedPost.username)}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorNameModal}>{selectedPost.username}</Text>
                    <Text style={styles.postDateModal}>{formatDate(selectedPost.created_at)}</Text>
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(selectedPost.category)}18` }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(selectedPost.category) }]}>
                      {selectedPost.category.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.postTitleModal}>{selectedPost.title}</Text>
                <Text style={styles.postContentModal}>{selectedPost.content}</Text>

                {selectedPost.imageUrls && selectedPost.imageUrls.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                    {selectedPost.imageUrls.map((url, index) => (
                      <Image key={index} source={{ uri: url }} style={styles.postImage} />
                    ))}
                  </ScrollView>
                )}

                {/* Stats */}
                <View style={styles.statsRowModal}>
                  <View style={styles.statItemModal}>
                    <Ionicons name="heart" size={18} color="#ef4444" />
                    <Text style={styles.statTextModal}>{selectedPost.likes} Likes</Text>
                  </View>
                  <View style={styles.statItemModal}>
                    <Ionicons name="chatbubble" size={18} color="#3b82f6" />
                    <Text style={styles.statTextModal}>{selectedPost.comments_count} Comments</Text>
                  </View>
                </View>

                {/* Archive/Unarchive button */}
                {showArchived ? (
                  <TouchableOpacity
                    style={styles.unarchiveButtonModal}
                    onPress={() => selectedPost && unarchivePost(selectedPost.id)}
                    disabled={archiving}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="reload-outline" size={18} color="#fff" />
                    <Text style={styles.unarchiveButtonTextModal}>Unarchive Post</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.archiveButtonModal}
                    onPress={() => confirmArchive(selectedPost)}
                    disabled={archiving}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="archive-outline" size={18} color="#fff" />
                    <Text style={styles.archiveButtonTextModal}>Archive Post</Text>
                  </TouchableOpacity>
                )}

                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default ForumScreen;