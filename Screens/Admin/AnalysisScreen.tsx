import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';
import { styles } from '../../Styles/AnalysisScreen.styles';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

// ─── Platform-safe imports ────────────────────────────────────────────────────
let MediaLibrary: any = null;
let ViewShot: any     = null;
let captureRef: any   = null;

if (Platform.OS !== 'web') {
  MediaLibrary = require('expo-media-library');
  const vs     = require('react-native-view-shot');
  ViewShot     = vs.default;
  captureRef   = vs.captureRef;
}

declare const html2canvas: any;

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  green:  '#4A7C2F',
  amber:  '#f59e0b',
  red:    '#ef4444',
  indigo: '#6366f1',
  blue:   '#3b82f6',
  teal:   '#14b8a6',
};

// ─── Disease classes ──────────────────────────────────────────────────────────
const DISEASE_CLASSES = ['Anthracnose', 'Healthy', 'Scab', 'Stem End Rot'];
const DISEASE_COLOR_MAP: Record<string, string> = {
  Anthracnose:    '#ef4444',
  Healthy:        '#4A7C2F',
  Scab:           '#f59e0b',
  'Stem End Rot': '#9C27B0',
};

// ─── Ripeness classes ─────────────────────────────────────────────────────────
const RIPENESS_CLASSES = ['Underripe', 'Ripe', 'Overripe'];
const RIPENESS_COLOR_MAP: Record<string, string> = {
  Underripe: '#7ab648',
  Ripe:      '#f59e0b',
  Overripe:  '#ef4444',
};

// ─── Types ────────────────────────────────────────────────────────────────────
type HistoryRow = {
  date: string; type: string; user: string; userImage?: string;
  result: string; confidence?: number; image?: string;
  status: 'Success' | 'Failed' | 'Pending'; typeColor: string;
};
type DownloadMode = 'pdf' | 'image';
type Period = 'week' | 'month' | 'year';

const ROWS_PER_PAGE = 10;

const STATUS_COLORS: Record<HistoryRow['status'], { bg: string; text: string }> = {
  Success: { bg: '#ECFDF5', text: '#10b981' },
  Failed:  { bg: '#FEF2F2', text: '#ef4444' },
  Pending: { bg: '#FFF8E6', text: '#f59e0b' },
};

