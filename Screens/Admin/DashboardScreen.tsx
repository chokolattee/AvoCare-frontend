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
// Disease class order from model: Anthracnose, Healthy, Scab, Stem End Rot
const DISEASE_COLOR_MAP: Record<string, string> = {
  Anthracnose:    '#ef4444',  // red
  Healthy:        '#4A7C2F',  // green
  Scab:           '#f59e0b',  // amber
  'Stem End Rot': '#9C27B0',  // purple
};
const PIE_COLORS = ['#ef4444', '#4A7C2F', '#f59e0b', '#9C27B0'];
const PROGRESS_COLORS = ['#4A7C2F', '#f59e0b', '#ef4444', '#6366f1'];
const CHART_OPTIONS = [
  { key: 'statsOverview', label: 'Stats Overview', desc: 'Users, scans, posts & leaf stats' },
  { key: 'userActivity', label: 'User Activity', desc: 'Last 7 days activity trend' },
  { key: 'scanDistribution', label: 'Scan Distribution', desc: 'Leaves, ripeness, disease counts' },
  { key: 'diseaseDetection', label: 'Disease Detection', desc: 'Disease type breakdown' },
  { key: 'leafHealth', label: 'Leaf Health', desc: 'Leaf condition distribution' },
  { key: 'colorDistribution', label: 'Colour Distribution', desc: 'Avocado skin colour breakdown' },
  { key: 'marketSales', label: 'Market Sales', desc: 'Revenue & order stats' },
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

const progressChartConfig = {
  ...baseChartConfig,
  color: (opacity = 1, index?: number) => {
    const colors = [
      `rgba(74, 124, 47, ${opacity})`,
      `rgba(245, 158, 11, ${opacity})`,
      `rgba(239, 68, 68, ${opacity})`,
      `rgba(99, 102, 241, ${opacity})`,
    ];
    return colors[(index ?? 0) % colors.length];
  },
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
  } catch {
    return '';
  }
}

