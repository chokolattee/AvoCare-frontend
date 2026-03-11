import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { styles } from '../../Styles/DashboardScreen.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// ─── Platform-safe imports (native only) ─────────────────────────────────────
let MediaLibrary: any = null;
let ViewShot: any = null;
let captureRef: any = null;

if (Platform.OS !== 'web') {
  MediaLibrary = require('expo-media-library');
  const vs = require('react-native-view-shot');
  ViewShot = vs.default;
  captureRef = vs.captureRef;
}

declare const html2canvas: any;

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminStackParamList = {
  Dashboard: undefined;
  Users: undefined;
  Market: undefined;
  Forum: undefined;
  Analysis: undefined;
};
type DashboardScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'Dashboard'>;
interface Props { navigation: DashboardScreenNavigationProp; }
interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  change: string;
  trend: 'up' | 'down';
  color: string;
}
type DownloadMode = 'pdf' | 'image';

// ─── Constants ────────────────────────────────────────────────────────────────
// Only these 4 disease classes from the model
const DISEASE_CLASSES = ['Anthracnose', 'Healthy', 'Scab', 'Stem End Rot'];
const DISEASE_COLOR_MAP: Record<string, string> = {
  Anthracnose:    '#ef4444',
  Healthy:        '#4A7C2F',
  Scab:           '#f59e0b',
  'Stem End Rot': '#9C27B0',
};

const RIPENESS_CLASSES = ['Underripe', 'Ripe', 'Overripe'];
const RIPENESS_COLOR_MAP: Record<string, string> = {
  Underripe: '#7ab648',
  Ripe:      '#f59e0b',
  Overripe:  '#ef4444',
};

const CHART_OPTIONS = [
  { key: 'statsOverview',        label: 'Stats Overview',        desc: 'Users, scans, posts & leaf stats' },
  { key: 'userActivity',         label: 'User Activity',         desc: 'Last 7 days activity trend' },
  { key: 'scanDistribution',     label: 'Scan Distribution',     desc: 'Leaves, ripeness, disease counts' },
  { key: 'diseaseDetection',     label: 'Disease Detection',     desc: 'Disease type breakdown' },
  { key: 'leafHealth',           label: 'Leaf Health',           desc: 'Leaf condition distribution' },
  { key: 'ripenessDistribution', label: 'Ripeness Distribution', desc: 'Underripe · Ripe · Overripe breakdown' },
  { key: 'colorDistribution',    label: 'Colour Distribution',   desc: 'Avocado skin colour breakdown' },
  { key: 'marketSales',          label: 'Market Sales',          desc: 'Revenue & order stats' },
];

const baseChartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(45, 80, 22, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(45, 80, 22, ${opacity})`,
  style: { borderRadius: 12 },
  propsForDots: { r: '5', strokeWidth: '2', stroke: '#2D5016' },
  propsForBackgroundLines: { strokeDasharray: '', stroke: '#E8F0DF', strokeWidth: 1 },
};

// ─── Web utilities ────────────────────────────────────────────────────────────
function ensureHtml2Canvas(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof html2canvas !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load html2canvas'));
    document.head.appendChild(script);
  });
}
async function webCaptureAndDownload(domId: string, filename: string): Promise<void> {
  await ensureHtml2Canvas();
  const el = document.getElementById(domId);
  if (!el) throw new Error(`Element #${domId} not found`);
  const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
async function webCaptureBase64(domId: string): Promise<string> {
  await ensureHtml2Canvas();
  const el = document.getElementById(domId);
  if (!el) return '';
  const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
  return canvas.toDataURL('image/png');
}

// ─── Logo loader ──────────────────────────────────────────────────────────────
async function getLogoDataUrl(): Promise<string> {
  try {
    const { Asset } = require('expo-asset');
    const asset = Asset.fromModule(require('../../assets/avocado-icon.png'));
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return '';
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      return `data:image/png;base64,${base64}`;
    }
  } catch { return ''; }
}

// ─── Horizontal bar chart (React Native) ─────────────────────────────────────
interface HBarItem { label: string; value: number; color: string; maxValue: number; }

