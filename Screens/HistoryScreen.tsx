import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL as BASE_URL } from '../config/api';
import { styles } from '../Styles/HistoryScreen.styles';

// ─── Types ───────────────────────────────────────────────────

type HistoryStackParamList = {
  History: undefined;
  AnalysisDetail: { analysisId: string };
};
type HistoryScreenNavigationProp = StackNavigationProp<HistoryStackParamList, 'History'>;
type HistoryScreenRouteProp = RouteProp<HistoryStackParamList, 'History'>;
interface Props {
  navigation: HistoryScreenNavigationProp;
  route: HistoryScreenRouteProp;
}

export interface Analysis {
  id: string;
  analysis_type: 'ripeness' | 'leaf' | 'fruit_disease';
  created_at: string;
  updated_at: string;
  notes: string;
  count: number;
  image_size: { width: number; height: number };
  original_image_url?: string;
  annotated_image_url?: string;
  ripeness?: {
    ripeness: string;
    ripeness_level: number;
    confidence: number;
    color: string;
    texture: string;
    days_to_ripe: string;
    recommendation: string;
    bbox: number[];
    color_metrics: Record<string, number>;
  };
  leaf?: {
    class: string;
    confidence: number;
    bbox: number[];
    detections: any[];
    recommendation: string;
  };
  disease?: {
    class: string;
    confidence: number;
    bbox: number[];
    detections: any[];
    recommendation: string;
  };
}

// ─── Constants ───────────────────────────────────────────────

const HISTORY_URL = `${BASE_URL}/api/history`;

const CATEGORIES = [
  { key: 'all',          label: 'All',        icon: 'grid-outline'       as const },
  { key: 'ripeness',     label: 'Ripeness',   icon: 'leaf-outline'       as const },
  { key: 'color',        label: 'Color',      icon: 'color-palette-outline' as const },
  { key: 'leaf',         label: 'Leaf',       icon: 'medical-outline'    as const },
  { key: 'fruit_disease',label: 'Disease',    icon: 'warning-outline'    as const },
];

const TYPE_META: Record<string, { label: string; icon: any; color: string; barColor: string }> = {
  ripeness:      { label: 'Ripeness Analysis', icon: 'leaf',    color: '#2E9E6E', barColor: '#2E9E6E' },
  leaf:          { label: 'Leaf Health',       icon: 'medical', color: '#3D8C3D', barColor: '#3D8C3D' },
  fruit_disease: { label: 'Disease Detection', icon: 'warning', color: '#C94040', barColor: '#C94040' },
};

const LEAF_RECOMMENDATIONS: Record<string, string> = {
  healthy              : 'Maintain regular watering and fertilization schedule.',
  Healthy              : 'Maintain regular watering and fertilization schedule.',
  anthracnose          : 'Remove affected leaves, improve air circulation, and apply fungicide.',
  Anthracnose          : 'Remove affected leaves, improve air circulation, and apply fungicide.',
  'nutrient deficiency': 'Apply balanced fertilizer. Consider soil testing.',
  'Nutrient Deficient' : 'Apply balanced fertilizer. Consider soil testing.',
  'Pest Infested'      : 'Inspect closely and apply appropriate pesticide or natural control.',
  'pest infested'      : 'Inspect closely and apply appropriate pesticide or natural control.',
};

const COLOR_HEX: Record<string, string> = { brown: '#795548', green: '#4CAF50', purple: '#9C27B0' };
const COLOR_EMOJI: Record<string, string> = { brown: '🟤', green: '🟢', purple: '🟣' };

// ─── Helpers ─────────────────────────────────────────────────

function parseUTCDate(s: string): Date | null {
  if (!s) return null;
  if (s.endsWith('Z') || s.includes('+') || /\d{2}:\d{2}$/.test(s.slice(-6))) {
    const d = new Date(s); return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s + 'Z'); return isNaN(d.getTime()) ? null : d;
}

