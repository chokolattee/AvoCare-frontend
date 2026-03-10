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

// ─── Platform-safe imports (not available on web) ─────────────────────────────
// We lazy-import these only on native to avoid web crashes.
let MediaLibrary: any = null;
let ViewShot: any     = null;
let captureRef: any   = null;

if (Platform.OS !== 'web') {
  MediaLibrary = require('expo-media-library');
  const vs     = require('react-native-view-shot');
  ViewShot     = vs.default;
  captureRef   = vs.captureRef;
}

// ─── Web: html2canvas (loaded via CDN script tag when on web) ────────────────
// We declare it as any so TypeScript doesn't complain.
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

// ─── Types ────────────────────────────────────────────────────────────────────
type HistoryRow = {
  date: string;
  type: string;
  user: string;
  userImage?: string;
  result: string;
  confidence?: number;
  image?: string;
  status: 'Success' | 'Failed' | 'Pending';
  typeColor: string;
};

type DownloadMode = 'pdf' | 'image';

const ROWS_PER_PAGE = 10;

const STATUS_COLORS: Record<HistoryRow['status'], { bg: string; text: string }> = {
  Success: { bg: '#ECFDF5', text: '#10b981' },
  Failed:  { bg: '#FEF2F2', text: '#ef4444' },
  Pending: { bg: '#FFF8E6', text: '#f59e0b' },
};