const CHART_OPTIONS = [
  { key: 'keyInsights',           label: 'Key Insights',           desc: 'Summary metrics & KPIs' },
  { key: 'userGrowth',            label: 'User Growth',            desc: 'Last 6 months trend' },
  { key: 'featureEngagement',     label: 'Feature Engagement',     desc: 'Scans, Posts, Market, Chatbot' },
  { key: 'marketSales',           label: 'Market Sales',           desc: 'Revenue & order stats' },
  { key: 'detailedAnalytics',     label: 'Detailed Analytics',     desc: 'All scan & post counts' },
  { key: 'diseaseDetection',      label: 'Disease Detection',      desc: 'Anthracnose · Healthy · Scab · Stem End Rot' },
  { key: 'leafHealth',            label: 'Leaf Health',            desc: 'Leaf condition breakdown' },
  { key: 'ripenessDistribution',  label: 'Ripeness Distribution',  desc: 'Underripe · Ripe · Overripe breakdown' },
  { key: 'colorDistribution',     label: 'Colour Distribution',    desc: 'Avocado skin colour breakdown' },
  { key: 'activityHistory',       label: 'Activity History',       desc: 'All scan records with images (PDF: first 20)' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTypeColor(type: string): string {
  if (type.includes('Leaf'))     return COLORS.green;
  if (type.includes('Forum'))    return COLORS.indigo;
  if (type.includes('Ripeness')) return COLORS.amber;
  if (type.includes('Disease'))  return COLORS.red;
  if (type.includes('Market'))   return COLORS.teal;
  return COLORS.blue;
}
function getTypeIcon(type: string): string {
  if (type.includes('Ripeness')) return 'nutrition-outline';
  if (type.includes('Leaf'))     return 'leaf-outline';
  if (type.includes('Disease'))  return 'bug-outline';
  if (type.includes('Forum'))    return 'chatbubbles-outline';
  if (type.includes('Market'))   return 'cart-outline';
  return 'scan-outline';
}

// ─── Web utilities ────────────────────────────────────────────────────────────
function ensureHtml2Canvas(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof html2canvas !== 'undefined') { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload  = () => resolve();
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

// ─── Horizontal Bar Chart (RN) ────────────────────────────────────────────────
interface HBarItem { label: string; value: number; color: string; maxValue: number; }

const HorizontalBarChart: React.FC<{ items: HBarItem[]; width: number }> = ({ items, width }) => {
  const barAreaWidth = width - 130;
  return (
    <View style={{ paddingVertical: 8 }}>
      {items.map((item, i) => {
        const pct = item.maxValue > 0 ? item.value / item.maxValue : 0;
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
  images: Record<string, string>,
  analysisData: any,
  historyData: HistoryRow[],
  logoDataUrl = '',
  period: Period = 'week',
): string {
  let sections = '';
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  const periodLabel = period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year';

  function htmlBars(items: { label: string; value: number; color: string }[]): string {
    const maxVal = Math.max(...items.map(i => i.value), 1);
    return items.map(item => {
      const pct = ((item.value / maxVal) * 100).toFixed(1);
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:#2D5016">${item.label}</span>
          <span style="font-size:12px;font-weight:700;color:${item.color}">${item.value.toLocaleString()}</span>
        </div>
        <div style="background:#E8F0DF;border-radius:6px;height:16px;overflow:hidden">
          <div style="background:${item.color};height:100%;width:${pct}%;border-radius:6px"></div>
        </div>
      </div>`;
    }).join('');
  }

  if (selected.keyInsights && analysisData) {
    const d = analysisData.detailed; const ig = analysisData.insights;
    const activeRatio = d.total_users > 0 ? Math.round((d.active_users / d.total_users) * 100) : 0;
    sections += `<div class="section">
      <div class="section-title">&#x1F4CA; Key Insights &mdash; ${periodLabel}</div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-val green">${ig.user_growth > 0 ? '+' : ''}${ig.user_growth}%</div><div class="kpi-label">User Growth</div></div>
        <div class="kpi"><div class="kpi-val blue">${d.total_scans.toLocaleString()}</div><div class="kpi-label">Total Scans</div></div>
        <div class="kpi"><div class="kpi-val indigo">${d.total_users.toLocaleString()}</div><div class="kpi-label">Total Users</div></div>
        <div class="kpi"><div class="kpi-val red">${d.total_posts.toLocaleString()}</div><div class="kpi-label">Forum Posts</div></div>
      </div>
      ${images.keyInsights ? `<img src="${images.keyInsights}" class="chart-img" alt="Key Insights"/>` : ''}
      <div class="interpretation">
        <strong>${d.total_scans.toLocaleString()} total scans</strong> across <strong>${d.total_users.toLocaleString()} users</strong>
        (${activeRatio}% active). User growth: <strong>${ig.user_growth > 0 ? '+' : ''}${ig.user_growth}%</strong>.
      </div>
    </div>`;
  }

  if (selected.userGrowth && analysisData) {
    const g = analysisData.growth; const vals: number[] = g?.data ?? [];
    const lastVal = vals[vals.length-1] ?? 0; const firstVal = vals[0] ?? 0;
    const trend = lastVal > firstVal ? 'upward' : lastVal < firstVal ? 'downward' : 'stable';
    sections += `<div class="section">
      <div class="section-title">&#x1F4C8; User Growth</div>
      ${images.userGrowth ? `<img src="${images.userGrowth}" class="chart-img" alt="User Growth"/>` : ''}
      <div class="interpretation">
        Monthly registrations show a <strong>${trend} trend</strong>, from <strong>${firstVal}</strong> to <strong>${lastVal}</strong>.
      </div>
    </div>`;
  }

  if (selected.featureEngagement && analysisData?.engagement) {
    const e = analysisData.engagement;
    const vals = [e.scans ?? 0, e.posts ?? 0, e.market ?? 0, e.chatbot ?? 0];
    const total = vals.reduce((a: number, b: number) => a + b, 0) || 1;
    const topFeature = (['Scans','Posts','Market','Chatbot'])[vals.indexOf(Math.max(...vals))];
    sections += `<div class="section">
      <div class="section-title">&#x1F50D; Feature Engagement &mdash; ${periodLabel}</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi-val green">${e.scans ?? 0}</div><div class="kpi-label">Scans</div></div>
        <div class="kpi"><div class="kpi-val indigo">${e.posts ?? 0}</div><div class="kpi-label">Posts</div></div>
        <div class="kpi"><div class="kpi-val amber">${e.market ?? 0}</div><div class="kpi-label">Market</div></div>
        <div class="kpi"><div class="kpi-val teal">${e.chatbot ?? 0}</div><div class="kpi-label">Chatbot</div></div>
      </div>
      ${htmlBars([
        { label: 'Scans',   value: e.scans   ?? 0, color: '#4A7C2F' },
        { label: 'Posts',   value: e.posts   ?? 0, color: '#6366f1' },
        { label: 'Market',  value: e.market  ?? 0, color: '#f59e0b' },
        { label: 'Chatbot', value: e.chatbot ?? 0, color: '#14b8a6' },
      ])}
      ${images.featureEngagement ? `<img src="${images.featureEngagement}" class="chart-img" alt="Feature Engagement"/>` : ''}
      <div class="interpretation"><strong>${topFeature}</strong> is the most-used feature (${Math.round((vals[['Scans','Posts','Market','Chatbot'].indexOf(topFeature)]/total)*100)}% of interactions).</div>
    </div>`;
  }

  if (selected.marketSales && analysisData?.market_sales) {
    const ms = analysisData.market_sales; const os = ms.order_status || {};
    const totalOrders = ms.total_orders ?? 0;
    sections += `<div class="section">
      <div class="section-title">&#x1F4B0; Market Sales &mdash; ${periodLabel}</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi-val green">&#x20B1;${ms.total_revenue?.toLocaleString() ?? 0}</div><div class="kpi-label">Revenue</div></div>
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
    </div>`;
  }

  if (selected.detailedAnalytics && analysisData?.detailed) {
    const d = analysisData.detailed;
    sections += `<div class="section">
      <div class="section-title">&#x1F4CB; Detailed Analytics &mdash; ${periodLabel}</div>
      ${htmlBars([
        { label: 'Leaf Health Scans',       value: d.leaf_scans     ?? 0, color: '#4A7C2F' },
        { label: 'Ripeness Scans',          value: d.ripeness_scans ?? 0, color: '#f59e0b' },
        { label: 'Disease Detection Scans', value: d.disease_scans  ?? 0, color: '#ef4444' },
      ])}
      ${images.detailedAnalytics ? `<img src="${images.detailedAnalytics}" class="chart-img" alt="Detailed Analytics"/>` : ''}
    </div>`;
  }

  if (selected.diseaseDetection && analysisData) {
    const raw = (analysisData.disease_distribution_by_period?.[period] ?? analysisData.disease_distribution ?? []) as { name: string; count: number }[];
    const dd = DISEASE_CLASSES.map(cls => {
      const f = raw.find(d => d.name === cls);
      return { name: cls, count: f?.count ?? 0 };
    });
    const totalDis = dd.reduce((s, i) => s + i.count, 0) || 1;
    const topDisease = [...dd].sort((a, b) => b.count - a.count)[0];
    sections += `<div class="section">
      <div class="section-title">&#x1F9A0; Disease Detection &mdash; ${periodLabel}</div>
      ${htmlBars(dd.map(item => ({ label: `${item.name} (${Math.round(item.count/totalDis*100)}%)`, value: item.count, color: DISEASE_COLOR_MAP[item.name] })))}
      ${images.diseaseDetection ? `<img src="${images.diseaseDetection}" class="chart-img" alt="Disease Detection"/>` : ''}
      <div class="interpretation">Most detected: <strong>${topDisease.name}</strong> (${Math.round(topDisease.count/totalDis*100)}%).</div>
    </div>`;
  }

  if (selected.leafHealth && analysisData) {
    const rawLeaf = analysisData.leaf_distribution_by_period?.[period] ?? analysisData.leaf_distribution ?? [];
    const leafEntries: [string, number][] = Array.isArray(rawLeaf)
      ? (rawLeaf as { name: string; count: number }[]).map(item => [item.name, item.count])
      : Object.entries(rawLeaf as Record<string, number>).map(([k, v]) => [k, v] as [string, number]);
    const totalLeaf = leafEntries.reduce((s, [, v]) => s + v, 0) || 1;
    const topLeaf = [...leafEntries].sort((a, b) => b[1] - a[1])[0];
    const LCOLS_PDF = ['#4A7C2F','#f59e0b','#ef4444','#6366f1'];
    sections += `<div class="section">
      <div class="section-title">&#x1F33F; Leaf Health &mdash; ${periodLabel}</div>
      ${htmlBars(leafEntries.map(([label, val], i) => ({ label: `${label} (${Math.round(val / totalLeaf * 100)}%)`, value: val, color: LCOLS_PDF[i % LCOLS_PDF.length] })))}
      ${images.leafHealth ? `<img src="${images.leafHealth}" class="chart-img" alt="Leaf Health"/>` : ''}
      <div class="interpretation">Most prevalent: <strong>${topLeaf?.[0] ?? 'N/A'}</strong> at <strong>${topLeaf ? Math.round(topLeaf[1] / totalLeaf * 100) : 0}%</strong> (${topLeaf?.[1] ?? 0} detection${(topLeaf?.[1] ?? 0) !== 1 ? 's' : ''}).</div>
    </div>`;
  }

  if (selected.ripenessDistribution && analysisData) {
    const rawRip = (analysisData.ripeness_distribution_by_period?.[period] ?? analysisData.ripeness_distribution ?? []) as { name: string; count: number }[];
    const rd = ['Underripe', 'Ripe', 'Overripe'].map(cls => {
      const f = rawRip.find(r => r.name === cls);
      return { name: cls, count: f?.count ?? 0 };
    });
    const totalRip = rd.reduce((s, i) => s + i.count, 0) || 1;
    const topRipeness = [...rd].sort((a, b) => b.count - a.count)[0];
    const RCOLS: Record<string, string> = { Underripe: '#7ab648', Ripe: '#f59e0b', Overripe: '#ef4444' };
    sections += `<div class="section">
      <div class="section-title">&#x1F951; Ripeness Distribution &mdash; ${periodLabel}</div>
      ${htmlBars(rd.map(item => ({ label: `${item.name} (${Math.round(item.count / totalRip * 100)}%)`, value: item.count, color: RCOLS[item.name] ?? '#C5D9B0' })))}
      ${images.ripenessDistribution ? `<img src="${images.ripenessDistribution}" class="chart-img" alt="Ripeness Distribution"/>` : ''}
      <div class="interpretation">Most common: <strong>${topRipeness.name}</strong> at <strong>${Math.round(topRipeness.count / totalRip * 100)}%</strong> (${topRipeness.count} scans).</div>
    </div>`;
  }

  if (selected.colorDistribution && analysisData?.color_distribution?.length) {
    const cd = analysisData.color_distribution as { name: string; count: number }[];
    const totalColor = cd.reduce((s: number, i: { count: number }) => s + i.count, 0) || 1;
    const topColor = [...cd].sort((a,b) => b.count - a.count)[0];
    const CCOLS: Record<string,string> = { Black: '#444', Green: '#4CAF50', 'Purple Brown': '#7b3f8a' };
    sections += `<div class="section">
      <div class="section-title">&#x1F3A8; Colour Distribution</div>
      ${htmlBars(cd.map(item => ({ label: `${item.name} (${Math.round(item.count/totalColor*100)}%)`, value: item.count, color: CCOLS[item.name] ?? '#C5D9B0' })))}
      ${images.colorDistribution ? `<img src="${images.colorDistribution}" class="chart-img" alt="Colour Distribution"/>` : ''}
      <div class="interpretation">Most detected: <strong>${topColor.name}</strong> (${Math.round(topColor.count/totalColor*100)}%).</div>
    </div>`;
  }

  if (selected.activityHistory && historyData.length > 0) {
    const successRate = Math.round((historyData.filter(r => r.status === 'Success').length / historyData.length) * 100);
    const rows = historyData.slice(0, 20).map((row, i) => {
      const sc = STATUS_COLORS[row.status];
      return `<tr style="background:${i%2===0?'#F9FCF6':'#fff'}">
        <td>${row.date}</td>
        <td><span style="background:${row.typeColor}22;color:${row.typeColor};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">${row.type}</span></td>
        <td>${row.user}</td><td>${row.result}</td>
        <td><span style="background:${sc.bg};color:${sc.text};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">${row.status}</span></td>
      </tr>`;
    }).join('');
    sections += `<div class="section">
      <div class="section-title">&#x1F4C4; Activity History</div>
      <div class="interpretation" style="margin-bottom:14px">
        Showing <strong>20</strong> of <strong>${historyData.length}</strong> records. Success rate: <strong>${successRate}%</strong>.
      </div>
      <table><thead><tr><th>Date</th><th>Type</th><th>User</th><th>Result</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }

  // FIX 1: Removed the broken duplicate `body{...}` rule that was embedded inside
  //         the `.header` style block, causing the entire CSS to be malformed.
  // FIX 2: Corrected the mismatched / extra closing </div> tags at the end of the
  //         template (there was one extra </div> closing a non-existent parent).
  // FIX 3: Replaced raw emoji characters in section titles with HTML entity codes
  //         so they render correctly in all PDF renderers / print engines.
  // FIX 4: Moved the `.body-content` wrapper so it wraps only `sections` + footer
  //         and is properly closed, matching the opening tag exactly once.
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background: #F5FAF0;
      color: #2D5016;
      padding: 28px;
    }
    .header {
      background: #2D5016;
      margin: -28px -28px 28px -28px;
      padding: 24px 32px;
      border-bottom: 4px solid #8DB87A;
    }
    .header-inner { display: flex; align-items: center; gap: 18px; }
    .header-logo-wrap {
      width: 68px; height: 68px;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.25);
      border-radius: 12px; padding: 6px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .header-logo { width: 56px; height: 56px; object-fit: contain; }
    .header-divider { width: 1px; height: 50px; background: rgba(255,255,255,0.25); flex-shrink: 0; }
    .header-text { flex: 1; }
    .header-eyebrow {
      font-size: 9px; font-weight: 700; color: #8DB87A;
      letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 5px;
    }
    .header h1 { font-size: 24px; font-weight: 800; color: #ffffff; }
    .header-sub { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 2px; }
    .header-date { font-size: 11px; color: #8DB87A; margin-top: 6px; font-weight: 600; }
    .body-content { padding: 0; }
    .section {
      background: #fff;
      border: 1px solid #C5D9B0;
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 22px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 15px; font-weight: 800; color: #2D5016;
      margin-bottom: 16px; padding-bottom: 10px;
      border-bottom: 2px solid #E8F0DF;
    }
    .kpi-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .kpi {
      flex: 1; min-width: 100px;
      background: #F5FAF0; border: 1px solid #C5D9B0;
      border-radius: 10px; padding: 13px; text-align: center;
    }
    .kpi-val { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
    .kpi-label { font-size: 11px; color: #6A8A50; font-weight: 600; }
    .green  { color: #4A7C2F; }
    .blue   { color: #3b82f6; }
    .indigo { color: #6366f1; }
    .red    { color: #ef4444; }
    .amber  { color: #f59e0b; }
    .teal   { color: #14b8a6; }
    .interpretation {
      background: #F5FAF0;
      border-left: 4px solid #4A7C2F;
      border-radius: 0 8px 8px 0;
      padding: 12px 14px;
      font-size: 13px; color: #2D5016; line-height: 1.65;
      margin-top: 16px;
    }
    .chart-img {
      display: block; width: 100%; max-width: 100%; height: auto;
      border-radius: 10px; margin: 14px 0; border: 1px solid #E8F0DF;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    thead tr { background: #2D5016; }
    thead th {
      color: #8DB87A; font-size: 10px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
      padding: 10px 12px; text-align: left;
    }
    tbody td { padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #E8F0DF; }
    .footer {
      text-align: right; font-size: 11px; color: #6A8A50;
      margin-top: 24px; padding-top: 14px; border-top: 1px solid #C5D9B0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <div class="header-logo-wrap">
        ${logoDataUrl
          ? `<img src="${logoDataUrl}" class="header-logo" alt="AvoCare logo"/>`
          : `<span style="font-size:40px;line-height:1;display:block;text-align:center">&#x1F951;</span>`}
      </div>
      <div class="header-divider"></div>
      <div class="header-text">
        <div class="header-eyebrow">AvoCare Admin System</div>
        <h1>Analysis Report</h1>
        <div class="header-sub">Period: ${periodLabel} &middot; Comprehensive analytics &amp; insights</div>
        <div class="header-date">Generated on ${today}</div>
      </div>
    </div>
  </div>
  <div class="body-content">
    ${sections}
    <div class="footer">&copy; 2026 AvoCare &ndash; Fresh. Natural. Delivered.</div>
  </div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const AnalysisScreen = () => {
  const isWeb = Platform.OS === 'web';

  const [refreshing, setRefreshing]     = useState(false);
  const [loading, setLoading]           = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');
  const [dimensions, setDimensions]     = useState(Dimensions.get('window'));
  const [historyPage, setHistoryPage]   = useState(0);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('pdf');
  const [selectedCharts, setSelectedCharts] = useState<Record<string, boolean>>(
    Object.fromEntries(CHART_OPTIONS.map(o => [o.key, true]))
  );
  const [exporting, setExporting]       = useState(false);
  const [downloadingChart, setDownloadingChart] = useState<string | null>(null);
  const [chartWidth, setChartWidth]     = useState(300);

  const keyInsightsRef            = useRef<any>(null);
  const userGrowthRef             = useRef<any>(null);
  const featureEngagementRef      = useRef<any>(null);
  const marketSalesRef            = useRef<any>(null);
  const detailedAnalyticsRef      = useRef<any>(null);
  const diseaseDetectionRef       = useRef<any>(null);
  const leafHealthRef             = useRef<any>(null);
  const ripenessDistributionRef   = useRef<any>(null);
  const colorDistributionRef      = useRef<any>(null);

  const chartMeta: Record<string, { ref: React.RefObject<any>; domId: string }> = {
    keyInsights:          { ref: keyInsightsRef,          domId: 'chart-keyInsights' },
    userGrowth:           { ref: userGrowthRef,           domId: 'chart-userGrowth' },
    featureEngagement:    { ref: featureEngagementRef,    domId: 'chart-featureEngagement' },
    marketSales:          { ref: marketSalesRef,          domId: 'chart-marketSales' },
    detailedAnalytics:    { ref: detailedAnalyticsRef,    domId: 'chart-detailedAnalytics' },
    diseaseDetection:     { ref: diseaseDetectionRef,     domId: 'chart-diseaseDetection' },
    leafHealth:           { ref: leafHealthRef,           domId: 'chart-leafHealth' },
    ripenessDistribution: { ref: ripenessDistributionRef, domId: 'chart-ripenessDistribution' },
    colorDistribution:    { ref: colorDistributionRef,    domId: 'chart-colorDistribution' },
  };

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => { fetchAnalysisData(); }, []);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (!token) { showAlert('Error', 'Authentication required'); return; }
      const response = await fetch(`${API_BASE_URL}/api/users/analysis/stats`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await response.json();
      if (data.success) setAnalysisData(data.stats);
      else showAlert('Error', data.message || 'Failed to fetch analysis data');
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Failed to fetch analysis statistics');
    } finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await fetchAnalysisData(); setRefreshing(false); };

  const showAlert = (title: string, message: string) => {
    if (isWeb) window.alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  // ─── Chart config ─────────────────────────────────────────────────────────
  const baseChartConfig = {
    backgroundColor: '#ffffff', backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(45,80,22,${opacity})`,
    labelColor: (opacity = 1) => `rgba(45,80,22,${opacity})`,
    style: { borderRadius: 12 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#2D5016' },
    propsForBackgroundLines: { strokeDasharray: '', stroke: '#E8F0DF', strokeWidth: 1 },
  };

  // ─── Derived data ─────────────────────────────────────────────────────────
  const growthData = analysisData ? {
    labels: analysisData.growth.labels,
    datasets: [{ data: analysisData.growth.data, color: (o=1) => `rgba(45,80,22,${o})`, strokeWidth: 3 }],
  } : { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [0], color: (o=1)=>`rgba(45,80,22,${o})`, strokeWidth: 3 }] };

  const engagementData = analysisData ? {
    labels: ['Scans','Posts','Market','Chatbot'],
    datasets: [{
      data: [analysisData.engagement.scans||1, analysisData.engagement.posts||1, analysisData.engagement.market||1, analysisData.engagement.chatbot||1],
      colors: [(o=1)=>`rgba(74,124,47,${o})`, (o=1)=>`rgba(99,102,241,${o})`, (o=1)=>`rgba(245,158,11,${o})`, (o=1)=>`rgba(20,184,166,${o})`],
    }],
  } : { labels: ['Scans','Posts','Market','Chatbot'], datasets: [{ data: [1,1,1,1], colors: [] }] };

  const marketSalesData = analysisData?.market_sales ? {
    labels: analysisData.market_sales.labels,
    datasets: [{ data: analysisData.market_sales.data.length > 0 ? analysisData.market_sales.data : [0], color: (o=1)=>`rgba(74,124,47,${o})`, strokeWidth: 3 }],
  } : { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [0], color: (o=1)=>`rgba(74,124,47,${o})`, strokeWidth: 3 }] };

  const periodDetail = analysisData?.detailed_by_period?.[selectedPeriod] ?? analysisData?.detailed;

  const insights = analysisData ? [
    { icon: 'trending-up' as const, title: 'User Growth', value: `${analysisData.insights.user_growth > 0 ? '+' : ''}${analysisData.insights.user_growth}%`, description: 'From last month', color: COLORS.green },
    { icon: 'scan'        as const, title: 'Total Scans', value: (periodDetail?.total_scans ?? 0).toLocaleString(), description: 'All scan types', color: COLORS.blue },
    { icon: 'people'      as const, title: 'Total Users', value: analysisData.detailed.total_users.toLocaleString(), description: `${analysisData.detailed.active_users} active`, color: COLORS.indigo },
    { icon: 'chatbubbles' as const, title: 'Forum Posts', value: (periodDetail?.total_posts ?? 0).toLocaleString(), description: 'Community engagement', color: COLORS.red },
  ] : [];

  const analyticsItems = analysisData ? [
    { label: 'Total Scans',        value: (periodDetail?.total_scans ?? 0).toLocaleString(),    icon: 'scan'          as const, color: COLORS.green  },
    { label: 'Forum Posts',        value: (periodDetail?.total_posts ?? 0).toLocaleString(),    icon: 'chatbubbles'   as const, color: COLORS.indigo },
    { label: 'Ripeness Scans',     value: (periodDetail?.ripeness_scans ?? 0).toLocaleString(), icon: 'nutrition'     as const, color: COLORS.amber  },
    { label: 'Leaf Health Scans',  value: (periodDetail?.leaf_scans ?? 0).toLocaleString(),     icon: 'leaf'          as const, color: COLORS.teal   },
    { label: 'Disease Detections', value: (periodDetail?.disease_scans ?? 0).toLocaleString(),  icon: 'alert-circle'  as const, color: COLORS.red    },
    { label: 'Colour Scans',       value: (periodDetail?.color_scans ?? 0).toLocaleString(),    icon: 'color-palette' as const, color: '#9C27B0'     },
    { label: 'Total Users',        value: analysisData.detailed.total_users.toLocaleString(),   icon: 'people'        as const, color: COLORS.blue   },
  ] : [];

  // ─── Period-filtered disease data ─────────────────────────────────────────
  const getRawDisease = () => {
    if (!analysisData) return [];
    return (analysisData.disease_distribution_by_period?.[selectedPeriod] ?? analysisData.disease_distribution ?? []) as { name: string; count: number }[];
  };
  const diseaseItems: HBarItem[] = (() => {
    const raw = getRawDisease();
    const maxVal = Math.max(...DISEASE_CLASSES.map(cls => (raw.find(d => d.name === cls)?.count ?? 0)), 1);
    return DISEASE_CLASSES.map(cls => {
      const found = raw.find(d => d.name === cls);
      return { label: cls, value: found?.count ?? 0, color: DISEASE_COLOR_MAP[cls], maxValue: maxVal };
    });
  })();

  // ─── Period-filtered leaf data ────────────────────────────────────────────
  const getLeafEntries = (): [string, number][] => {
    if (!analysisData) return [];
    const raw = analysisData.leaf_distribution_by_period?.[selectedPeriod] ?? analysisData.leaf_distribution ?? [];
    if (Array.isArray(raw)) {
      return (raw as { name: string; count: number }[]).map(item => [item.name, item.count]);
    }
    return Object.entries(raw as Record<string, number>).map(([k, v]) => [k, v] as [string, number]);
  };
  const LCOLS = ['#4A7C2F','#f59e0b','#ef4444','#6366f1'];
  const leafItems: HBarItem[] = (() => {
    const entries = getLeafEntries();
    const maxVal = entries.length > 0 ? Math.max(...entries.map(([, v]) => v), 1) : 1;
    return entries.map(([label, val], i) => ({
      label, value: val, color: LCOLS[i % LCOLS.length], maxValue: maxVal,
    }));
  })();

  // ─── Period-filtered ripeness data ────────────────────────────────────────
  const ripenessItems: HBarItem[] = (() => {
    if (!analysisData) return RIPENESS_CLASSES.map(cls => ({ label: cls, value: 0, color: RIPENESS_COLOR_MAP[cls], maxValue: 1 }));
    const raw = (analysisData.ripeness_distribution_by_period?.[selectedPeriod] ?? analysisData.ripeness_distribution ?? []) as { name: string; count: number }[];
    const maxVal = Math.max(...RIPENESS_CLASSES.map(cls => (raw.find(r => r.name === cls)?.count ?? 0)), 1);
    return RIPENESS_CLASSES.map(cls => {
      const found = raw.find(r => r.name === cls);
      return { label: cls, value: found?.count ?? 0, color: RIPENESS_COLOR_MAP[cls], maxValue: maxVal };
    });
  })();

  const historyData: HistoryRow[] = analysisData?.history
    ? analysisData.history.map((item: any) => ({
        date: item.date, type: item.type, user: item.user, userImage: item.user_image,
        result: item.result, confidence: item.confidence, image: item.image_url,
        status: item.status as HistoryRow['status'], typeColor: getTypeColor(item.type),
      }))
    : [];

  const totalPages = Math.ceil(historyData.length / ROWS_PER_PAGE);
  const pagedRows  = historyData.slice(historyPage * ROWS_PER_PAGE, (historyPage + 1) * ROWS_PER_PAGE);

  // ─── Color distribution (period-aware) ─────────────────────────────────────
  const colorPeriodRaw = (analysisData?.color_distribution_by_period?.[selectedPeriod] ?? analysisData?.color_distribution ?? []) as { name: string; count: number }[];
  const colorTotalCount = colorPeriodRaw.reduce((s, i) => s + (i.count ?? 0), 0);
  const colorDistData = colorTotalCount > 0
    ? colorPeriodRaw.map((item) => ({
        name: item.name, population: item.count || 1,
        color: ({ Black: '#444', Green: '#4CAF50', 'Purple Brown': '#7b3f8a' } as Record<string,string>)[item.name] ?? '#999',
        legendFontColor: '#2D5016', legendFontSize: 12,
      }))
    : [{ name: 'No Data', population: 100, color: '#C5D9B0', legendFontColor: '#2D5016', legendFontSize: 12 }];

  // ─── Export ───────────────────────────────────────────────────────────────
  const allSelected  = CHART_OPTIONS.every(o => selectedCharts[o.key]);
  const noneSelected = CHART_OPTIONS.every(o => !selectedCharts[o.key]);
  const toggleChart  = (key: string) => setSelectedCharts(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAll    = () => setSelectedCharts(Object.fromEntries(CHART_OPTIONS.map(o => [o.key, !allSelected])));

  // FIX 5: Added a longer settle delay (600 ms) before capturing chart images so
  //         that all chart components have fully painted before html2canvas / captureRef
  //         takes its screenshot. The previous 300 ms was too short on slower devices.
  const captureAllImages = async (): Promise<Record<string, string>> => {
    const images: Record<string, string> = {};
    // Give charts time to fully render before capturing
    await new Promise(r => setTimeout(r, 600));
    for (const option of CHART_OPTIONS) {
      if (option.key === 'activityHistory' || !selectedCharts[option.key]) continue;
      const meta = chartMeta[option.key];
      if (!meta) continue;
      try {
        if (isWeb) {
          images[option.key] = await webCaptureBase64(meta.domId);
        } else if (meta?.ref?.current) {
          const uri = await captureRef(meta.ref, { format: 'png', quality: 0.92 });
          const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
          images[option.key] = `data:image/png;base64,${base64}`;
        }
      } catch (e) {
        console.warn(`Failed to capture chart "${option.key}":`, e);
      }
    }
    return images;
  };

  const handleDownloadChartImage = async (chartKey: string, chartLabel: string) => {
    try {
      setDownloadingChart(chartKey);
      await new Promise(r => setTimeout(r, 200));
      if (isWeb) {
        const meta = chartMeta[chartKey];
        if (!meta) { showAlert('Error', 'Chart not available'); return; }
        await webCaptureAndDownload(meta.domId, `avocare-${chartKey}.png`);
      } else {
        const meta = chartMeta[chartKey];
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

  // FIX 6: On web, close the export modal BEFORE opening the print window so the
  //         modal overlay doesn't get captured in the print preview / PDF output.
  //         Previously the modal was closed only after a successful export, meaning
  //         the overlay was still visible when window.print() was called.
  const handleExportPDF = async () => {
    if (noneSelected) { showAlert('Nothing Selected', 'Select at least one section.'); return; }
    try {
      setExporting(true);
      // Close modal first so its overlay doesn't bleed into web print
      if (isWeb) setExportModalVisible(false);
      await new Promise(r => setTimeout(r, 300));
      const images = await captureAllImages();
      const logoDataUrl = await getLogoDataUrl();
      const html = buildPDFHtml(selectedCharts, images, analysisData, historyData, logoDataUrl, selectedPeriod);
      if (isWeb) {
        const w = window.open('', '_blank');
        if (!w) {
          showAlert('Error', 'Pop-up blocked. Please allow pop-ups for this site.');
          return;
        }
        w.document.write(html);
        w.document.close();
        w.focus();
        // FIX 7: Wait for images to load in the new window before triggering print.
        //        Previously print() was called after a flat 500 ms which wasn't enough
        //        when chart images (base64 data-URLs) were large or numerous.
        w.onload = () => {
          setTimeout(() => { w.print(); }, 300);
        };
        // Fallback in case onload already fired
        setTimeout(() => {
          try { w.print(); } catch (_) {}
        }, 1200);
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'AvoCare Analysis Report' });
        setExportModalVisible(false);
      }
    } catch (err) {
      console.error('PDF export error:', err);
      showAlert('Export Failed', 'Could not export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportImages = async () => {
    const keysToExport = CHART_OPTIONS.filter(o => selectedCharts[o.key] && o.key !== 'activityHistory');
    if (keysToExport.length === 0) { showAlert('No Charts Selected', 'Activity History is PDF only.'); return; }
    try {
      setExporting(true);
      await new Promise(r => setTimeout(r, 300));
      if (isWeb) {
        for (const option of keysToExport) {
          await webCaptureAndDownload(chartMeta[option.key].domId, `avocare-${option.key}.png`);
          await new Promise(r => setTimeout(r, 300));
        }
        setExportModalVisible(false);
        showAlert('✅ Downloaded!', `${keysToExport.length} chart(s) downloaded.`);
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        const savedLabels: string[] = [];
        for (const option of keysToExport) {
          const meta = chartMeta[option.key];
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

  // ─── Chart wrapper ────────────────────────────────────────────────────────
  const ChartWrapper = ({ chartKey, children, nativeRef }: { chartKey: string; children: React.ReactNode; nativeRef: React.RefObject<any> }) => {
    const domId = chartMeta[chartKey]?.domId;
    if (isWeb) return <View nativeID={domId}>{children}</View>;
    if (!ViewShot) return <View>{children}</View>;
    return <ViewShot ref={nativeRef} options={{ format: 'png', quality: 0.92 }}>{children}</ViewShot>;
  };

  const ChartDownloadBtn = ({ chartKey, label }: { chartKey: string; label: string }) => {
    const isLoading  = downloadingChart === chartKey;
    const isDisabled = downloadingChart !== null && !isLoading;
    return (
      <TouchableOpacity
        onPress={() => handleDownloadChartImage(chartKey, label)}
        disabled={isLoading || isDisabled}
        activeOpacity={0.75}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F0F7EA', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#C5D9B0', opacity: isDisabled ? 0.4 : 1 }}
      >
        {isLoading
          ? <ActivityIndicator size="small" color="#4A7C2F" style={{ width: 14, height: 14 }} />
          : <Ionicons name="download-outline" size={14} color="#4A7C2F" />}
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#4A7C2F' }}>{isLoading ? 'Saving…' : 'Save'}</Text>
      </TouchableOpacity>
    );
  };

  const periodLabel = selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#2D5016' }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
            <Text style={styles.headerTitle}>Analysis</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A7C2F" />
          <Text style={styles.loadingText}>Loading analysis…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: '#2D5016' }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEyebrow}>AvoCare Admin</Text>
          <Text style={styles.headerTitle}>Analysis</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.pdfBtn} onPress={() => setExportModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={14} color="#fff" />
            <Text style={styles.pdfBtnText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
            {refreshing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="refresh" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={e => setChartWidth(e.nativeEvent.layout.width - 64)}
        refreshControl={!isWeb
          ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />
          : undefined}
      >

        {/* ── Period Selector ── */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as Period[]).map((period) => (
            <TouchableOpacity key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)} activeOpacity={0.8}>
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Key Insights ── */}
        <ChartWrapper chartKey="keyInsights" nativeRef={keyInsightsRef}>
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={styles.sectionTitle}>Key Insights</Text>
                <Text style={{ fontSize: 11, color: '#6A8A50', marginTop: 2 }}>{periodLabel}</Text>
              </View>
              <ChartDownloadBtn chartKey="keyInsights" label="Key Insights" />
            </View>
            <View style={styles.insightsGrid}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <View style={[styles.insightIcon, { backgroundColor: `${insight.color}18` }]}>
                    <Ionicons name={insight.icon} size={22} color={insight.color} />
                  </View>
                  <Text style={[styles.insightValue, { color: insight.color }]}>{insight.value}</Text>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              ))}
            </View>
          </View>
        </ChartWrapper>

        {/* ── User Growth ── */}
        <ChartWrapper chartKey="userGrowth" nativeRef={userGrowthRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>User Growth</Text>
                <Text style={styles.chartSubtitle}>Last 6 months</Text>
              </View>
              <ChartDownloadBtn chartKey="userGrowth" label="User Growth" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart data={growthData} width={Math.max(chartWidth, 300)} height={220} chartConfig={baseChartConfig}
                bezier style={styles.chart} withInnerLines withOuterLines withVerticalLines={false}
                withHorizontalLines withDots withShadow={false} fromZero />
            </ScrollView>
          </View>
        </ChartWrapper>

        {/* ── Feature Engagement ── */}
        <ChartWrapper chartKey="featureEngagement" nativeRef={featureEngagementRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>Feature Engagement</Text>
                <Text style={styles.chartSubtitle}>{periodLabel} · Total interactions</Text>
              </View>
              <ChartDownloadBtn chartKey="featureEngagement" label="Feature Engagement" />
            </View>
            <View style={styles.legendRow}>
              {[{ label: 'Scans', color: COLORS.green }, { label: 'Posts', color: COLORS.indigo }, { label: 'Market', color: COLORS.amber }, { label: 'Chatbot', color: COLORS.teal }].map(item => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart data={engagementData} width={Math.max(chartWidth, 300)} height={220} chartConfig={baseChartConfig}
                style={styles.chart} showValuesOnTopOfBars withInnerLines={false} fromZero
                yAxisLabel="" yAxisSuffix="" withCustomBarColorFromData flatColor />
            </ScrollView>
          </View>
        </ChartWrapper>

        {/* ── Market Sales ── */}
        <ChartWrapper chartKey="marketSales" nativeRef={marketSalesRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>Market Sales</Text>
                <Text style={styles.chartSubtitle}>{periodLabel} · Revenue trend</Text>
              </View>
              <ChartDownloadBtn chartKey="marketSales" label="Market Sales" />
            </View>
            {analysisData?.market_sales && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                  <Text style={[styles.statValue, { color: COLORS.green }]}>₱{analysisData.market_sales.total_revenue?.toLocaleString()}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Orders</Text>
                  <Text style={[styles.statValue, { color: COLORS.green }]}>{analysisData.market_sales.total_orders}</Text>
                </View>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart data={marketSalesData} width={Math.max(chartWidth, 300)} height={220} chartConfig={baseChartConfig}
                bezier style={styles.chart} withInnerLines withOuterLines withVerticalLines={false}
                withHorizontalLines withDots withShadow={false} fromZero yAxisLabel="₱" />
            </ScrollView>
          </View>
        </ChartWrapper>

        {/* ── Detailed Analytics ── */}
        <ChartWrapper chartKey="detailedAnalytics" nativeRef={detailedAnalyticsRef}>
          <View style={styles.analyticsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={styles.sectionTitle}>Detailed Analytics</Text>
                <Text style={{ fontSize: 11, color: '#6A8A50', marginTop: 2 }}>{periodLabel}</Text>
              </View>
              <ChartDownloadBtn chartKey="detailedAnalytics" label="Detailed Analytics" />
            </View>
            {analyticsItems.map((item, index) => (
              <View key={index} style={[styles.analyticsItem, index === analyticsItems.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.analyticsIcon, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.analyticsContent}>
                  <Text style={styles.analyticsLabel}>{item.label}</Text>
                  <Text style={[styles.analyticsValue, { color: item.color }]}>{item.value}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#C5D9B0" />
              </View>
            ))}
          </View>
        </ChartWrapper>

        {/* ── Disease Detection ── */}
        <ChartWrapper chartKey="diseaseDetection" nativeRef={diseaseDetectionRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>Disease Detection</Text>
                <Text style={styles.chartSubtitle}>{periodLabel} · Fruit condition breakdown</Text>
              </View>
              <ChartDownloadBtn chartKey="diseaseDetection" label="Disease Detection" />
            </View>
            <View style={styles.legendRow}>
              {DISEASE_CLASSES.map(cls => (
                <View key={cls} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: DISEASE_COLOR_MAP[cls] }]} />
                  <Text style={styles.legendLabel}>{cls}</Text>
                </View>
              ))}
            </View>
            {chartWidth > 0
              ? <HorizontalBarChart items={diseaseItems} width={chartWidth} />
              : <ActivityIndicator color="#C5D9B0" style={{ marginVertical: 20 }} />}
          </View>
        </ChartWrapper>

        {/* ── Leaf Health ── */}
        <ChartWrapper chartKey="leafHealth" nativeRef={leafHealthRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>Leaf Health</Text>
                <Text style={styles.chartSubtitle}>{periodLabel} · Leaf condition breakdown</Text>
              </View>
              <ChartDownloadBtn chartKey="leafHealth" label="Leaf Health" />
            </View>
            {leafItems.length > 0 && (
              <View style={styles.legendRow}>
                {leafItems.map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}
            {chartWidth > 0
              ? leafItems.length > 0
                ? <HorizontalBarChart items={leafItems} width={chartWidth} />
                : <View style={{ alignItems: 'center', paddingVertical: 40 }}><Text style={{ color: '#A0B89A', fontSize: 14 }}>No leaf data for {periodLabel}</Text></View>
              : <ActivityIndicator color="#C5D9B0" style={{ marginVertical: 20 }} />}
          </View>
        </ChartWrapper>

        {/* ── Ripeness Distribution ── */}
        <ChartWrapper chartKey="ripenessDistribution" nativeRef={ripenessDistributionRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>Ripeness Distribution</Text>
                <Text style={styles.chartSubtitle}>{periodLabel} · Underripe · Ripe · Overripe</Text>
              </View>
              <ChartDownloadBtn chartKey="ripenessDistribution" label="Ripeness Distribution" />
            </View>
            <View style={styles.legendRow}>
              {RIPENESS_CLASSES.map(cls => (
                <View key={cls} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: RIPENESS_COLOR_MAP[cls] }]} />
                  <Text style={styles.legendLabel}>{cls}</Text>
                </View>
              ))}
            </View>
            {chartWidth > 0
              ? <HorizontalBarChart items={ripenessItems} width={chartWidth} />
              : <ActivityIndicator color="#C5D9B0" style={{ marginVertical: 20 }} />}
          </View>
        </ChartWrapper>

        {/* ── Colour Distribution ── */}
        <ChartWrapper chartKey="colorDistribution" nativeRef={colorDistributionRef}>
          <View style={styles.chartCard}>
            <View style={[styles.chartHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.chartTitle}>Colour Distribution</Text>
                <Text style={styles.chartSubtitle}>Avocado skin colour breakdown</Text>
              </View>
              <ChartDownloadBtn chartKey="colorDistribution" label="Colour Distribution" />
            </View>
            <View style={styles.legendRow}>
              {[{ label: 'Black', color: '#444' }, { label: 'Green', color: '#4CAF50' }, { label: 'Purple Brown', color: '#7b3f8a' }].map(item => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            {colorTotalCount > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <PieChart
                  data={colorDistData}
                  width={Math.max(chartWidth, 300)}
                  height={200}
                  chartConfig={baseChartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  absolute
                />
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: '#A0B89A', fontSize: 14 }}>No colour scan data for {periodLabel}</Text>
              </View>
            )}
          </View>
        </ChartWrapper>

        {/* ── Activity History ── */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.sectionTitle}>Activity History</Text>
            <Text style={styles.tableCount}>{historyData.length} records</Text>
          </View>

          {pagedRows.map((row, i) => (
            <View key={i} style={[styles.historyRow, i % 2 !== 0 && styles.historyRowAlt]}>
              <View style={styles.historyThumbWrap}>
                {row.image ? (
                  <Image source={{ uri: row.image }} style={styles.historyThumb} />
                ) : (
                  <View style={[styles.historyThumbPlaceholder, { backgroundColor: `${row.typeColor}22` }]}>
                    <Ionicons name={getTypeIcon(row.type) as any} size={22} color={row.typeColor} />
                  </View>
                )}
              </View>
              <View style={styles.historyContent}>
                <View style={styles.historyBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: `${row.typeColor}18` }]}>
                    <Text style={[styles.typeBadgeText, { color: row.typeColor }]}>{row.type}</Text>
                  </View>
                  {row.confidence != null && <Text style={styles.historyConfidence}>{row.confidence}%</Text>}
                </View>
                <Text style={styles.historyResult} numberOfLines={1}>{row.result}</Text>
                <Text style={styles.historyMeta}>{row.user} · {row.date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[row.status].bg }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[row.status].text }]}>{row.status}</Text>
              </View>
            </View>
          ))}

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity style={[styles.pageBtn, historyPage === 0 && styles.pageBtnDisabled]}
                onPress={() => setHistoryPage(p => Math.max(0, p - 1))} disabled={historyPage === 0}>
                <Ionicons name="chevron-back" size={16} color={historyPage === 0 ? '#C5D9B0' : '#4A7C2F'} />
              </TouchableOpacity>
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                const page = totalPages <= 7 ? i : historyPage <= 3 ? i : historyPage >= totalPages - 4 ? totalPages - 7 + i : historyPage - 3 + i;
                return (
                  <TouchableOpacity key={page} style={[styles.pageNumberBtn, historyPage === page && styles.pageNumberBtnActive]}
                    onPress={() => setHistoryPage(page)}>
                    <Text style={[styles.pageNumberText, historyPage === page && styles.pageNumberTextActive]}>{page + 1}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={[styles.pageBtn, historyPage === totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => setHistoryPage(p => Math.min(totalPages - 1, p + 1))} disabled={historyPage === totalPages - 1}>
                <Ionicons name="chevron-forward" size={16} color={historyPage === totalPages - 1 ? '#C5D9B0' : '#4A7C2F'} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* ── Export Modal ── */}
      <Modal visible={exportModalVisible} animationType="slide" transparent onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Export Analysis</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setExportModalVisible(false)}>
                <Ionicons name="close" size={20} color="#2D5016" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', backgroundColor: '#F0F7EA', borderRadius: 10, padding: 3, marginBottom: 14 }}>
              {(['pdf', 'image'] as DownloadMode[]).map(mode => (
                <TouchableOpacity key={mode} onPress={() => setDownloadMode(mode)} activeOpacity={0.8}
                  style={{ flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, backgroundColor: downloadMode === mode ? '#2D5016' : 'transparent' }}>
                  <Ionicons name={mode === 'pdf' ? 'document-text-outline' : 'image-outline'} size={15} color={downloadMode === mode ? '#fff' : '#6A8A50'} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: downloadMode === mode ? '#fff' : '#6A8A50' }}>
                    {mode === 'pdf' ? 'PDF Report' : 'Images'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 4 }}>
              <Ionicons name="calendar-outline" size={14} color="#4A7C2F" />
              <Text style={{ fontSize: 12, color: '#4A7C2F', fontWeight: '600' }}>
                Exporting data for: <Text style={{ fontWeight: '800' }}>{periodLabel}</Text>
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>
              {downloadMode === 'pdf'
                ? isWeb ? 'Choose sections — opens browser print dialog:' : 'Choose sections to include in your PDF:'
                : isWeb ? 'Choose charts to download as PNG files:' : 'Choose charts to save to your Photos:'}
            </Text>

            <View style={styles.selectAllRow}>
              <Text style={{ fontSize: 12, color: '#6A8A50' }}>
                {CHART_OPTIONS.filter(o => selectedCharts[o.key]).length} of {CHART_OPTIONS.length} selected
              </Text>
              <TouchableOpacity onPress={toggleAll}>
                <Text style={styles.selectAllBtn}>{allSelected ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.checkboxContainer} showsVerticalScrollIndicator={false}>
              {CHART_OPTIONS.map((chart) => {
                const imageUnsupported = downloadMode === 'image' && chart.key === 'activityHistory';
                const isChecked = selectedCharts[chart.key] && !imageUnsupported;
                return (
                  <TouchableOpacity key={chart.key}
                    style={[styles.checkboxRow, isChecked && styles.checkboxRowActive, imageUnsupported && { opacity: 0.38 }]}
                    onPress={() => !imageUnsupported && toggleChart(chart.key)}
                    activeOpacity={imageUnsupported ? 1 : 0.8}
                    disabled={imageUnsupported}>
                    <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={22} color={isChecked ? '#4A7C2F' : '#A0B89A'} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.checkboxLabel}>{chart.label}</Text>
                      <Text style={styles.checkboxDesc}>{imageUnsupported ? 'PDF only' : chart.desc}</Text>
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

export default AnalysisScreen;