// ─── PDF builder ──────────────────────────────────────────────────────────────
function buildPDFHtml(selected: Record<string, boolean>, stats: any, images: Record<string, string> = {}, logoDataUrl = ''): string {
  let sections = '';
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Inline HTML horizontal-bar chart ──────────────────────────────────────
  function htmlBars(items: { label: string; value: number; color: string; suffix?: string }[]): string {
    const maxVal = Math.max(...items.map(i => i.value), 1);
    return items.map(item => {
      const pct     = ((item.value / maxVal) * 100).toFixed(1);
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

  // ── Sections ───────────────────────────────────────────────────────────────

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
      ${images.statsOverview ? `<img src="${images.statsOverview}" class="chart-img" alt="Stats Overview chart"/>` : ''}
      <div class="interpretation">
        The platform has <strong>${stats.total_users?.toLocaleString()} registered users</strong>,
        of which <strong>${activeRatio}%</strong> are active.
        <strong>${stats.total_scans?.toLocaleString()} total scans</strong> have been performed and
        <strong>+${stats.recent_scans}</strong> scans were logged this week alone,
        indicating steady real-world usage of the AI detection features.
      </div>
    </div>`;
  }

  if (selected.userActivity && stats) {
    const days: number[] = stats.activity_by_day ?? [];
    const maxDay = days.length ? Math.max(...days) : 0;
    const peakIdx = days.indexOf(maxDay);
    const peakLabel = (stats.days_labels ?? [])[peakIdx] ?? 'N/A';
    const avg = days.length ? Math.round(days.reduce((a: number, b: number) => a + b, 0) / days.length) : 0;
    const rows = (stats.days_labels || []).map((label: string, i: number) =>
      `<tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}"><td>${label}</td><td style="font-weight:700;color:#2D5016">${stats.activity_by_day?.[i] ?? 0}</td></tr>`
    ).join('');
    sections += `<div class="section">
      <div class="section-title">📈 User Activity — Last 7 Days</div>
      ${images.userActivity ? `<img src="${images.userActivity}" class="chart-img" alt="User Activity chart"/>` : ''}
      ${htmlBars((stats.days_labels ?? []).map((label: string, i: number) => ({
        label, value: stats.activity_by_day?.[i] ?? 0, color: '#4A7C2F',
      })))}
      <table style="margin-top:12px"><thead><tr><th>Day</th><th>Activity</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="interpretation">
        Peak activity this week was on <strong>${peakLabel}</strong> with <strong>${maxDay}</strong> interactions.
        The 7-day average is <strong>${avg}</strong> interactions/day.
        ${maxDay > avg * 1.5
          ? `${peakLabel} saw significantly higher-than-average activity — consider scheduling notifications or promotions on similar days.`
          : 'Activity is relatively consistent across the week.'}
      </div>
    </div>`;
  }

  if (selected.scanDistribution && stats?.scan_distribution) {
    const sd = stats.scan_distribution;
    const leaves    = sd.leaves    ?? 0;
    const ripeness  = sd.ripeness  ?? 0;
    const disease   = sd.fruit_disease ?? 0;
    const totalSD   = (leaves + ripeness + disease) || 1;
    const lPct  = Math.round((leaves   / totalSD) * 100);
    const rPct  = Math.round((ripeness / totalSD) * 100);
    const dPct  = Math.round((disease  / totalSD) * 100);
    const topType =
      leaves >= ripeness && leaves >= disease ? 'Leaf Health'
      : ripeness >= disease ? 'Ripeness' : 'Disease Detection';
    sections += `<div class="section">
      <div class="section-title">🔍 Scan Distribution — Leaves, Ripeness &amp; Disease</div>
      <div class="kpi-grid" style="margin-bottom:16px">
        <div class="kpi"><div class="kpi-val green">${leaves.toLocaleString()}</div><div class="kpi-label">Leaf Scans</div></div>
        <div class="kpi"><div class="kpi-val amber">${ripeness.toLocaleString()}</div><div class="kpi-label">Ripeness Scans</div></div>
        <div class="kpi"><div class="kpi-val red">${disease.toLocaleString()}</div><div class="kpi-label">Disease Scans</div></div>
      </div>
      ${htmlBars([
        { label: `Leaf Health (${lPct}%)`,    value: leaves,   color: '#4A7C2F' },
        { label: `Ripeness (${rPct}%)`,        value: ripeness, color: '#f59e0b' },
        { label: `Disease Detection (${dPct}%)`, value: disease,  color: '#ef4444' },
      ])}
      ${images.scanDistribution ? `<img src="${images.scanDistribution}" class="chart-img" alt="Scan Distribution chart"/>` : ''}
      <div class="interpretation">
        <strong>${topType}</strong> is the dominant scan category at
        <strong>${topType === 'Leaf Health' ? lPct : topType === 'Ripeness' ? rPct : dPct}%</strong>
        of all scans.
        Ripeness checks account for <strong>${rPct}%</strong>, reflecting users' interest in
        confirming fruit maturity before harvest or purchase.
        Disease detection at <strong>${dPct}%</strong>
        ${disease > ripeness
          ? 'is the most frequent scan type, pointing to a high incidence of plant health concerns among users.'
          : 'complements leaf checks, providing a full picture of avocado plant health on the platform.'}
      </div>
    </div>`;
  }

  if (selected.diseaseDetection && stats?.disease_distribution?.length) {
    const dd = stats.disease_distribution as { name: string; population: number; count: number }[];
    const totalDis = dd.reduce((s, i) => s + i.count, 0) || 1;
    const topDisease = [...dd].sort((a, b) => b.count - a.count)[0];
    const topPct = Math.round((topDisease.count / totalDis) * 100);
    const rows = dd.map((item, i) =>
      `<tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
         <td>${item.name}</td>
         <td style="font-weight:700;color:#2D5016">${item.count}</td>
         <td style="color:#6A8A50">${Math.round((item.count / totalDis) * 100)}%</td>
       </tr>`
    ).join('');
    const DCOLS: Record<string, string> = {
      Anthracnose:    '#ef4444',
      Healthy:        '#4A7C2F',
      Scab:           '#f59e0b',
      'Stem End Rot': '#9C27B0',
    };
    sections += `<div class="section">
      <div class="section-title">🦠 Disease Detection Breakdown</div>
      ${htmlBars(dd.map(item => ({ label: item.name, value: item.count, color: DCOLS[item.name] ?? '#C5D9B0' })))}
      ${images.diseaseDetection ? `<img src="${images.diseaseDetection}" class="chart-img" alt="Disease Detection chart"/>` : ''}
      <table><thead><tr><th>Disease Type</th><th>Count</th><th>Share</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="interpretation">
        The model detects 4 fruit conditions: <strong>Anthracnose</strong> (red),
        <strong>Healthy</strong> (green), <strong>Scab</strong> (amber), and
        <strong>Stem End Rot</strong> (purple).
        <strong>${topDisease.name}</strong> is the most frequently detected class
        at <strong>${topPct}%</strong> (${topDisease.count} cases).
        ${topDisease.name === 'Healthy'
          ? `A high Healthy rate indicates users are scanning well-maintained fruits — a positive sign for post-harvest quality.`
          : topPct > 50
            ? `Its dominant share suggests a seasonal outbreak. Consider publishing targeted care or treatment guides for ${topDisease.name}.`
            : `Multiple disease types are active, indicating varied post-harvest stressors. Prioritise guidance for ${topDisease.name} first.`}
      </div>
    </div>`;
  }

  if (selected.colorDistribution && stats?.color_distribution?.length) {
    const cd = stats.color_distribution as { name: string; population: number; count: number }[];
    const totalColor = cd.reduce((s, i) => s + i.count, 0) || 1;
    const topColor = [...cd].sort((a, b) => b.count - a.count)[0];
    const topPct = Math.round((topColor.count / totalColor) * 100);
    const CCOLS: Record<string, string> = { Black: '#0e0e0e', Green: '#4CAF50', 'Purple Brown': '#291d2c' };
    const cRows = cd.map((item, i) =>
      `<tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
         <td>${item.name}</td>
         <td style="font-weight:700;color:#2D5016">${item.count}</td>
         <td style="color:#6A8A50">${Math.round((item.count / totalColor) * 100)}%</td>
       </tr>`
    ).join('');
    sections += `<div class="section">
      <div class="section-title">🎨 Colour Distribution</div>
      ${htmlBars(cd.map(item => ({ label: item.name, value: item.count, color: CCOLS[item.name] ?? '#C5D9B0' })))}
      ${images.colorDistribution ? `<img src="${images.colorDistribution}" class="chart-img" alt="Colour Distribution chart"/>` : ''}
      <table><thead><tr><th>Colour</th><th>Count</th><th>Share</th></tr></thead><tbody>${cRows}</tbody></table>
      <div class="interpretation">
        The skin colour model classifies avocados into 3 categories: <strong>Green</strong> (unripe),
        <strong>Black</strong> (very ripe–overripe), and <strong>Purple Brown</strong> (peak ripeness).
        <strong>${topColor.name}</strong> is the most frequently detected colour
        at <strong>${topPct}%</strong> (${topColor.count} scans).
        ${topColor.name === 'Green'
          ? 'A dominance of green scans suggests users are checking fruits early in the ripening cycle.'
          : topColor.name === 'Purple Brown'
            ? 'Purple-dominant results indicate most scanned fruits are at peak ripeness — ideal for harvest or purchase.'
            : 'Black-dominant results suggest users are tracking fully-ripe or overripe fruit. Consider adding post-harvest storage tips.'}
      </div>
    </div>`;
  }

  if (selected.leafHealth && stats?.leaf_distribution) {
    const ld = stats.leaf_distribution as Record<string, number>;
    const entries = Object.entries(ld);
    const LCOLS = ['#4A7C2F','#f59e0b','#ef4444','#6366f1'];
    const rows = entries.map(([label, val], i) =>
      `<tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
         <td>${label}</td>
         <td style="font-weight:700;color:#2D5016">${(val * 100).toFixed(1)}%</td>
       </tr>`
    ).join('');
    const topLeaf = entries.sort((a, b) => b[1] - a[1])[0];
    const healthyEntry = entries.find(([k]) => k.toLowerCase().includes('health'));
    const healthyPct = healthyEntry ? (healthyEntry[1] * 100).toFixed(1) : null;
    sections += `<div class="section">
      <div class="section-title">🌿 Leaf Health Distribution</div>
      ${htmlBars(entries.map(([label, val], i) => ({
        label: `${label} (${(val * 100).toFixed(1)}%)`,
        value: Math.round(val * 1000),
        color: LCOLS[i % LCOLS.length],
      })))}
      ${images.leafHealth ? `<img src="${images.leafHealth}" class="chart-img" alt="Leaf Health chart"/>` : ''}
      <table><thead><tr><th>Condition</th><th>Percentage</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="interpretation">
        The most prevalent leaf condition is <strong>${topLeaf?.[0]}</strong>
        at <strong>${topLeaf ? (topLeaf[1] * 100).toFixed(1) : 0}%</strong> of scanned leaves.
        ${healthyPct
          ? `Healthy leaves account for <strong>${healthyPct}%</strong> of all leaf scans.`
          : ''}
        ${topLeaf && !topLeaf[0].toLowerCase().includes('health')
          ? `Since a non-healthy condition dominates, users may benefit from targeted disease-management tips within the app.`
          : `The high proportion of healthy scans suggests the user base is proactively monitoring their avocado plants.`}
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
      ${images.marketSales ? `<img src="${images.marketSales}" class="chart-img" alt="Market Sales chart"/>` : ''}
      <div class="interpretation">
        Market revenue totals <strong>₱${ms.total_revenue?.toLocaleString() ?? 0}</strong>
        from <strong>${totalOrders} orders</strong>.
        <strong>${deliveredPct}%</strong> of orders were successfully delivered.
        ${cancelledPct > 15
          ? `The <strong>${cancelledPct}%</strong> cancellation rate exceeds the healthy threshold of 15% — review inventory levels and lead times.`
          : `The cancellation rate is <strong>${cancelledPct}%</strong>, which is within an acceptable range.`}
      </div>
    </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;background:#F5FAF0;color:#2D5016;padding:28px}
    /* ── Header ── */
    .header{background-color:#2D5016;margin:-28px -28px 28px -28px;padding:24px 32px}
    .header-inner{display:flex;align-items:center;gap:18px}
    .header-logo-wrap{width:68px;height:68px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:12px;padding:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
    .header-logo{width:56px;height:56px;object-fit:contain}
    .header-divider{width:1px;height:50px;background:rgba(255,255,255,0.25);flex-shrink:0}
    .header-text{flex:1}
    .header-eyebrow{font-size:9px;font-weight:700;color:#8DB87A;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:5px}
    .header h1{font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.2px;line-height:1.2}
    .header-sub{font-size:11px;color:rgba(255,255,255,0.7);margin-top:2px}
    .header-date{font-size:11px;color:#8DB87A;margin-top:6px;font-weight:600}
    /* ── Sections ── */
    .section{background:#fff;border:1px solid #C5D9B0;border-radius:14px;padding:22px;margin-bottom:22px;page-break-inside:avoid;break-inside:avoid;overflow:hidden}
    .section-title{font-size:15px;font-weight:800;color:#2D5016;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #E8F0DF}
    .kpi-grid{display:flex;flex-wrap:wrap;gap:12px}
    .kpi{flex:1;min-width:100px;background:#F5FAF0;border:1px solid #C5D9B0;border-radius:10px;padding:13px;text-align:center}
    .kpi-val{font-size:22px;font-weight:800;margin-bottom:4px}
    .kpi-label{font-size:11px;color:#6A8A50;font-weight:600}
    .green{color:#4A7C2F}.blue{color:#3b82f6}.indigo{color:#6366f1}.red{color:#ef4444}.amber{color:#f59e0b}.teal{color:#14b8a6}
    .interpretation{background:#F5FAF0;border-left:4px solid #4A7C2F;border-radius:0 8px 8px 0;padding:12px 14px;font-size:13px;color:#2D5016;line-height:1.65;margin-top:16px}
    .chart-img{display:block;width:100%;max-width:100%;height:auto;border-radius:10px;margin:14px 0;border:1px solid #E8F0DF;page-break-inside:avoid;break-inside:avoid}
    table{width:100%;border-collapse:collapse;margin-top:14px;page-break-inside:avoid;break-inside:avoid}
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
  ${sections}
  <div class="footer">&copy; 2026 AvoCare &ndash; Fresh. Natural. Delivered.</div>
  </body></html>`;
}

// ─── MeasuredChartCard ────────────────────────────────────────────────────────
// Uses onLayout to get its real pixel width, then renders the chart at exactly
// that width — so charts always fill 100% of their card with no clipping.
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
    const w = e.nativeEvent.layout.width - 32; // subtract card padding (16 each side)
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

  const statsOverviewRef = useRef<any>(null);
  const userActivityRef = useRef<any>(null);
  const scanDistributionRef = useRef<any>(null);
  const diseaseDetectionRef = useRef<any>(null);
  const leafHealthRef = useRef<any>(null);
  const colorDistributionRef = useRef<any>(null);
  const marketSalesRef = useRef<any>(null);

  const chartMetaMap: Record<string, { ref: React.RefObject<any>; domId: string }> = {
    statsOverview: { ref: statsOverviewRef, domId: 'chart-statsOverview' },
    userActivity: { ref: userActivityRef, domId: 'chart-userActivity' },
    scanDistribution: { ref: scanDistributionRef, domId: 'chart-scanDistribution' },
    diseaseDetection: { ref: diseaseDetectionRef, domId: 'chart-diseaseDetection' },
    leafHealth: { ref: leafHealthRef, domId: 'chart-leafHealth' },
    colorDistribution: { ref: colorDistributionRef, domId: 'chart-colorDistribution' },
    marketSales: { ref: marketSalesRef, domId: 'chart-marketSales' },
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
    { title: 'Total Users', value: dashboardStats.total_users.toLocaleString(), icon: 'people', change: `${dashboardStats.active_users} active`, trend: 'up', color: '#4A7C2F' },
    { title: 'Total Scans', value: dashboardStats.total_scans.toLocaleString(), icon: 'scan', change: `+${dashboardStats.recent_scans} this week`, trend: 'up', color: '#f59e0b' },
    { title: 'Forum Posts', value: dashboardStats.total_posts.toLocaleString(), icon: 'chatbubbles', change: 'All time', trend: 'up', color: '#6366f1' },
    { title: 'Leaf Scans', value: dashboardStats.scan_distribution.leaves.toLocaleString(), icon: 'leaf', change: 'Total', trend: 'up', color: '#ef4444' },
  ] : [];

  const userActivityData = dashboardStats
    ? { labels: dashboardStats.days_labels, datasets: [{ data: dashboardStats.activity_by_day.length > 0 ? dashboardStats.activity_by_day : [0], color: (o = 1) => `rgba(45,80,22,${o})`, strokeWidth: 3 }] }
    : { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [0], color: (o = 1) => `rgba(45,80,22,${o})`, strokeWidth: 3 }] };

  const scanDistributionData = dashboardStats
    ? {
      labels: ['Leaves', 'Ripeness', 'Disease'],
      datasets: [{ data: [dashboardStats.scan_distribution.leaves || 1, dashboardStats.scan_distribution.ripeness || 1, dashboardStats.scan_distribution.fruit_disease || 1], colors: [(o = 1) => `rgba(74,124,47,${o})`, (o = 1) => `rgba(245,158,11,${o})`, (o = 1) => `rgba(239,68,68,${o})`] }],
    }
    : { labels: ['Leaves', 'Ripeness', 'Disease'], datasets: [{ data: [1, 1, 1], colors: [(o = 1) => `rgba(74,124,47,${o})`, (o = 1) => `rgba(245,158,11,${o})`, (o = 1) => `rgba(239,68,68,${o})`] }] };

  const diseaseData = dashboardStats?.disease_distribution?.length > 0
    ? dashboardStats.disease_distribution.map((item: any) => ({
        name: item.name,
        population: item.count || 1,
        color: DISEASE_COLOR_MAP[item.name] ?? '#C5D9B0',
        legendFontColor: '#2D5016',
        legendFontSize: 12,
      }))
    : [{ name: 'No Data', population: 100, color: '#C5D9B0', legendFontColor: '#2D5016', legendFontSize: 12 }];

  const leafHealthData = dashboardStats?.leaf_distribution
    ? { labels: Object.keys(dashboardStats.leaf_distribution), data: Object.values(dashboardStats.leaf_distribution) as number[] }
    : { labels: ['No Data'], data: [0] as number[] };

  const marketSalesData = dashboardStats?.market_sales
    ? { labels: dashboardStats.market_sales.labels, datasets: [{ data: dashboardStats.market_sales.data.length > 0 ? dashboardStats.market_sales.data : [0], color: (o = 1) => `rgba(74,124,47,${o})`, strokeWidth: 3 }] }
    : { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [0], color: (o = 1) => `rgba(74,124,47,${o})`, strokeWidth: 3 }] };

  const COLOR_PIE_MAP: Record<string, string> = { Black: '#0e0e0e', Green: '#4CAF50', 'Purple Brown': '#291d2c' };
  const colorDistributionData = dashboardStats?.color_distribution?.length > 0
    ? dashboardStats.color_distribution.map((item: any) => ({
        name: item.name,
        population: item.count || 1,
        color: COLOR_PIE_MAP[item.name] ?? '#999',
        legendFontColor: '#2D5016',
        legendFontSize: 12,
      }))
    : [{ name: 'No Data', population: 100, color: '#C5D9B0', legendFontColor: '#2D5016', legendFontSize: 12 }];

  // ─── Export ───────────────────────────────────────────────────────────────
  const allSelected = CHART_OPTIONS.every(o => selectedCharts[o.key]);
  const noneSelected = CHART_OPTIONS.every(o => !selectedCharts[o.key]);
  const toggleChart = (key: string) => setSelectedCharts(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAll = () => setSelectedCharts(Object.fromEntries(CHART_OPTIONS.map(o => [o.key, !allSelected])));

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
    } catch (error) {
      showAlert('Download Failed', `Could not save "${chartLabel}".`);
    } finally {
      setDownloadingChart(null);
    }
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
            } catch (e) { console.warn(`Could not capture ${option.key}`, e); }
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
    const isLoading = downloadingChart === chartKey;
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

  // ─── Reusable stat card renderer ─────────────────────────────────────────
  const renderStatCard = (card: StatCard, index: number) => (
    <View key={index} style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${card.color}18` }]}>
          <Ionicons name={card.icon} size={22} color={card.color} />
        </View>
        <View style={[styles.trendBadge, { backgroundColor: card.trend === 'up' ? '#ECFDF5' : '#FEF2F2' }]}>
          <Ionicons
            name={card.trend === 'up' ? 'trending-up' : 'trending-down'}
            size={11}
            color={card.trend === 'up' ? '#10b981' : '#ef4444'}
          />
          <Text style={[styles.trendText, { color: card.trend === 'up' ? '#10b981' : '#ef4444' }]}>
            {card.change}
          </Text>
        </View>
      </View>
      <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
      <Text style={styles.statTitle}>{card.title}</Text>
    </View>
  );

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
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

  // ─── Render ───────────────────────────────────────────────────────────────
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
        <View style={styles.header}>
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

        {/* ── Stat Cards: 2×2 grid using flex rows (same as Analysis Key Insights) ── */}
        <View nativeID={chartMetaMap.statsOverview.domId} style={styles.statsSection}>
          {/* Row 1: Total Users | Total Scans */}
          <View style={styles.statsRow}>
            {statsCards.slice(0, 2).map((card, i) => renderStatCard(card, i))}
          </View>
          {/* Row 2: Forum Posts | Leaf Scans */}
          <View style={styles.statsRow}>
            {statsCards.slice(2, 4).map((card, i) => renderStatCard(card, i + 2))}
          </View>
          {/* Save row */}
          <View style={styles.statsExportRow}>
            <ChartDownloadBtn chartKey="statsOverview" label="Stats Overview" />
          </View>
        </View>

        {/* ── Charts ── */}
        <View style={styles.chartsOuterContainer}>

          {/* Row 1: User Activity | Scan Distribution */}
          <View style={styles.chartRow}>
            <View style={styles.chartCell}>
              <MeasuredChartCard
                chartKey="userActivity"
                title="User Activity"
                subtitle="Last 7 days"
                downloadBtn={<ChartDownloadBtn chartKey="userActivity" label="User Activity" />}
                chartMetaMap={chartMetaMap}
                isWeb={isWeb}
              >
                {(w) => (
                  <LineChart data={userActivityData} width={w} height={220} chartConfig={baseChartConfig}
                    bezier style={styles.chart} withInnerLines withOuterLines withVerticalLines={false}
                    withHorizontalLines withDots withShadow={false} fromZero />
                )}
              </MeasuredChartCard>
            </View>

            <View style={styles.chartCell}>
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
                  <BarChart data={scanDistributionData} width={w} height={220} chartConfig={baseChartConfig}
                    style={styles.chart} showValuesOnTopOfBars withInnerLines={false} fromZero
                    yAxisLabel="" yAxisSuffix="" withCustomBarColorFromData flatColor />
                )}
              </MeasuredChartCard>
            </View>
          </View>

          {/* Row 2: Disease Detection | Leaf Health */}
          <View style={styles.chartRow}>
            <View style={styles.chartCell}>
              <MeasuredChartCard
                chartKey="diseaseDetection"
                title="Disease Detection"
                subtitle="Distribution"
                downloadBtn={<ChartDownloadBtn chartKey="diseaseDetection" label="Disease Detection" />}
                chartMetaMap={chartMetaMap}
                isWeb={isWeb}
              >
                {(w) => (
                  <PieChart data={diseaseData} width={w} height={200} chartConfig={baseChartConfig}
                    accessor="population" backgroundColor="transparent" paddingLeft="15"
                    style={styles.chart} absolute />
                )}
              </MeasuredChartCard>
            </View>

            <View style={styles.chartCell}>
              <MeasuredChartCard
                chartKey="leafHealth"
                title="Leaf Health"
                subtitle="By condition"
                downloadBtn={<ChartDownloadBtn chartKey="leafHealth" label="Leaf Health" />}
                chartMetaMap={chartMetaMap}
                isWeb={isWeb}
                extraContent={
                  leafHealthData.labels[0] !== 'No Data' ? (
                    <View style={styles.legendRow}>
                      {leafHealthData.labels.map((label: string, i: number) => (
                        <View key={label} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: PROGRESS_COLORS[i % PROGRESS_COLORS.length] }]} />
                          <Text style={styles.legendLabel}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null
                }
              >
                {(w) => (
                  <ProgressChart data={leafHealthData} width={w} height={200} chartConfig={progressChartConfig}
                    style={styles.chart} strokeWidth={12} radius={32} hideLegend={false} />
                )}
              </MeasuredChartCard>
            </View>
          </View>

          {/* Row 3: Colour Distribution — full width */}
          <View style={styles.chartRowFull}>
            <MeasuredChartCard
              chartKey="colorDistribution"
              title="Colour Distribution"
              subtitle="Avocado skin colour breakdown"
              downloadBtn={<ChartDownloadBtn chartKey="colorDistribution" label="Colour Distribution" />}
              chartMetaMap={chartMetaMap}
              isWeb={isWeb}
              extraContent={
                <View style={styles.legendRow}>
                  {[
                    { label: 'Black', color: '#0e0e0e' },
                    { label: 'Green', color: '#4CAF50' },
                    { label: 'Purple Brown', color: '#291d2c' },
                  ].map(item => (
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
                  height={200}
                  chartConfig={baseChartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={styles.chart}
                  absolute
                />
              )}
            </MeasuredChartCard>
          </View>

          {/* Row 4: Market Sales — full width */}
          <View style={styles.chartRowFull}>
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
                <LineChart data={marketSalesData} width={w} height={220} chartConfig={baseChartConfig}
                  bezier style={styles.chart} withInnerLines withOuterLines withVerticalLines={false}
                  withHorizontalLines withDots withShadow={false} fromZero yAxisLabel="₱" />
              )}
            </MeasuredChartCard>
          </View>

        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { icon: 'people' as const, label: 'Manage Users', screen: 'Users', color: '#4A7C2F' },
              { icon: 'bar-chart' as const, label: 'View Analysis', screen: 'Analysis', color: '#6366f1' },
              { icon: 'chatbubbles' as const, label: 'Forum Posts', screen: 'Forum', color: '#f59e0b' },
              { icon: 'storefront' as const, label: 'Market Items', screen: 'Market', color: '#ef4444' },
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