const CHART_OPTIONS = [
  { key: 'keyInsights',       label: 'Key Insights', desc: 'Summary metrics & KPIs' },
  { key: 'userGrowth',        label: 'User Growth',        desc: 'Last 6 months trend' },
  { key: 'featureEngagement', label: 'Feature Engagement', desc: 'Scans, Posts, Market, Chatbot' },
  { key: 'marketSales',       label: 'Market Sales',       desc: 'Revenue & order stats' },
  { key: 'detailedAnalytics',  label: 'Detailed Analytics',  desc: 'All scan & post counts' },
  { key: 'colorDistribution',  label: 'Colour Distribution',  desc: 'Avocado skin colour breakdown' },
  { key: 'activityHistory',    label: 'Activity History',    desc: 'All scan records with images (PDF: first 20)' },
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

// ─── Web utility: ensure html2canvas is loaded ────────────────────────────────
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

// ─── Web utility: capture a DOM element and download as PNG ──────────────────
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

// ─── Web utility: capture element as base64 PNG ───────────────────────────────
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
function buildPDFHtml(
  selected: Record<string, boolean>,
  images: Record<string, string>,
  analysisData: any,
  historyData: HistoryRow[],
  logoDataUrl = '',
): string {
  let sections = '';
  const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── Inline HTML horizontal-bar chart ──────────────────────────────────────
  // Renders pure-CSS bars that work in any PDF engine (no canvas/SVG needed).
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

  // ── Section builders ────────────────────────────────────────────────────────

  if (selected.keyInsights && analysisData) {
    const d  = analysisData.detailed;
    const ig = analysisData.insights;
    const growthDir   = ig.user_growth > 0 ? 'increased' : ig.user_growth < 0 ? 'decreased' : 'remained stable';
    const activeRatio = d.total_users > 0 ? Math.round((d.active_users / d.total_users) * 100) : 0;

    sections += `
      <div class="section">
        <div class="section-title">📊 Key Insights</div>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-val green">${ig.user_growth > 0 ? '+' : ''}${ig.user_growth}%</div><div class="kpi-label">User Growth</div></div>
          <div class="kpi"><div class="kpi-val blue">${d.total_scans.toLocaleString()}</div><div class="kpi-label">Total Scans</div></div>
          <div class="kpi"><div class="kpi-val indigo">${d.total_users.toLocaleString()}</div><div class="kpi-label">Total Users</div></div>
          <div class="kpi"><div class="kpi-val red">${d.total_posts.toLocaleString()}</div><div class="kpi-label">Forum Posts</div></div>
        </div>
        ${images.keyInsights ? `<img src="${images.keyInsights}" class="chart-img" alt="Key Insights chart"/>` : ''}
        <div class="interpretation">
          AvoCare has recorded <strong>${d.total_scans.toLocaleString()} total scans</strong> across
          <strong>${d.total_users.toLocaleString()} registered users</strong>, of which
          <strong>${activeRatio}%</strong> are currently active.
          User count ${growthDir} by <strong>${Math.abs(ig.user_growth)}%</strong> from last month.
          The community has generated <strong>${d.total_posts.toLocaleString()} forum posts</strong>,
          reflecting strong engagement with the platform beyond scanning alone.
        </div>
      </div>`;
  }

  if (selected.userGrowth && analysisData) {
    const g = analysisData.growth;
    const vals: number[] = g?.data ?? [];
    const lastVal   = vals[vals.length - 1] ?? 0;
    const firstVal  = vals[0] ?? 0;
    const trend     = lastVal > firstVal ? 'upward' : lastVal < firstVal ? 'downward' : 'stable';
    const trendText = lastVal > firstVal
      ? `grew from <strong>${firstVal}</strong> to <strong>${lastVal}</strong>`
      : lastVal < firstVal
        ? `declined from <strong>${firstVal}</strong> to <strong>${lastVal}</strong>`
        : 'held steady';

    sections += `
      <div class="section">
        <div class="section-title">📈 User Growth — Last 6 Months</div>
        ${images.userGrowth
          ? `<img src="${images.userGrowth}" class="chart-img" alt="User Growth chart"/>`
          : '<p style="color:#6A8A50;text-align:center;padding:20px">Chart not available</p>'}
        <div class="interpretation">
          Monthly new-user registrations show a <strong>${trend} trend</strong> over the past six months,
          ${trendText}. ${trend === 'upward'
            ? 'Continued marketing and word-of-mouth referrals are driving consistent growth.'
            : trend === 'downward'
              ? 'Consider reviewing onboarding flows and promotion campaigns to re-accelerate growth.'
              : 'User acquisition rates are consistent — diversify channels for further growth.'}
        </div>
      </div>`;
  }

  if (selected.featureEngagement && analysisData?.engagement) {
    const e    = analysisData.engagement;
    const vals = [e.scans ?? 0, e.posts ?? 0, e.market ?? 0, e.chatbot ?? 0];
    const total = vals.reduce((a: number, b: number) => a + b, 0) || 1;
    const scanPct = Math.round((e.scans ?? 0) / total * 100);
    const topFeature = (['Scans', 'Posts', 'Market', 'Chatbot'] as const)[
      vals.indexOf(Math.max(...vals))
    ];
    sections += `
      <div class="section">
        <div class="section-title">🔍 Feature Engagement</div>
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
        ${images.featureEngagement ? `<img src="${images.featureEngagement}" class="chart-img" alt="Feature Engagement chart"/>` : ''}
        <div class="interpretation">
          <strong>${topFeature}</strong> is the most-used feature this period.
          Scanning activities represent <strong>${scanPct}%</strong> of all interactions,
          confirming that AI-powered detection remains the core value proposition of AvoCare.
          ${(e.chatbot ?? 0) > 0 ? `The chatbot handled <strong>${e.chatbot}</strong> interactions, indicating users rely on AI assistance for guidance.` : ''}
        </div>
      </div>`;
  }

  if (selected.marketSales && analysisData?.market_sales) {
    const ms = analysisData.market_sales;
    const os = ms.order_status || {};
    const totalOrders = ms.total_orders ?? 0;
    const deliveredPct = totalOrders > 0 ? Math.round(((os.Delivered ?? 0) / totalOrders) * 100) : 0;
    const cancelledPct = totalOrders > 0 ? Math.round(((os.Cancelled ?? 0) / totalOrders) * 100) : 0;
    sections += `
      <div class="section">
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
          Total market revenue stands at <strong>₱${ms.total_revenue?.toLocaleString() ?? 0}</strong>
          from <strong>${totalOrders} orders</strong>.
          <strong>${deliveredPct}%</strong> of orders have been successfully delivered,
          while <strong>${cancelledPct}%</strong> were cancelled.
          ${cancelledPct > 15
            ? 'The cancellation rate is above 15% — review stock availability and fulfillment times.'
            : 'Order fulfillment performance is within a healthy range.'}
        </div>
      </div>`;
  }

  if (selected.detailedAnalytics && analysisData?.detailed) {
    const d = analysisData.detailed;
    const leafScans    = d.leaf_scans     ?? 0;
    const ripScans     = d.ripeness_scans ?? 0;
    const diseaseScans = d.disease_scans  ?? 0;
    const totalScanTypes = (leafScans + ripScans + diseaseScans) || 1;
    const leafPct    = Math.round((leafScans    / totalScanTypes) * 100);
    const ripPct     = Math.round((ripScans     / totalScanTypes) * 100);
    const diseasePct = Math.round((diseaseScans / totalScanTypes) * 100);
    const topScanType =
      leafScans >= ripScans && leafScans >= diseaseScans ? 'Leaf Health'
      : ripScans >= diseaseScans ? 'Ripeness'
      : 'Disease Detection';

    const items = [
      ['Total Scans Performed', d.total_scans?.toLocaleString()],
      ['Forum Posts Created',   d.total_posts?.toLocaleString()],
      ['Ripeness Scans',        d.ripeness_scans?.toLocaleString()],
      ['Leaf Health Scans',     d.leaf_scans?.toLocaleString()],
      ['Disease Detections',    d.disease_scans?.toLocaleString()],
      ['Total Users',           d.total_users?.toLocaleString()],
    ];
    const rows = items.map(([label, val], i) =>
      `<tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
         <td>${label}</td><td style="font-weight:700;color:#2D5016">${val ?? '—'}</td>
       </tr>`
    ).join('');

    sections += `
      <div class="section">
        <div class="section-title">📋 Detailed Analytics</div>

        <div class="sub-title">Scanning Activity Breakdown</div>
        ${htmlBars([
          { label: `Leaf Health Scans (${leafPct}%)`,    value: leafScans,    color: '#4A7C2F' },
          { label: `Ripeness Scans (${ripPct}%)`,        value: ripScans,     color: '#f59e0b' },
          { label: `Disease Detection Scans (${diseasePct}%)`, value: diseaseScans, color: '#ef4444' },
        ])}
        <div class="interpretation">
          <strong>${topScanType}</strong> scanning is the most frequently used detection feature,
          accounting for <strong>${topScanType === 'Leaf Health' ? leafPct : topScanType === 'Ripeness' ? ripPct : diseasePct}%</strong>
          of all categorised scans.
          Ripeness checks comprise <strong>${ripPct}%</strong> of scans — suggesting users most commonly
          want to confirm fruit readiness before purchase or harvest.
          Disease detection scans at <strong>${diseasePct}%</strong>
          ${diseaseScans > leafScans
            ? 'indicate a growing concern about plant health among users.'
            : 'remain a complementary feature to leaf health checks.'}
        </div>

        <div class="sub-title" style="margin-top:18px">All Metrics</div>
        ${images.detailedAnalytics ? `<img src="${images.detailedAnalytics}" class="chart-img" alt="Detailed Analytics chart"/>` : ''}
        <table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }

  if (selected.colorDistribution && analysisData?.color_distribution?.length) {
    const cd = analysisData.color_distribution as { name: string; count: number }[];
    const totalColor = cd.reduce((s: number, i: { count: number }) => s + i.count, 0) || 1;
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
    sections += `
      <div class="section">
        <div class="section-title">🎨 Colour Distribution</div>
        ${htmlBars(cd.map(item => ({ label: item.name, value: item.count, color: CCOLS[item.name] ?? '#C5D9B0' })))}
        ${images.colorDistribution ? `<img src="${images.colorDistribution}" class="chart-img" alt="Colour Distribution chart"/>` : ''}
        <table><thead><tr><th>Colour</th><th>Count</th><th>Share</th></tr></thead><tbody>${cRows}</tbody></table>
        <div class="interpretation">
          The skin colour model classifies avocados into 3 categories: <strong>Green</strong> (unripe),
          <strong>Black</strong> (ripe–overripe), and <strong>Purple Brown</strong> (peak ripeness).
          <strong>${topColor.name}</strong> is the most frequently detected colour
          at <strong>${topPct}%</strong> (${topColor.count} scans).
          ${topColor.name === 'Green'
            ? 'A dominance of green scans suggests users are checking fruits early in the ripening cycle.'
            : topColor.name === 'Purple Brown'
              ? 'Purple Brown-dominant results indicate most scanned fruits are at peak ripeness — ideal for harvest or purchase.'
              : 'Black-dominant results suggest users are tracking fully-ripe or overripe fruit. Consider adding post-harvest storage tips.'}
        </div>
      </div>`;
  }

  if (selected.activityHistory && historyData.length > 0) {
    const successCount = historyData.filter(r => r.status === 'Success').length;
    const successRate  = Math.round((successCount / historyData.length) * 100);
    const typeCounts: Record<string, number> = {};
    historyData.forEach(r => { typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1; });
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    const rows = historyData.slice(0, 20).map((row, i) => {
      const sc = STATUS_COLORS[row.status];
      return `<tr style="background:${i % 2 === 0 ? '#F9FCF6' : '#fff'}">
        <td>${row.date}</td>
        <td><span style="background:${row.typeColor}22;color:${row.typeColor};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">${row.type}</span></td>
        <td>${row.user}</td>
        <td>${row.result}</td>
        <td><span style="background:${sc.bg};color:${sc.text};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700">${row.status}</span></td>
      </tr>`;
    }).join('');
    sections += `
      <div class="section">
        <div class="section-title">📄 Activity History</div>
        <div class="interpretation" style="margin-bottom:14px">
          Showing the most recent <strong>20</strong> of <strong>${historyData.length}</strong> total scan records.
          Overall success rate is <strong>${successRate}%</strong>.
          The most frequent activity type is <strong>${topType}</strong>.
        </div>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>User</th><th>Result</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:11px;color:#6A8A50;margin-top:8px">Showing first 20 of ${historyData.length} records</p>
      </div>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
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
    .sub-title{font-size:12px;font-weight:700;color:#4A7C2F;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px}
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
  </style>
</head>
<body>
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
        <h1>Analysis Report</h1>
        <div class="header-sub">Comprehensive analytics &amp; insights</div>
        <div class="header-date">Generated on ${today}</div>
      </div>
    </div>
  </div>
  ${sections}
  <div class="footer">&copy; 2026 AvoCare &ndash; Fresh. Natural. Delivered.</div>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const AnalysisScreen = () => {
  const isWeb = Platform.OS === 'web';

  const [refreshing, setRefreshing]         = useState(false);
  const [loading, setLoading]               = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [dimensions, setDimensions]         = useState(Dimensions.get('window'));
  const [historyPage, setHistoryPage]       = useState(0);
  const [analysisData, setAnalysisData]     = useState<any>(null);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [downloadMode, setDownloadMode]     = useState<DownloadMode>('pdf');
  const [selectedCharts, setSelectedCharts] = useState<Record<string, boolean>>(
    Object.fromEntries(CHART_OPTIONS.map(o => [o.key, true]))
  );
  const [exporting, setExporting]           = useState(false);
  const [downloadingChart, setDownloadingChart] = useState<string | null>(null);

  // ─── Native ViewShot refs (unused on web) ─────────────────────────────────
  const keyInsightsRef       = useRef<any>(null);
  const userGrowthRef        = useRef<any>(null);
  const featureEngagementRef = useRef<any>(null);
  const marketSalesRef       = useRef<any>(null);
  const detailedAnalyticsRef = useRef<any>(null);
  const colorDistributionRef = useRef<any>(null);

  // Map chart key → { nativeRef, webDomId }
  const chartMeta: Record<string, { ref: React.RefObject<any>; domId: string }> = {
    keyInsights:       { ref: keyInsightsRef,       domId: 'chart-keyInsights' },
    userGrowth:        { ref: userGrowthRef,        domId: 'chart-userGrowth' },
    featureEngagement: { ref: featureEngagementRef, domId: 'chart-featureEngagement' },
    marketSales:       { ref: marketSalesRef,       domId: 'chart-marketSales' },
    detailedAnalytics: { ref: detailedAnalyticsRef, domId: 'chart-detailedAnalytics' },
    colorDistribution: { ref: colorDistributionRef, domId: 'chart-colorDistribution' },
  };

  const { width } = dimensions;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  useEffect(() => { fetchAnalysisData(); }, []);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt') || await AsyncStorage.getItem('token');
      if (!token) { showAlert('Error', 'Authentication required'); return; }
      const response = await fetch(`${API_BASE_URL}/api/users/analysis/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisData(data.stats);
      } else {
        showAlert('Error', data.message || 'Failed to fetch analysis data');
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      showAlert('Error', 'Failed to fetch analysis statistics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalysisData();
    setRefreshing(false);
  };

  // ─── Cross-platform alert ─────────────────────────────────────────────────
  const showAlert = (title: string, message: string) => {
    if (isWeb) {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // ─── Chart config ─────────────────────────────────────────────────────────
  const SCREEN_PADDING = 32;
  const CARD_PADDING   = 32;
  const chartWidth     = width - SCREEN_PADDING - CARD_PADDING;

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

  // ─── Derived data ─────────────────────────────────────────────────────────
  const growthData = analysisData ? {
    labels: analysisData.growth.labels,
    datasets: [{ data: analysisData.growth.data, color: (o = 1) => `rgba(45,80,22,${o})`, strokeWidth: 3 }],
  } : { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [0], color: (o=1)=>`rgba(45,80,22,${o})`, strokeWidth: 3 }] };

  const engagementData = analysisData ? {
    labels: ['Scans','Posts','Market','Chatbot'],
    datasets: [{
      data: [
        analysisData.engagement.scans   || 1,
        analysisData.engagement.posts   || 1,
        analysisData.engagement.market  || 1,
        analysisData.engagement.chatbot || 1,
      ],
      colors: [
        (o=1) => `rgba(74,124,47,${o})`,
        (o=1) => `rgba(99,102,241,${o})`,
        (o=1) => `rgba(245,158,11,${o})`,
        (o=1) => `rgba(20,184,166,${o})`,
      ],
    }],
  } : { labels: ['Scans','Posts','Market','Chatbot'], datasets: [{ data: [1,1,1,1], colors: [] }] };

  const marketSalesData = analysisData?.market_sales ? {
    labels: analysisData.market_sales.labels,
    datasets: [{ data: analysisData.market_sales.data.length > 0 ? analysisData.market_sales.data : [0], color: (o=1)=>`rgba(74,124,47,${o})`, strokeWidth: 3 }],
  } : { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [0], color: (o=1)=>`rgba(74,124,47,${o})`, strokeWidth: 3 }] };

  const insights = analysisData ? [
    { icon: 'trending-up' as const, title: 'User Growth', value: `${analysisData.insights.user_growth > 0 ? '+' : ''}${analysisData.insights.user_growth}%`, description: 'From last month', color: COLORS.green },
    { icon: 'scan'        as const, title: 'Total Scans', value: analysisData.detailed.total_scans.toLocaleString(), description: 'All scan types', color: COLORS.blue },
    { icon: 'people'      as const, title: 'Total Users', value: analysisData.detailed.total_users.toLocaleString(), description: `${analysisData.detailed.active_users} active`, color: COLORS.indigo },
    { icon: 'chatbubbles' as const, title: 'Forum Posts', value: analysisData.detailed.total_posts.toLocaleString(), description: 'Community engagement', color: COLORS.red },
  ] : [];

  const analyticsItems = analysisData ? [
    { label: 'Total Scans Performed', value: analysisData.detailed.total_scans.toLocaleString(),    icon: 'scan'         as const, color: COLORS.green  },
    { label: 'Forum Posts Created',   value: analysisData.detailed.total_posts.toLocaleString(),    icon: 'chatbubbles'  as const, color: COLORS.indigo },
    { label: 'Ripeness Scans',        value: analysisData.detailed.ripeness_scans.toLocaleString(), icon: 'nutrition'    as const, color: COLORS.amber  },
    { label: 'Leaf Health Scans',     value: analysisData.detailed.leaf_scans.toLocaleString(),     icon: 'leaf'         as const, color: COLORS.teal   },
    { label: 'Disease Detections',    value: analysisData.detailed.disease_scans.toLocaleString(),  icon: 'alert-circle'   as const, color: COLORS.red    },
    { label: 'Colour Scans',          value: (analysisData.detailed.color_scans ?? 0).toLocaleString(), icon: 'color-palette' as const, color: '#9C27B0'    },
    { label: 'Total Users',           value: analysisData.detailed.total_users.toLocaleString(),    icon: 'people'         as const, color: COLORS.blue   },
  ] : [];

  const barLegend = [
    { label: 'Scans', color: COLORS.green }, { label: 'Posts', color: COLORS.indigo },
    { label: 'Market', color: COLORS.amber }, { label: 'Chatbot', color: COLORS.teal },
  ];

  const historyData: HistoryRow[] = analysisData?.history
    ? analysisData.history.map((item: any) => ({
        date: item.date,
        type: item.type,
        user: item.user,
        userImage: item.user_image,
        result: item.result,
        confidence: item.confidence,
        image: item.image_url,
        status: item.status as HistoryRow['status'],
        typeColor: getTypeColor(item.type),
      }))
    : [];

  const totalPages = Math.ceil(historyData.length / ROWS_PER_PAGE);
  const pagedRows  = historyData.slice(historyPage * ROWS_PER_PAGE, (historyPage + 1) * ROWS_PER_PAGE);

  // ─── Individual chart download ────────────────────────────────────────────
  const handleDownloadChartImage = async (chartKey: string, chartLabel: string) => {
    try {
      setDownloadingChart(chartKey);
      await new Promise(r => setTimeout(r, 200));

      if (isWeb) {
        // ── WEB: use html2canvas + <a download> ──
        const meta = chartMeta[chartKey];
        if (!meta) { showAlert('Error', 'Chart not available'); return; }
        await webCaptureAndDownload(meta.domId, `avocare-${chartKey}.png`);
      } else {
        // ── NATIVE: use react-native-view-shot + expo-media-library ──
        const meta = chartMeta[chartKey];
        if (!meta?.ref?.current) { showAlert('Not Ready', 'Scroll to the chart first and try again.'); return; }
        const uri = await captureRef(meta.ref, { format: 'png', quality: 0.95 });
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status === 'granted') {
          const asset = await MediaLibrary.createAssetAsync(uri);
          await MediaLibrary.createAlbumAsync('AvoCare', asset, false);
          showAlert('✅ Saved!', `"${chartLabel}" saved to your Photos › AvoCare album.`);
        } else {
          const Sharing = require('expo-sharing');
          await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Save ${chartLabel}` });
        }
      }
    } catch (error) {
      console.error('Chart download error:', error);
      showAlert('Download Failed', `Could not save "${chartLabel}". Please try again.`);
    } finally {
      setDownloadingChart(null);
    }
  };

  // ─── Export modal helpers ─────────────────────────────────────────────────
  const allSelected  = CHART_OPTIONS.every(o => selectedCharts[o.key]);
  const noneSelected = CHART_OPTIONS.every(o => !selectedCharts[o.key]);
  const toggleChart  = (key: string) => setSelectedCharts(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAll    = () => setSelectedCharts(Object.fromEntries(CHART_OPTIONS.map(o => [o.key, !allSelected])));

  // ─── Capture all selected charts ──────────────────────────────────────────
  const captureAllImages = async (): Promise<Record<string, string>> => {
    const images: Record<string, string> = {};
    for (const option of CHART_OPTIONS) {
      if (option.key === 'activityHistory' || !selectedCharts[option.key]) continue;
      const meta = chartMeta[option.key];
      try {
        if (isWeb) {
          images[option.key] = await webCaptureBase64(meta.domId);
        } else {
          if (meta?.ref?.current) {
            const uri = await captureRef(meta.ref, { format: 'png', quality: 0.92 });
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
            images[option.key] = `data:image/png;base64,${base64}`;
          }
        }
      } catch (e) {
        console.warn(`Could not capture ${option.key}`, e);
      }
    }
    return images;
  };

  // ─── Export as PDF ────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (noneSelected) { showAlert('Nothing Selected', 'Please select at least one section.'); return; }
    try {
      setExporting(true);
      await new Promise(r => setTimeout(r, 300));

      const images = await captureAllImages();
      const logoDataUrl = await getLogoDataUrl();
      const html   = buildPDFHtml(selectedCharts, images, analysisData, historyData, logoDataUrl);

      if (isWeb) {
        // ── WEB: open print dialog ──
        const printWindow = window.open('', '_blank');
        if (!printWindow) { showAlert('Error', 'Pop-up blocked. Please allow pop-ups for this site.'); return; }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        // ── NATIVE: expo-print + sharing ──
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'AvoCare Analysis Report' });
      }

      setExportModalVisible(false);
      showAlert('Success', 'Analysis report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      showAlert('Export Failed', 'Could not export the analysis report.');
    } finally {
      setExporting(false);
    }
  };

  // ─── Export as images ─────────────────────────────────────────────────────
  const handleExportImages = async () => {
    const keysToExport = CHART_OPTIONS.filter(o => selectedCharts[o.key] && o.key !== 'activityHistory');
    if (keysToExport.length === 0) {
      showAlert('No Charts Selected', 'Please select at least one chart section (Activity History is PDF only).');
      return;
    }
    try {
      setExporting(true);
      await new Promise(r => setTimeout(r, 300));

      if (isWeb) {
        // ── WEB: download each selected chart as PNG ──
        for (const option of keysToExport) {
          await webCaptureAndDownload(chartMeta[option.key].domId, `avocare-${option.key}.png`);
          await new Promise(r => setTimeout(r, 300)); // slight delay between downloads
        }
        setExportModalVisible(false);
        showAlert('✅ Downloaded!', `${keysToExport.length} chart image(s) downloaded to your browser's Downloads folder.`);
      } else {
        // ── NATIVE: save to Photos ──
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
            } catch (e) { console.warn(`Could not capture ${option.key}`, e); }
          }
        }
        setExportModalVisible(false);
        if (savedLabels.length > 0) {
          showAlert('✅ Saved to Photos!', `${savedLabels.length} chart(s) saved:\n• ${savedLabels.join('\n• ')}`);
        }
      }
    } catch (error) {
      console.error('Image export error:', error);
      showAlert('Export Failed', 'Could not export chart images.');
    } finally {
      setExporting(false);
    }
  };

  // ─── Wrapper: renders as nativeID-tagged View on web, ViewShot on native ──
  const ChartWrapper = ({
    chartKey,
    children,
    nativeRef,
  }: {
    chartKey: string;
    children: React.ReactNode;
    nativeRef: React.RefObject<any>;
  }) => {
    const domId = chartMeta[chartKey]?.domId;

    if (isWeb) {
      // On web: plain View with nativeID so html2canvas can find it by DOM id
      return (
        <View nativeID={domId}>
          {children}
        </View>
      );
    }

    // On native: wrap in ViewShot for screenshot capture
    if (!ViewShot) return <View>{children}</View>;
    return (
      <ViewShot ref={nativeRef} options={{ format: 'png', quality: 0.92 }}>
        {children}
      </ViewShot>
    );
  };

  // ─── Inline download button shown on each chart card ─────────────────────
  const ChartDownloadBtn = ({ chartKey, label }: { chartKey: string; label: string }) => {
    const isLoading = downloadingChart === chartKey;
    const isDisabled = downloadingChart !== null && !isLoading;
    return (
      <TouchableOpacity
        onPress={() => handleDownloadChartImage(chartKey, label)}
        disabled={isLoading || isDisabled}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: '#F0F7EA', borderRadius: 8,
          paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1, borderColor: '#C5D9B0',
          opacity: isDisabled ? 0.4 : 1,
        }}
      >
        {isLoading
          ? <ActivityIndicator size="small" color="#4A7C2F" style={{ width: 14, height: 14 }} />
          : <Ionicons name="download-outline" size={14} color="#4A7C2F" />
        }
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#4A7C2F' }}>
          {isLoading ? 'Saving…' : 'Save'}
        </Text>
      </TouchableOpacity>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
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
            {refreshing
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="refresh" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={!isWeb
          ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A7C2F']} tintColor="#4A7C2F" />
          : undefined}
      >
        {/* ── Period Selector ── */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
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
              <Text style={styles.sectionTitle}>Key Insights</Text>
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
              <LineChart data={growthData} width={chartWidth} height={220} chartConfig={baseChartConfig}
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
                <Text style={styles.chartSubtitle}>Total interactions this month</Text>
              </View>
              <ChartDownloadBtn chartKey="featureEngagement" label="Feature Engagement" />
            </View>
            <View style={styles.legendRow}>
              {barLegend.map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart data={engagementData} width={chartWidth} height={220} chartConfig={baseChartConfig}
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
                <Text style={styles.chartSubtitle}>Last 6 months revenue trend</Text>
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
              <LineChart data={marketSalesData} width={chartWidth} height={220} chartConfig={baseChartConfig}
                bezier style={styles.chart} withInnerLines withOuterLines withVerticalLines={false}
                withHorizontalLines withDots withShadow={false} fromZero yAxisLabel="₱" />
            </ScrollView>
          </View>
        </ChartWrapper>

        {/* ── Detailed Analytics ── */}
        <ChartWrapper chartKey="detailedAnalytics" nativeRef={detailedAnalyticsRef}>
          <View style={styles.analyticsCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>Detailed Analytics</Text>
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
            {analysisData?.color_distribution?.length > 0 ? (
              <PieChart
                data={analysisData.color_distribution.map((item: any) => ({
                  name: item.name,
                  population: item.count || 1,
                  color: ({ Black: '#0e0e0e', Green: '#4CAF50', 'Purple Brown': '#291d2c' } as Record<string, string>)[item.name] ?? '#999',
                  legendFontColor: '#2D5016',
                  legendFontSize: 12,
                }))}
                width={chartWidth}
                height={200}
                chartConfig={baseChartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
                absolute
              />
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: '#A0B89A', fontSize: 14 }}>No colour scan data yet</Text>
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

              {/* Scan image or icon placeholder */}
              <View style={styles.historyThumbWrap}>
                {row.image ? (
                  <Image source={{ uri: row.image }} style={styles.historyThumb} />
                ) : (
                  <View style={[styles.historyThumbPlaceholder, { backgroundColor: `${row.typeColor}22` }]}>
                    <Ionicons name={getTypeIcon(row.type) as any} size={22} color={row.typeColor} />
                  </View>
                )}
              </View>

              {/* Main content */}
              <View style={styles.historyContent}>
                <View style={styles.historyBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: `${row.typeColor}18` }]}>
                    <Text style={[styles.typeBadgeText, { color: row.typeColor }]}>{row.type}</Text>
                  </View>
                  {row.confidence != null && (
                    <Text style={styles.historyConfidence}>{row.confidence}%</Text>
                  )}
                </View>
                <Text style={styles.historyResult} numberOfLines={1}>{row.result}</Text>
                <Text style={styles.historyMeta}>{row.user} · {row.date}</Text>
              </View>

              {/* Status */}
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

      {/* ─────────────────────────────────────────────────────────────────────
          Export Modal
          ───────────────────────────────────────────────────────────────────── */}
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

            {/* ── PDF / Images toggle ── */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F0F7EA', borderRadius: 10, padding: 3, marginBottom: 14 }}>
              {(['pdf', 'image'] as DownloadMode[]).map(mode => (
                <TouchableOpacity key={mode} onPress={() => setDownloadMode(mode)} activeOpacity={0.8}
                  style={{
                    flex: 1, paddingVertical: 9, borderRadius: 8,
                    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
                    backgroundColor: downloadMode === mode ? '#2D5016' : 'transparent',
                  }}>
                  <Ionicons
                    name={mode === 'pdf' ? 'document-text-outline' : 'image-outline'}
                    size={15}
                    color={downloadMode === mode ? '#fff' : '#6A8A50'}
                  />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: downloadMode === mode ? '#fff' : '#6A8A50' }}>
                    {mode === 'pdf' ? 'PDF Report' : 'Images'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSubtitle}>
              {downloadMode === 'pdf'
                ? isWeb
                  ? 'Choose sections to include — opens browser print dialog:'
                  : 'Choose sections to include in your PDF report:'
                : isWeb
                  ? 'Choose charts to download as PNG files:'
                  : 'Choose charts to save as PNG images to your Photos:'}
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
                      <Text style={styles.checkboxDesc}>
                        {imageUnsupported ? 'PDF only — tables cannot be saved as images' : chart.desc}
                      </Text>
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
                        {downloadMode === 'pdf'
                          ? (isWeb ? 'Print / Save PDF' : 'Download PDF')
                          : (isWeb ? 'Download Images' : 'Save Images')}
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default AnalysisScreen;