const HorizontalBarChart: React.FC<{ items: HBarItem[]; width: number }> = ({ items, width }) => {
  const barAreaWidth = width - 130; // label(100) + value(30)
  return (
    <View style={{ paddingVertical: 8 }}>
      {items.map((item, i) => {
        const pct = item.maxValue > 0 ? (item.value / item.maxValue) : 0;
        const barW = Math.max(barAreaWidth * pct, item.value > 0 ? 4 : 0);
        return (
          <View key={i} style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#2D5016', width: 130 }} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: item.color, marginLeft: 4 }}>
                {item.value.toLocaleString()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: barAreaWidth, height: 14, backgroundColor: '#E8F0DF', borderRadius: 7, overflow: 'hidden' }}>
                <View style={{ width: barW, height: 14, backgroundColor: item.color, borderRadius: 7 }} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

// ─── PDF builder ──────────────────────────────────────────────────────────────
function buildPDFHtml(
  selected: Record<string, boolean>,
  stats: any,
  images: Record<string, string> = {},
  logoDataUrl = '',
): string {
  let sections = '';
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  function htmlBars(items: { label: string; value: number; color: string; suffix?: string }[]): string {
    const maxVal = Math.max(...items.map(i => i.value), 1);
    return items.map(item => {
      const pct = ((item.value / maxVal) * 100).toFixed(1);
      const display = `${item.value.toLocaleString()}${item.suffix ?? ''}`;
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:#2D5016">${item.label}</span>
          <span style="font-size:12px;font-weight:700;color:${item.color}">${display}</span>
        </div>
        <div style="background:#E8F0DF;border-radius:6px;height:16px;overflow:hidden">
          <div style="background:${item.color};height:100%;width:${pct}%;border-radius:6px"></div>
        </div>
      </div>`;
    }).join('');
  }

  if (selected.statsOverview && stats) {
    const activeRatio = stats.total_users > 0
      ? Math.round((stats.active_users / stats.total_users) * 100) : 0;
    sections += `<div class="section">
      <div class="section-title">📊 Stats Overview</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-val green">${stats.total_users?.toLocaleString()}</div><div class="kpi-label">Total Users</div></div>
        <div class="kpi"><div class="kpi-val amber">${stats.total_scans?.toLocaleString()}</div><div class="kpi-label">Total Scans</div></div>
        <div class="kpi"><div class="kpi-val indigo">${stats.total_posts?.toLocaleString()}</div><div class="kpi-label">Forum Posts</div></div>
        <div class="kpi"><div class="kpi-val red">${stats.scan_distribution?.leaves?.toLocaleString()}</div><div class="kpi-label">Leaf Scans</div></div>
      </div>
      ${images.statsOverview ? `<img src="${images.statsOverview}" class="chart-img" alt="Stats Overview"/>` : ''}
      <div class="interpretation">
        The platform has <strong>${stats.total_users?.toLocaleString()} registered users</strong>,
        of which <strong>${activeRatio}%</strong> are active.
        <strong>${stats.total_scans?.toLocaleString()} total scans</strong> have been performed and
        <strong>+${stats.recent_scans}</strong> scans were logged this week.
      </div>
    </div>`;
  }

  if (selected.userActivity && stats) {
    const days: number[] = stats.activity_by_day ?? [];
    const maxDay = days.length ? Math.max(...days) : 0;
    const peakIdx = days.indexOf(maxDay);
    const peakLabel = (stats.days_labels ?? [])[peakIdx] ?? 'N/A';
    const avg = days.length ? Math.round(days.reduce((a: number, b: number) => a + b, 0) / days.length) : 0;
    sections += `<div class="section">
      <div class="section-title">📈 User Activity — Last 7 Days</div>
      ${images.userActivity ? `<img src="${images.userActivity}" class="chart-img" alt="User Activity"/>` : ''}
      ${htmlBars((stats.days_labels ?? []).map((label: string, i: number) => ({
        label, value: stats.activity_by_day?.[i] ?? 0, color: '#4A7C2F',
      })))}
      <div class="interpretation">
        Peak activity was on <strong>${peakLabel}</strong> with <strong>${maxDay}</strong> interactions.
        The 7-day average is <strong>${avg}</strong> interactions/day.
      </div>
    </div>`;
  }

  if (selected.scanDistribution && stats?.scan_distribution) {
    const sd = stats.scan_distribution;
    const leaves = sd.leaves ?? 0, ripeness = sd.ripeness ?? 0, disease = sd.fruit_disease ?? 0;
    const totalSD = (leaves + ripeness + disease) || 1;
    sections += `<div class="section">
      <div class="section-title">🔍 Scan Distribution</div>
      ${htmlBars([
        { label: `Leaf Health (${Math.round(leaves/totalSD*100)}%)`, value: leaves, color: '#4A7C2F' },
        { label: `Ripeness (${Math.round(ripeness/totalSD*100)}%)`, value: ripeness, color: '#f59e0b' },
        { label: `Disease Detection (${Math.round(disease/totalSD*100)}%)`, value: disease, color: '#ef4444' },
      ])}
      ${images.scanDistribution ? `<img src="${images.scanDistribution}" class="chart-img" alt="Scan Distribution"/>` : ''}
    </div>`;
  }

  if (selected.diseaseDetection && stats?.disease_distribution?.length) {
    const dd = (stats.disease_distribution as { name: string; count: number }[])
      .filter(d => DISEASE_CLASSES.includes(d.name));
    const totalDis = dd.reduce((s, i) => s + i.count, 0) || 1;
    const topDisease = [...dd].sort((a, b) => b.count - a.count)[0];
    const topPct = Math.round((topDisease.count / totalDis) * 100);
    sections += `<div class="section">
      <div class="section-title">🦠 Disease Detection</div>
      ${htmlBars(dd.map(item => ({ label: `${item.name} (${Math.round(item.count/totalDis*100)}%)`, value: item.count, color: DISEASE_COLOR_MAP[item.name] ?? '#C5D9B0' })))}
      ${images.diseaseDetection ? `<img src="${images.diseaseDetection}" class="chart-img" alt="Disease Detection"/>` : ''}
      <div class="interpretation">
        <strong>${topDisease.name}</strong> is the most detected class at <strong>${topPct}%</strong> (${topDisease.count} cases).
      </div>
    </div>`;
  }

  if (selected.leafHealth && stats?.leaf_distribution) {
    const ld = stats.leaf_distribution as Record<string, number>;
    const entries = Object.entries(ld);
    const LCOLS = ['#4A7C2F','#f59e0b','#ef4444','#6366f1'];
    const totalLeaf = entries.reduce((s, [, v]) => s + v, 0) || 1;
    const topLeaf = [...entries].sort((a, b) => b[1] - a[1])[0];
    sections += `<div class="section">
      <div class="section-title">🌿 Leaf Health Distribution</div>
      ${htmlBars(entries.map(([label, val], i) => ({
        label: `${label} (${Math.round((val / totalLeaf) * 100)}%)`,
        value: val,
        color: LCOLS[i % LCOLS.length],
      })))}
      ${images.leafHealth ? `<img src="${images.leafHealth}" class="chart-img" alt="Leaf Health"/>` : ''}
      <div class="interpretation">
        Most prevalent condition: <strong>${topLeaf?.[0]}</strong> at <strong>${topLeaf ? Math.round((topLeaf[1] / totalLeaf) * 100) : 0}%</strong> (${topLeaf?.[1] ?? 0} detection${(topLeaf?.[1] ?? 0) !== 1 ? 's' : ''}).
      </div>
    </div>`;
  }

  if (selected.ripenessDistribution && stats?.ripeness_distribution?.length) {
    const rd = stats.ripeness_distribution as { name: string; count: number }[];
    const totalRipeness = rd.reduce((s, i) => s + i.count, 0) || 1;
    const topRipeness = [...rd].sort((a, b) => b.count - a.count)[0];
    const RCOLS: Record<string, string> = { Underripe: '#7ab648', Ripe: '#f59e0b', Overripe: '#ef4444' };
    sections += `<div class="section">
      <div class="section-title">🥑 Ripeness Distribution</div>
      ${htmlBars(rd.map(item => ({ label: `${item.name} (${Math.round(item.count / totalRipeness * 100)}%)`, value: item.count, color: RCOLS[item.name] ?? '#C5D9B0' })))}
      ${images.ripenessDistribution ? `<img src="${images.ripenessDistribution}" class="chart-img" alt="Ripeness Distribution"/>` : ''}
      <div class="interpretation">
        <strong>${topRipeness.name}</strong> is the most frequent ripeness stage at <strong>${Math.round(topRipeness.count / totalRipeness * 100)}%</strong> (${topRipeness.count} scan${topRipeness.count !== 1 ? 's' : ''}).
      </div>
    </div>`;
  }

  if (selected.colorDistribution && stats?.color_distribution?.length) {
    const cd = stats.color_distribution as { name: string; count: number }[];
    const totalColor = cd.reduce((s, i) => s + i.count, 0) || 1;
    const topColor = [...cd].sort((a, b) => b.count - a.count)[0];
    const CCOLS: Record<string, string> = { Black: '#333', Green: '#4CAF50', 'Purple Brown': '#7b3f8a' };
    sections += `<div class="section">
      <div class="section-title">🎨 Colour Distribution</div>
      ${htmlBars(cd.map(item => ({ label: `${item.name} (${Math.round(item.count/totalColor*100)}%)`, value: item.count, color: CCOLS[item.name] ?? '#C5D9B0' })))}
      ${images.colorDistribution ? `<img src="${images.colorDistribution}" class="chart-img" alt="Colour Distribution"/>` : ''}
      <div class="interpretation">
        <strong>${topColor.name}</strong> is the most detected colour at <strong>${Math.round(topColor.count/totalColor*100)}%</strong>.
      </div>
    </div>`;
  }

  if (selected.marketSales && stats?.market_sales) {
    const ms = stats.market_sales;
    const os = ms.order_status || {};
    const totalOrders = ms.total_orders ?? 0;
    const deliveredPct = totalOrders > 0 ? Math.round(((os.Delivered ?? 0) / totalOrders) * 100) : 0;
    const cancelledPct = totalOrders > 0 ? Math.round(((os.Cancelled ?? 0) / totalOrders) * 100) : 0;
    sections += `<div class="section">
      <div class="section-title">💰 Market Sales</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi-val green">₱${ms.total_revenue?.toLocaleString() ?? 0}</div><div class="kpi-label">Revenue</div></div>
        <div class="kpi"><div class="kpi-val blue">${totalOrders}</div><div class="kpi-label">Orders</div></div>
        <div class="kpi"><div class="kpi-val amber">${os.Processing ?? 0}</div><div class="kpi-label">Processing</div></div>
        <div class="kpi"><div class="kpi-val teal">${os.Shipped ?? 0}</div><div class="kpi-label">Shipped</div></div>
        <div class="kpi"><div class="kpi-val indigo">${os.Delivered ?? 0}</div><div class="kpi-label">Delivered</div></div>
        <div class="kpi"><div class="kpi-val red">${os.Cancelled ?? 0}</div><div class="kpi-label">Cancelled</div></div>
      </div>
      ${htmlBars([
        { label: 'Processing', value: os.Processing ?? 0, color: '#f59e0b' },
        { label: 'Shipped',    value: os.Shipped    ?? 0, color: '#14b8a6' },
        { label: 'Delivered',  value: os.Delivered  ?? 0, color: '#4A7C2F' },
        { label: 'Cancelled',  value: os.Cancelled  ?? 0, color: '#ef4444' },
      ])}
      ${images.marketSales ? `<img src="${images.marketSales}" class="chart-img" alt="Market Sales"/>` : ''}
      <div class="interpretation">
        Revenue: <strong>₱${ms.total_revenue?.toLocaleString() ?? 0}</strong> from <strong>${totalOrders} orders</strong>.
        Delivered: <strong>${deliveredPct}%</strong> | Cancelled: <strong>${cancelledPct}%</strong>.
      </div>
    </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;background:#F5FAF0;color:#2D5016;margin:0;padding:0}
    .header{background:#2D5016;width:100%;padding:28px 32px;margin-bottom:28px;border-bottom:4px solid #5A9A3A;box-sizing:border-box}
.body-content{padding:0 28px 28px 28px}
    .header-inner{display:flex;align-items:center;gap:18px}
    .header-logo-wrap{width:68px;height:68px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:12px;padding:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
    .header-logo{width:56px;height:56px;object-fit:contain}
    .header-divider{width:1px;height:50px;background:rgba(255,255,255,0.25);flex-shrink:0}
    .header-text{flex:1}
    .header-eyebrow{font-size:9px;font-weight:700;color:#8DB87A;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:5px}
    .header h1{font-size:24px;font-weight:800;color:#ffffff}
    .header-sub{font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px}
    .header-date{font-size:11px;color:#8DB87A;margin-top:6px;font-weight:600}
    .section{background:#fff;border:1px solid #C5D9B0;border-radius:14px;padding:22px;margin-bottom:22px;page-break-inside:avoid;break-inside:avoid}
    .section-title{font-size:15px;font-weight:800;color:#2D5016;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #E8F0DF}
    .kpi-grid{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}
    .kpi{flex:1;min-width:100px;background:#F5FAF0;border:1px solid #C5D9B0;border-radius:10px;padding:13px;text-align:center}
    .kpi-val{font-size:22px;font-weight:800;margin-bottom:4px}
    .kpi-label{font-size:11px;color:#6A8A50;font-weight:600}
    .green{color:#4A7C2F}.blue{color:#3b82f6}.indigo{color:#6366f1}.red{color:#ef4444}.amber{color:#f59e0b}.teal{color:#14b8a6}
    .interpretation{background:#F5FAF0;border-left:4px solid #4A7C2F;border-radius:0 8px 8px 0;padding:12px 14px;font-size:13px;color:#2D5016;line-height:1.65;margin-top:16px}
    .chart-img{display:block;width:100%;max-width:100%;height:auto;border-radius:10px;margin:14px 0;border:1px solid #E8F0DF}
    table{width:100%;border-collapse:collapse;margin-top:14px}
    thead tr{background:#2D5016}
    thead th{color:#8DB87A;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:10px 12px;text-align:left}
    tbody td{padding:9px 12px;font-size:13px;border-bottom:1px solid #E8F0DF}
    .footer{text-align:right;font-size:11px;color:#6A8A50;margin-top:24px;padding-top:14px;border-top:1px solid #C5D9B0}
  </style></head><body>
  <div class="header">
    <div class="header-inner">
      <div class="header-logo-wrap">
        ${logoDataUrl
          ? `<img src="${logoDataUrl}" class="header-logo" alt="AvoCare logo"/>`
          : `<span style="font-size:40px;line-height:1;display:block;text-align:center">🥑</span>`}
      </div>
      <div class="header-divider"></div>
      <div class="header-text">
        <div class="header-eyebrow">AvoCare Admin System</div>
        <h1>Dashboard Report</h1>
        <div class="header-sub">Comprehensive analytics &amp; insights</div>
        <div class="header-date">Generated on ${today}</div>
      </div>
    </div>
  </div>
  <div class="body-content">
  ${sections}
  <div class="footer">&copy; 2026 AvoCare &ndash; Fresh. Natural. Delivered.</div>
  </div>
  </div>
  </body></html>`;
}

// ─── MeasuredChartCard ────────────────────────────────────────────────────────
interface MeasuredChartCardProps {
  chartKey: string;
  title: string;
  subtitle: string;
  children: (measuredWidth: number) => React.ReactNode;
  extraContent?: React.ReactNode;
  downloadBtn: React.ReactNode;
  chartMetaMap: Record<string, { ref: React.RefObject<any>; domId: string }>;
  isWeb: boolean;
}

const MeasuredChartCard: React.FC<MeasuredChartCardProps> = ({
  chartKey, title, subtitle, children, extraContent, downloadBtn, chartMetaMap, isWeb,
}) => {
  const [innerWidth, setInnerWidth] = useState(0);
  const meta = chartMetaMap[chartKey];

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width - 32;
    if (w > 0) setInnerWidth(w);
  }, []);

  const cardContent = (
    <View style={styles.chartCard} onLayout={onLayout}>
      <View style={styles.chartCardHeader}>
        <View>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSubtitle}>{subtitle}</Text>
        </View>
        {downloadBtn}
      </View>
      {extraContent}
      {innerWidth > 0
        ? children(innerWidth)
        : <View style={styles.chartPlaceholder}><ActivityIndicator size="small" color="#C5D9B0" /></View>
      }
    </View>
  );

  if (isWeb) return <View nativeID={meta.domId} style={{ flex: 1 }}>{cardContent}</View>;
  if (!ViewShot) return cardContent;
  return (
    <ViewShot ref={meta.ref} options={{ format: 'png', quality: 0.92 }} style={{ flex: 1 }}>
      {cardContent}
    </ViewShot>
  );
};

// ─── DashboardScreen ──────────────────────────────────────────────────────────
const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const isWeb = Platform.OS === 'web';

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('pdf');
  const [selectedCharts, setSelectedCharts] = useState<Record<string, boolean>>(
    Object.fromEntries(CHART_OPTIONS.map(o => [o.key, true]))
  );
  const [exporting, setExporting] = useState(false);
  const [downloadingChart, setDownloadingChart] = useState<string | null>(null);

  const statsOverviewRef        = useRef<any>(null);
  const userActivityRef         = useRef<any>(null);
  const scanDistributionRef     = useRef<any>(null);
  const diseaseDetectionRef     = useRef<any>(null);
  const leafHealthRef           = useRef<any>(null);
  const ripenessDistributionRef = useRef<any>(null);
  const colorDistributionRef    = useRef<any>(null);
  const marketSalesRef          = useRef<any>(null);

  const chartMetaMap: Record<string, { ref: React.RefObject<any>; domId: string }> = {
    statsOverview:        { ref: statsOverviewRef,        domId: 'chart-statsOverview' },
    userActivity:         { ref: userActivityRef,         domId: 'chart-userActivity' },
    scanDistribution:     { ref: scanDistributionRef,     domId: 'chart-scanDistribution' },
    diseaseDetection:     { ref: diseaseDetectionRef,     domId: 'chart-diseaseDetection' },
    leafHealth:           { ref: leafHealthRef,           domId: 'chart-leafHealth' },
    ripenessDistribution: { ref: ripenessDistributionRef, domId: 'chart-ripenessDistribution' },
    colorDistribution:    { ref: colorDistributionRef,    domId: 'chart-colorDistribution' },
    marketSales:          { ref: marketSalesRef,          domId: 'chart-marketSales' },
  };

  useEffect(() => { fetchDashboardStats(); }, []);

  const showAlert = (title: string, message: string) => {
    if (isWeb) window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (!token) { showAlert('Error', 'Authentication required'); return; }
      const response = await fetch(`${API_BASE_URL}/api/users/dashboard/stats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (data.success) setDashboardStats(data.stats);
      else showAlert('Error', data.message || 'Failed to fetch stats');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  // ─── Chart data ───────────────────────────────────────────────────────────
  const statsCards: StatCard[] = dashboardStats ? [
    { title: 'Total Users',  value: dashboardStats.total_users.toLocaleString(),                icon: 'people',      change: `${dashboardStats.active_users} active`,   trend: 'up', color: '#4A7C2F' },
    { title: 'Total Scans',  value: dashboardStats.total_scans.toLocaleString(),                icon: 'scan',        change: `+${dashboardStats.recent_scans} this week`, trend: 'up', color: '#f59e0b' },
    { title: 'Forum Posts',  value: dashboardStats.total_posts.toLocaleString(),                icon: 'chatbubbles', change: 'All time',                                  trend: 'up', color: '#6366f1' },
    { title: 'Leaf Scans',   value: dashboardStats.scan_distribution.leaves.toLocaleString(),  icon: 'leaf',        change: 'Total',                                     trend: 'up', color: '#ef4444' },
  ] : [];

  const userActivityData = dashboardStats
    ? { labels: dashboardStats.days_labels, datasets: [{ data: dashboardStats.activity_by_day.length > 0 ? dashboardStats.activity_by_day : [0], color: (o = 1) => `rgba(45,80,22,${o})`, strokeWidth: 3 }] }
    : { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ data: [0], color: (o = 1) => `rgba(45,80,22,${o})`, strokeWidth: 3 }] };

  const scanDistributionData = dashboardStats
    ? {
        labels: ['Leaves', 'Ripeness', 'Disease'],
        datasets: [{ data: [dashboardStats.scan_distribution.leaves || 1, dashboardStats.scan_distribution.ripeness || 1, dashboardStats.scan_distribution.fruit_disease || 1], colors: [(o=1) => `rgba(74,124,47,${o})`, (o=1) => `rgba(245,158,11,${o})`, (o=1) => `rgba(239,68,68,${o})`] }],
      }
    : { labels: ['Leaves','Ripeness','Disease'], datasets: [{ data: [1,1,1], colors: [(o=1) => `rgba(74,124,47,${o})`, (o=1) => `rgba(245,158,11,${o})`, (o=1) => `rgba(239,68,68,${o})`] }] };

  // ── Disease: filter to only 4 classes, use horizontal bar ──────────────────
  const diseaseItems: HBarItem[] = dashboardStats?.disease_distribution?.length > 0
    ? DISEASE_CLASSES.map(cls => {
        const found = dashboardStats.disease_distribution.find((d: any) => d.name === cls);
        return { label: cls, value: found?.count ?? 0, color: DISEASE_COLOR_MAP[cls], maxValue: 0 };
      }).map(item => ({ ...item, maxValue: Math.max(...DISEASE_CLASSES.map(cls => {
          const f = dashboardStats.disease_distribution.find((d: any) => d.name === cls);
          return f?.count ?? 0;
        }), 1) }))
    : DISEASE_CLASSES.map(cls => ({ label: cls, value: 0, color: DISEASE_COLOR_MAP[cls], maxValue: 1 }));

  // ── Leaf health: horizontal bar (raw counts from backend) ─────────────────
  const leafEntries: [string, number][] = dashboardStats?.leaf_distribution
    ? Object.entries(dashboardStats.leaf_distribution as Record<string, number>)
    : [];
  const leafMaxVal = leafEntries.length > 0 ? Math.max(...leafEntries.map(([, v]) => v), 1) : 1;
  const LCOLS = ['#4A7C2F','#f59e0b','#ef4444','#6366f1'];
  const leafItems: HBarItem[] = leafEntries.map(([label, val], i) => ({
    label,
    value: val,
    color: LCOLS[i % LCOLS.length],
    maxValue: leafMaxVal,
  }));

  // ── Ripeness distribution: horizontal bar ──────────────────────────────────
  const ripenessItems: HBarItem[] = dashboardStats?.ripeness_distribution?.length > 0
    ? RIPENESS_CLASSES.map(cls => {
        const found = (dashboardStats.ripeness_distribution as { name: string; count: number }[])
          .find((d) => d.name === cls);
        return { label: cls, value: found?.count ?? 0, color: RIPENESS_COLOR_MAP[cls], maxValue: 0 };
      }).map((item) => ({
        ...item,
        maxValue: Math.max(
          ...RIPENESS_CLASSES.map(cls => {
            const f = (dashboardStats.ripeness_distribution as { name: string; count: number }[])
              .find((d) => d.name === cls);
            return f?.count ?? 0;
          }),
          1,
        ),
      }))
    : RIPENESS_CLASSES.map(cls => ({ label: cls, value: 0, color: RIPENESS_COLOR_MAP[cls], maxValue: 1 }));

  const marketSalesData = dashboardStats?.market_sales
    ? { labels: dashboardStats.market_sales.labels, datasets: [{ data: dashboardStats.market_sales.data.length > 0 ? dashboardStats.market_sales.data : [0], color: (o=1) => `rgba(74,124,47,${o})`, strokeWidth: 3 }] }
    : { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets: [{ data: [0], color: (o=1) => `rgba(74,124,47,${o})`, strokeWidth: 3 }] };

  const COLOR_PIE_MAP: Record<string, string> = { Black: '#444', Green: '#4CAF50', 'Purple Brown': '#7b3f8a' };
  const colorDistributionData = dashboardStats?.color_distribution?.length > 0
    ? dashboardStats.color_distribution.map((item: any) => ({
        name: item.name, population: item.count || 1,
        color: COLOR_PIE_MAP[item.name] ?? '#999',
        legendFontColor: '#2D5016', legendFontSize: 12,
      }))
    : [{ name: 'No Data', population: 100, color: '#C5D9B0', legendFontColor: '#2D5016', legendFontSize: 12 }];

  // ─── Export ───────────────────────────────────────────────────────────────
  const allSelected  = CHART_OPTIONS.every(o => selectedCharts[o.key]);
  const noneSelected = CHART_OPTIONS.every(o => !selectedCharts[o.key]);
  const toggleChart  = (key: string) => setSelectedCharts(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAll    = () => setSelectedCharts(Object.fromEntries(CHART_OPTIONS.map(o => [o.key, !allSelected])));

  const captureAllImages = async (): Promise<Record<string, string>> => {
    const images: Record<string, string> = {};
    for (const option of CHART_OPTIONS) {
      if (!selectedCharts[option.key]) continue;
      const meta = chartMetaMap[option.key];
      try {
        if (isWeb) {
          images[option.key] = await webCaptureBase64(meta.domId);
        } else if (meta?.ref?.current) {
          const uri = await captureRef(meta.ref, { format: 'png', quality: 0.92 });
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
          images[option.key] = `data:image/png;base64,${base64}`;
        }
      } catch (e) { console.warn(`Could not capture ${option.key}`, e); }
    }
    return images;
  };

  const handleDownloadChartImage = async (chartKey: string, chartLabel: string) => {
    try {
      setDownloadingChart(chartKey);
      await new Promise(r => setTimeout(r, 200));
      if (isWeb) {
        await webCaptureAndDownload(chartMetaMap[chartKey].domId, `avocare-${chartKey}.png`);
      } else {
        const meta = chartMetaMap[chartKey];
        if (!meta?.ref?.current) { showAlert('Not Ready', 'Scroll to the chart first and try again.'); return; }
        const uri = await captureRef(meta.ref, { format: 'png', quality: 0.95 });
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync('AvoCare', asset, false);
          showAlert('✅ Saved!', `"${chartLabel}" saved to Photos › AvoCare.`);
        } else {
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Save ${chartLabel}` });
        }
      }
    } catch { showAlert('Download Failed', `Could not save "${chartLabel}".`); }
    finally { setDownloadingChart(null); }
  };

  const handleExportPDF = async () => {
    if (noneSelected) { showAlert('Nothing Selected', 'Select at least one section.'); return; }
    try {
      setExporting(true);
      await new Promise(r => setTimeout(r, 300));
      const images = await captureAllImages();
      const logoDataUrl = await getLogoDataUrl();
      const html = buildPDFHtml(selectedCharts, dashboardStats, images, logoDataUrl);
      if (isWeb) {
        const w = window.open('', '_blank');
        if (!w) { showAlert('Error', 'Pop-up blocked.'); return; }
        w.document.write(html); w.document.close(); w.focus();
        setTimeout(() => { w.print(); w.close(); }, 500);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'AvoCare Dashboard Report' });
      }
      setExportModalVisible(false);
    } catch { showAlert('Export Failed', 'Could not export report.'); }
    finally { setExporting(false); }
  };

  const handleExportImages = async () => {
    if (noneSelected) { showAlert('Nothing Selected', 'Select at least one section.'); return; }
    try {
      setExporting(true);
      await new Promise(r => setTimeout(r, 300));
      if (isWeb) {
        for (const option of CHART_OPTIONS.filter(o => selectedCharts[o.key])) {
          await webCaptureAndDownload(chartMetaMap[option.key].domId, `avocare-${option.key}.png`);
          await new Promise(r => setTimeout(r, 300));
        }
        setExportModalVisible(false);
        showAlert('✅ Downloaded!', 'Charts saved to Downloads.');
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        const savedLabels: string[] = [];
        for (const option of CHART_OPTIONS.filter(o => selectedCharts[o.key])) {
          const meta = chartMetaMap[option.key];
          if (meta?.ref?.current) {
            try {
              const uri = await captureRef(meta.ref, { format: 'png', quality: 0.95 });
              if (status === 'granted') {
                const asset = await MediaLibrary.createAssetAsync(uri);
                await MediaLibrary.createAlbumAsync('AvoCare', asset, false);
                savedLabels.push(option.label);
              }
            } catch (e) { console.warn(e); }
          }
        }
        setExportModalVisible(false);
        if (savedLabels.length > 0) showAlert('✅ Saved!', `${savedLabels.length} chart(s) saved to Photos.`);
      }
    } catch { showAlert('Export Failed', 'Could not export images.'); }
    finally { setExporting(false); }
  };

  // ─── Save button ──────────────────────────────────────────────────────────
  const ChartDownloadBtn = ({ chartKey, label }: { chartKey: string; label: string }) => {
    const isLoading  = downloadingChart === chartKey;
    const isDisabled = downloadingChart !== null && !isLoading;
    return (
      <TouchableOpacity
        onPress={() => handleDownloadChartImage(chartKey, label)}
        disabled={isLoading || isDisabled}
        activeOpacity={0.75}
        style={[styles.saveBtn, isDisabled && { opacity: 0.4 }]}
      >
        {isLoading
          ? <ActivityIndicator size="small" color="#4A7C2F" style={{ width: 14, height: 14 }} />
          : <Ionicons name="download-outline" size={14} color="#4A7C2F" />}
        <Text style={styles.saveBtnText}>{isLoading ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    );
  };

  const renderStatCard = (card: StatCard, index: number) => (
    <View key={index} style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${card.color}18` }]}>
          <Ionicons name={card.icon} size={22} color={card.color} />
        </View>
        <View style={[styles.trendBadge, { backgroundColor: card.trend === 'up' ? '#ECFDF5' : '#FEF2F2' }]}>
          <Ionicons name={card.trend === 'up' ? 'trending-up' : 'trending-down'} size={11} color={card.trend === 'up' ? '#10b981' : '#ef4444'} />
          <Text style={[styles.trendText, { color: card.trend === 'up' ? '#10b981' : '#ef4444' }]}>{card.change}</Text>
        </View>
      </View>
      <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
      <Text style={styles.statTitle}>{card.title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#2D5016' }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7C2F" />
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={!isWeb
          ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />
          : undefined}
      >

        {/* ── Header ── */}
        <View style={[styles.header, { backgroundColor: '#2D5016' }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, Admin</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.pdfBtn} onPress={() => setExportModalVisible(true)} activeOpacity={0.8}>
              <Ionicons name="document-text-outline" size={14} color="#fff" />
              <Text style={styles.pdfBtnText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
              {refreshing
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="refresh" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats Cards ── */}
        <View nativeID={chartMetaMap.statsOverview.domId} style={styles.statsSection}>
          <View style={styles.statsRow}>
            {statsCards.slice(0, 2).map((card, i) => renderStatCard(card, i))}
          </View>
          <View style={styles.statsRow}>
            {statsCards.slice(2, 4).map((card, i) => renderStatCard(card, i + 2))}
          </View>
          <View style={styles.statsExportRow}>
            <ChartDownloadBtn chartKey="statsOverview" label="Stats Overview" />
          </View>
        </View>

        {/* ── Charts ── */}
        <View style={styles.chartsOuterContainer}>

          {/* Row 1: User Activity | Scan Distribution — full width each */}
          <MeasuredChartCard
            chartKey="userActivity"
            title="User Activity"
            subtitle="Last 7 days"
            downloadBtn={<ChartDownloadBtn chartKey="userActivity" label="User Activity" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
          >
            {(w) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={userActivityData}
                  width={Math.max(w, 300)}
                  height={220}
                  chartConfig={baseChartConfig}
                  bezier
                  style={styles.chart}
                  withInnerLines withOuterLines withVerticalLines={false}
                  withHorizontalLines withDots withShadow={false} fromZero
                />
              </ScrollView>
            )}
          </MeasuredChartCard>

          <MeasuredChartCard
            chartKey="scanDistribution"
            title="Scan Distribution"
            subtitle="By category"
            downloadBtn={<ChartDownloadBtn chartKey="scanDistribution" label="Scan Distribution" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
            extraContent={
              <View style={styles.legendRow}>
                {[{ label: 'Leaves', color: '#4A7C2F' }, { label: 'Ripeness', color: '#f59e0b' }, { label: 'Disease', color: '#ef4444' }].map(item => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            }
          >
            {(w) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={scanDistributionData}
                  width={Math.max(w, 300)}
                  height={220}
                  chartConfig={baseChartConfig}
                  style={styles.chart}
                  showValuesOnTopOfBars withInnerLines={false} fromZero
                  yAxisLabel="" yAxisSuffix="" withCustomBarColorFromData flatColor
                />
              </ScrollView>
            )}
          </MeasuredChartCard>

          {/* Disease Detection — horizontal bar chart */}
          <MeasuredChartCard
            chartKey="diseaseDetection"
            title="Disease Detection"
            subtitle="Anthracnose · Healthy · Scab · Stem End Rot"
            downloadBtn={<ChartDownloadBtn chartKey="diseaseDetection" label="Disease Detection" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
            extraContent={
              <View style={styles.legendRow}>
                {DISEASE_CLASSES.map((cls) => (
                  <View key={cls} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: DISEASE_COLOR_MAP[cls] }]} />
                    <Text style={styles.legendLabel}>{cls}</Text>
                  </View>
                ))}
              </View>
            }
          >
            {(w) => (
              <HorizontalBarChart items={diseaseItems} width={w} />
            )}
          </MeasuredChartCard>

          {/* Leaf Health — horizontal bar chart */}
          <MeasuredChartCard
            chartKey="leafHealth"
            title="Leaf Health"
            subtitle="By condition"
            downloadBtn={<ChartDownloadBtn chartKey="leafHealth" label="Leaf Health" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
            extraContent={
              leafItems.length > 0 ? (
                <View style={styles.legendRow}>
                  {leafItems.map((item, i) => (
                    <View key={item.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              ) : null
            }
          >
            {(w) => leafItems.length > 0
              ? <HorizontalBarChart items={leafItems} width={w} />
              : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ color: '#A0B89A', fontSize: 14 }}>No leaf scan data yet</Text>
                </View>
              )
            }
          </MeasuredChartCard>

          {/* Colour Distribution — full width */}
          <MeasuredChartCard
            chartKey="ripenessDistribution"
            title="Ripeness Distribution"
            subtitle="Underripe · Ripe · Overripe"
            downloadBtn={<ChartDownloadBtn chartKey="ripenessDistribution" label="Ripeness Distribution" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
            extraContent={
              <View style={styles.legendRow}>
                {RIPENESS_CLASSES.map((cls) => (
                  <View key={cls} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: RIPENESS_COLOR_MAP[cls] }]} />
                    <Text style={styles.legendLabel}>{cls}</Text>
                  </View>
                ))}
              </View>
            }
          >
            {(w) => ripenessItems.some(i => i.value > 0)
              ? <HorizontalBarChart items={ripenessItems} width={w} />
              : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Text style={{ color: '#A0B89A', fontSize: 14 }}>No ripeness scan data yet</Text>
                </View>
              )
            }
          </MeasuredChartCard>

          {/* Colour Distribution — full width */}
          <MeasuredChartCard
            chartKey="colorDistribution"
            title="Colour Distribution"
            subtitle="Avocado skin colour breakdown"
            downloadBtn={<ChartDownloadBtn chartKey="colorDistribution" label="Colour Distribution" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
            extraContent={
              <View style={styles.legendRow}>
                {[{ label: 'Black', color: '#444' }, { label: 'Green', color: '#4CAF50' }, { label: 'Purple Brown', color: '#7b3f8a' }].map(item => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            }
          >
            {(w) => (
              <PieChart
                data={colorDistributionData}
                width={w}
                height={220}
                chartConfig={baseChartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
                absolute
              />
            )}
          </MeasuredChartCard>

          {/* Market Sales — full width */}
          <MeasuredChartCard
            chartKey="marketSales"
            title="Market Sales"
            subtitle="Last 7 days revenue"
            downloadBtn={<ChartDownloadBtn chartKey="marketSales" label="Market Sales" />}
            chartMetaMap={chartMetaMap}
            isWeb={isWeb}
            extraContent={
              dashboardStats?.market_sales ? (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Revenue</Text>
                    <Text style={[styles.marketStatValue, { color: '#4A7C2F' }]}>
                      ₱{dashboardStats.market_sales.total_revenue?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Orders</Text>
                    <Text style={[styles.marketStatValue, { color: '#4A7C2F' }]}>
                      {dashboardStats.market_sales.total_orders}
                    </Text>
                  </View>
                </View>
              ) : null
            }
          >
            {(w) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={marketSalesData}
                  width={Math.max(w, 300)}
                  height={220}
                  chartConfig={baseChartConfig}
                  bezier style={styles.chart}
                  withInnerLines withOuterLines withVerticalLines={false}
                  withHorizontalLines withDots withShadow={false} fromZero yAxisLabel="₱"
                />
              </ScrollView>
            )}
          </MeasuredChartCard>

        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { icon: 'people'      as const, label: 'Manage Users',  screen: 'Users',    color: '#4A7C2F' },
              { icon: 'bar-chart'   as const, label: 'View Analysis', screen: 'Analysis', color: '#6366f1' },
              { icon: 'chatbubbles' as const, label: 'Forum Posts',   screen: 'Forum',    color: '#f59e0b' },
              { icon: 'storefront'  as const, label: 'Market Items',  screen: 'Market',   color: '#ef4444' },
            ].map((action, index) => (
              <TouchableOpacity key={index} style={styles.quickActionButton}
                onPress={() => navigation.navigate(action.screen as any)} activeOpacity={0.8}>
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}18` }]}>
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Export Modal ── */}
      <Modal visible={exportModalVisible} animationType="slide" transparent onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Dashboard</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setExportModalVisible(false)}>
                <Ionicons name="close" size={20} color="#2D5016" />
              </TouchableOpacity>
            </View>

            <View style={styles.modeToggle}>
              {(['pdf', 'image'] as DownloadMode[]).map(mode => (
                <TouchableOpacity key={mode} onPress={() => setDownloadMode(mode)} activeOpacity={0.8}
                  style={[styles.modeBtn, downloadMode === mode && styles.modeBtnActive]}>
                  <Ionicons name={mode === 'pdf' ? 'document-text-outline' : 'image-outline'} size={15}
                    color={downloadMode === mode ? '#fff' : '#6A8A50'} />
                  <Text style={[styles.modeBtnText, downloadMode === mode && styles.modeBtnTextActive]}>
                    {mode === 'pdf' ? 'PDF Report' : 'Images'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSubtitle}>
              {downloadMode === 'pdf'
                ? isWeb ? 'Choose sections — opens browser print dialog:' : 'Choose sections to include in your PDF:'
                : isWeb ? 'Choose charts to download as PNG files:' : 'Choose charts to save to your Photos:'}
            </Text>

            <View style={styles.selectAllRow}>
              <Text style={styles.selectedCount}>
                {CHART_OPTIONS.filter(o => selectedCharts[o.key]).length} of {CHART_OPTIONS.length} selected
              </Text>
              <TouchableOpacity onPress={toggleAll}>
                <Text style={styles.selectAllBtn}>{allSelected ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.checkboxContainer} showsVerticalScrollIndicator={false}>
              {CHART_OPTIONS.map((chart) => {
                const isActive = selectedCharts[chart.key];
                return (
                  <TouchableOpacity key={chart.key}
                    style={[styles.checkboxRow, isActive && styles.checkboxRowActive]}
                    onPress={() => toggleChart(chart.key)} activeOpacity={0.8}>
                    <Ionicons name={isActive ? 'checkbox' : 'square-outline'} size={22}
                      color={isActive ? '#4A7C2F' : '#A0B89A'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkboxLabel}>{chart.label}</Text>
                      <Text style={styles.checkboxDesc}>{chart.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setExportModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, noneSelected && { opacity: 0.5 }]}
                onPress={downloadMode === 'pdf' ? handleExportPDF : handleExportImages}
                disabled={exporting || noneSelected}>
                {exporting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                    <Ionicons name={downloadMode === 'pdf' ? 'download-outline' : 'save-outline'} size={16} color="#fff" />
                    <Text style={styles.confirmButtonText}>
                      {downloadMode === 'pdf' ? (isWeb ? 'Print / Save PDF' : 'Download PDF') : (isWeb ? 'Download Images' : 'Save Images')}
                    </Text>
                  </>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DashboardScreen;