function timeAgo(dateStr: string): string {
  try {
    const date = parseUTCDate(dateStr);
    if (!date) return 'recently';
    const sec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (sec < 60)  return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60)  return min === 1 ? '1 min ago' : `${min} mins ago`;
    const hr = Math.floor(min / 60);
    if (hr  < 24)  return hr  === 1 ? '1 hour ago' : `${hr} hours ago`;
    const day = Math.floor(hr / 24);
    if (day < 7)   return day === 1 ? 'Yesterday' : `${day} days ago`;
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (date.getUTCFullYear() === new Date().getUTCFullYear())
      return `${M[date.getUTCMonth()]} ${date.getUTCDate()}`;
    return `${M[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  } catch { return 'recently'; }
}

function confColor(c: number) {
  if (c >= 0.9) return '#2E9E6E';
  if (c >= 0.7) return '#D4A017';
  return '#C94040';
}

const RootContainer = Platform.OS === 'web' ? View : SafeAreaView;

// ─── AnalysisCard (isolated so it can hold its own collapsed state) ──

interface CardProps {
  analysis: Analysis;
  imageWidth: number;
  imageHeight: number;
}

const AnalysisCard: React.FC<CardProps> = ({ analysis, imageWidth, imageHeight }) => {
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
  const meta = TYPE_META[analysis.analysis_type] ?? TYPE_META.ripeness;

  let primaryResult = '';
  let confidence    = 0;
  let recommendation = '';

  if (analysis.analysis_type === 'ripeness' && analysis.ripeness) {
    primaryResult  = analysis.ripeness.ripeness.charAt(0).toUpperCase() + analysis.ripeness.ripeness.slice(1);
    confidence     = analysis.ripeness.confidence;
    recommendation = analysis.ripeness.recommendation;
  } else if (analysis.analysis_type === 'leaf' && analysis.leaf) {
    primaryResult  = analysis.leaf.class;
    confidence     = analysis.leaf.confidence;
    recommendation = analysis.leaf.recommendation;
  } else if (analysis.analysis_type === 'fruit_disease' && analysis.disease) {
    primaryResult  = analysis.disease.class;
    confidence     = analysis.disease.confidence;
    recommendation = analysis.disease.recommendation;
  }

  const hasImages = !!(analysis.original_image_url || analysis.annotated_image_url);

  return (
    <View style={styles.analysisCard}>
      {/* Lightbox modal */}
      <Modal visible={!!lightboxUri} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 48, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
            onPress={() => setLightboxUri(null)}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {lightboxUri && (
            <Image
              source={{ uri: lightboxUri }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Coloured accent bar at top */}
      <View style={[styles.cardAccentBar, { backgroundColor: meta.barColor }]} />

      <View style={styles.cardBody}>
        {/* ── Header row ─────────────────────────────────────── */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIconWrap, { backgroundColor: meta.color + '18' }]}>
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.analysisTypeLabel}>{meta.label}</Text>
            <Text style={styles.timeAgo}>{timeAgo(analysis.created_at)}</Text>
          </View>
        </View>

        {/* ── Image thumbnails ───────────────────────────────── */}
        {hasImages && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageStrip}
            contentContainerStyle={styles.imageStripContent}
            snapToInterval={imageWidth + 10}
            decelerationRate="fast"
          >
            {analysis.original_image_url && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setLightboxUri(analysis.original_image_url!)}
                style={[styles.imageThumbWrap, { width: imageWidth }]}
              >
                <Image
                  source={{ uri: analysis.original_image_url }}
                  style={[styles.imageThumb, { width: imageWidth, height: imageHeight }]}
                  resizeMode="cover"
                />
                <View style={styles.imagePill}>
                  <Text style={styles.imagePillText}>Original</Text>
                </View>
              </TouchableOpacity>
            )}
            {analysis.annotated_image_url && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setLightboxUri(analysis.annotated_image_url!)}
                style={[styles.imageThumbWrap, { width: imageWidth }]}
              >
                <Image
                  source={{ uri: analysis.annotated_image_url }}
                  style={[styles.imageThumb, { width: imageWidth, height: imageHeight }]}
                  resizeMode="cover"
                />
                <View style={styles.imagePill}>
                  <Text style={styles.imagePillText}>Analysis</Text>
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* ── Stat chips ─────────────────────────────────────── */}
        {analysis.analysis_type === 'leaf' && analysis.leaf?.detections && analysis.leaf.detections.length > 1 ? (
          // Multi-leaf: one row per detection
          <View style={{ marginBottom: 6 }}>
            <Text style={[styles.statLabel, { marginBottom: 6 }]}>LEAVES DETECTED ({analysis.leaf.detections.length})</Text>
            {analysis.leaf.detections.map((det: any, idx: number) => (
              <View key={det.id ?? idx} style={[styles.statsRow, { marginBottom: 6, backgroundColor: `${meta.color}08`, borderRadius: 8, padding: 8 }]}>
                <View style={[styles.statChip, { flex: 2 }]}>
                  <View>
                    <Text style={styles.statLabel}>Leaf #{det.id ?? idx + 1}</Text>
                    <Text style={[styles.statValue, { color: meta.color }]} numberOfLines={1}>{det.class}</Text>
                  </View>
                </View>
                <View style={styles.statChip}>
                  <View style={[styles.confDot, { backgroundColor: confColor(det.confidence) }]} />
                  <View>
                    <Text style={styles.statLabel}>Confidence</Text>
                    <Text style={[styles.statValue, { color: confColor(det.confidence) }]}>{(det.confidence * 100).toFixed(1)}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.statsRow}>
            {/* Result */}
            <View style={[styles.statChip, { flex: 2 }]}>
              <View>
                <Text style={styles.statLabel}>Result</Text>
                <Text style={[styles.statValue, { color: meta.color }]} numberOfLines={1}>
                  {primaryResult}
                </Text>
              </View>
            </View>
            {/* Confidence */}
            <View style={styles.statChip}>
              <View style={[styles.confDot, { backgroundColor: confColor(confidence) }]} />
              <View>
                <Text style={styles.statLabel}>Confidence</Text>
                <Text style={[styles.statValue, { color: confColor(confidence) }]}>
                  {(confidence * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
            {/* Detections (only if > 1) */}
            {analysis.count > 1 && (
              <View style={styles.statChip}>
                <View>
                  <Text style={styles.statLabel}>Detected</Text>
                  <Text style={styles.statValue}>{analysis.count}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── Recommendation ─────────────────────────────────── */}
        {analysis.analysis_type === 'leaf' && analysis.leaf?.detections && analysis.leaf.detections.length > 1 ? (
          <View style={styles.recBox}>
            <Ionicons name="bulb-outline" size={16} color="#5d873e" style={styles.recIcon} />
            <View style={{ flex: 1 }}>
              {analysis.leaf.detections.map((det: any, idx: number) => (
                <View key={det.id ?? idx} style={{ marginBottom: idx < analysis.leaf!.detections.length - 1 ? 8 : 0 }}>
                  <Text style={[styles.recText, { fontWeight: '700', color: meta.color, marginBottom: 2 }]}>
                    Leaf #{det.id ?? idx + 1} · {det.class}
                  </Text>
                  <Text style={styles.recText}>
                    {LEAF_RECOMMENDATIONS[det.class] || det.recommendation || analysis.leaf!.recommendation || 'Monitor the leaf closely.'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : !!recommendation ? (
          <View style={styles.recBox}>
            <Ionicons name="bulb-outline" size={16} color="#5d873e" style={styles.recIcon} />
            <Text style={styles.recText}>{recommendation}</Text>
          </View>
        ) : null}

        {/* ── Ripeness detail pills ──────────────────────────── */}
        {analysis.analysis_type === 'ripeness' && analysis.ripeness && (
          <View style={styles.pillRow}>
            {!!analysis.ripeness.texture && (
              <View style={styles.pill}>
                <Ionicons name="hand-left-outline" size={12} color="#5d873e" />
                <Text style={styles.pillText}>{analysis.ripeness.texture}</Text>
              </View>
            )}
            {!!analysis.ripeness.days_to_ripe && (
              <View style={styles.pill}>
                <Ionicons name="time-outline" size={12} color="#5d873e" />
                <Text style={styles.pillText}>{analysis.ripeness.days_to_ripe}</Text>
              </View>
            )}
            {!!analysis.ripeness.color && (
              <View style={[styles.pill, { backgroundColor: `${COLOR_HEX[analysis.ripeness.color] ?? '#999'}18`, borderColor: `${COLOR_HEX[analysis.ripeness.color] ?? '#999'}50` }]}>
                <Text style={{ fontSize: 11 }}>{COLOR_EMOJI[analysis.ripeness.color] ?? '🎨'}</Text>
                <Text style={[styles.pillText, { color: COLOR_HEX[analysis.ripeness.color] ?? '#333', fontWeight: '700' }]}>
                  {analysis.ripeness.color.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Colour detail card — color name only ──────────── */}
        {analysis.analysis_type === 'ripeness' && analysis.ripeness?.color && (
          <View style={[styles.recBox, { borderLeftColor: COLOR_HEX[analysis.ripeness.color] ?? '#999', marginTop: 6 }]}>
            <Text style={{ fontSize: 12, color: COLOR_HEX[analysis.ripeness.color] ?? '#333', fontWeight: '700' }}>
              {COLOR_EMOJI[analysis.ripeness.color] ?? '🎨'} Skin Colour — {analysis.ripeness.color.toUpperCase()}
            </Text>
          </View>
        )}

        {/* ── Notes ─────────────────────────────────────────── */}
        {!!analysis.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Note</Text>
            <Text style={styles.notesText}>{analysis.notes}</Text>
          </View>
        )}


      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [analyses,         setAnalyses]         = useState<Analysis[]>([]);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading,          setLoading]           = useState(true);
  const [refreshing,       setRefreshing]        = useState(false);
  const [isLoggedIn,       setIsLoggedIn]        = useState<boolean>(false);

  const { width: windowWidth } = useWindowDimensions();

  // Image dimensions — small thumbnails, full-width contain
  const imgWidth  = Math.min(windowWidth * 0.55, 220);
  const imgHeight = Math.round(imgWidth * 0.72);

  useEffect(() => {
    AsyncStorage.getItem('jwt').then(t =>
      t ? setIsLoggedIn(true) : AsyncStorage.getItem('token').then(t2 => setIsLoggedIn(!!t2))
    );
  }, []);

  const fetchAnalyses = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (!token) { setIsLoggedIn(false); setLoading(false); return; }

      setLoading(true);
      // Always fetch all — client-side filter handles tab selection instantly
      // without a round-trip per tab switch.
      const url = `${HISTORY_URL}/all`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (res.status === 401) { setIsLoggedIn(false); setAnalyses([]); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setAnalyses(Array.isArray(data) ? data : data.analyses || []);
    } catch (err) {
      console.error('fetchAnalyses:', err);
      Alert.alert('Error', 'Failed to load history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);  // fetch all once; tab filter is client-side

  useEffect(() => { if (isLoggedIn) fetchAnalyses(); }, [fetchAnalyses, isLoggedIn]);

  useEffect(() => {
    return navigation.addListener('focus', async () => {
      const t = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (t) { setIsLoggedIn(true); fetchAnalyses(); } else setIsLoggedIn(false);
    });
  }, [navigation, fetchAnalyses]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAnalyses(); }, [fetchAnalyses]);

  const filtered = analyses.filter(a => {
    // 1. Category tab
    if (selectedCategory === 'color') {
      // Show ripeness records that have colour data stored
      if (a.analysis_type !== 'ripeness') return false;
      if (!a.ripeness?.color) return false;
    } else if (selectedCategory !== 'all' && a.analysis_type !== selectedCategory) {
      return false;
    }
    // 2. Search query
    if (searchQuery !== '') {
      const q = searchQuery.toLowerCase();
      const matchesNotes = a.notes?.toLowerCase().includes(q) ?? false;
      const matchesType  = (TYPE_META[a.analysis_type]?.label ?? '').toLowerCase().includes(q);
      if (!matchesNotes && !matchesType) return false;
    }
    return true;
  });

  // ── Not logged in ─────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <RootContainer style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>History</Text>
              <Text style={styles.headerSubtitle}>Your scan records</Text>
            </View>
          </View>
        </View>
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerColumn}>
            <View style={styles.loginPromptContainer}>
              <View style={styles.loginIconWrap}>
                <Ionicons name="lock-closed-outline" size={34} color="#8A9382" />
              </View>
              <Text style={styles.loginPromptTitle}>Login Required</Text>
              <Text style={styles.loginPromptText}>
                Sign in to view your avocado scan history and track results over time.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.getParent()?.navigate('LoginScreen' as never)}
              >
                <Text style={styles.loginButtonText}>Login to Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </RootContainer>
    );
  }

  // ── Main ─────────────────────────────────────────────────
  return (
    <RootContainer style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>Your scan records</Text>
          </View>
          {!loading && (
            <Text style={styles.headerCount}>{filtered.length} scan{filtered.length !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5d873e" />
          ) : undefined
        }
      >
        <View style={styles.centerColumn}>

          {/* Controls */}
          <View style={styles.controlsBar}>
            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={16} color="#8A9382" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search analyses…"
                placeholderTextColor="#B0B8A8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#B0B8A8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesRow}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryButton, selectedCategory === cat.key && styles.categoryButtonActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={cat.icon}
                    size={13}
                    color={selectedCategory === cat.key ? '#fff' : '#5d873e'}
                  />
                  <Text style={[styles.categoryText, selectedCategory === cat.key && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          {loading ? (
            <ActivityIndicator size="large" color="#5d873e" style={{ marginTop: 60 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="analytics-outline" size={36} color="#8A9382" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matches found' : 'No scans yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Start scanning avocados to build your history.'}
              </Text>
            </View>
          ) : (
            filtered.map(a => (
              <AnalysisCard
                key={a.id}
                analysis={a}
                imageWidth={imgWidth}
                imageHeight={imgHeight}
              />
            ))
          )}

        </View>
      </ScrollView>
    </RootContainer>
  );
};

export default HistoryScreen;