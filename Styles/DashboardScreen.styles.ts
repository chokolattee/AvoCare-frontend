import { StyleSheet, Platform } from 'react-native';

// ─── Palette (mirrored from AboutScreen) ──────────────────────────────────────
const C = {
  forest:      '#2d5016',
  sage:        '#3d6b22',
  sageMed:     '#5a8c35',
  sagePale:    '#d4ecb8',
  sageMid:     '#b0d890',
  sageTint:    '#e4f5d0',
  ink:         '#111a0a',
  inkSoft:     '#2e4420',
  inkFaint:    '#6a8450',
  mist:        '#dff0cc',
  fog:         '#cce8b0',
  white:       '#ffffff',
  bg:          '#cce8a8',
  headerBg:    '#bedd96',
  border:      '#b8d898',
  borderSoft:  '#cce0a8',
  borderMid:   '#aed090',
  cardBg:      '#f0f9e4',

  // Accent colours retained from original dashboard
  amber:       '#f59e0b',
  red:         '#ef4444',
  indigo:      '#6366f1',
  teal:        '#14b8a6',
  blue:        '#3b82f6',
};

export const styles = StyleSheet.create({

  // ── Container ─────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: C.inkFaint,
    letterSpacing: 0.3,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.forest,
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  headerLeft: {
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sageMid,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.sageMid,
    marginTop: 5,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // ── Stat Cards — 2×2 grid ─────────────────────────────────────────────────
  statsSection: {
    paddingHorizontal: 16,
    marginTop: -18,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'stretch',   // cards match each other's height within a row, but don't expand to fill parent
  },
  statCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 10px rgba(26,58,5,0.10)' } as any,
    }),
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 3,
    flexShrink: 1,
    maxWidth: 130,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  trendText: {
    fontSize: 9,
    fontWeight: '700',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 3,
    letterSpacing: -0.6,
  },
  statTitle: {
    fontSize: 10,
    color: C.inkFaint,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // "Save" row that sits below the 4 stat cards
  statsExportRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    marginBottom: 8,
  },

  // ── Per-chart Save button ─────────────────────────────────────────────────
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.sageTint,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  saveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.sage,
    letterSpacing: 0.2,
  },

  // ── Charts outer container ────────────────────────────────────────────────
  chartsOuterContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 16,
  },
  // Two-column row — each chartCell is flex:1
  chartRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  chartCell: {
    flex: 1,
    minWidth: 0,
  },
  // Full-width row (Market Sales / Colour Distribution)
  chartRowFull: {
    flexDirection: 'row',
  },

  // ── Chart card ────────────────────────────────────────────────────────────
  chartCard: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.09)' } as any,
    }),
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.inkSoft,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 11,
    color: C.inkFaint,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  chart: {
    marginTop: 8,
    borderRadius: 12,
  },
  chartPlaceholder: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Legend ────────────────────────────────────────────────────────────────
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: C.inkFaint,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Market Sales inline stats ─────────────────────────────────────────────
  statItem: {
    flex: 1,
    backgroundColor: C.mist,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
  },
  statLabel: {
    fontSize: 9,
    color: C.inkFaint,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  marketStatValue: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: C.sage,
  },

  // ── Quick Actions ─────────────────────────────────────────────────────────
  quickActionsCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.09)' } as any,
    }),
  },
  quickActionsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.inkSoft,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: 18,
    backgroundColor: C.mist,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkSoft,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // ── Export Modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,58,5,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
    borderTopWidth: 2,
    borderColor: C.borderMid,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.borderMid,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: C.borderSoft,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: C.inkSoft,
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.sageTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: C.mist,
    borderRadius: 11,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: C.forest,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 0.2,
  },
  modeBtnTextActive: {
    color: C.white,
  },
  modalSubtitle: {
    fontSize: 12,
    color: C.inkFaint,
    marginBottom: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedCount: {
    fontSize: 12,
    color: C.inkFaint,
    fontWeight: '500',
  },
  selectAllBtn: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sage,
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    backgroundColor: C.mist,
    marginBottom: 6,
  },
  checkboxRowActive: {
    backgroundColor: C.sageTint,
    borderColor: C.sage,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkSoft,
    letterSpacing: 0.1,
  },
  checkboxDesc: {
    fontSize: 11,
    color: C.inkFaint,
    marginTop: 1,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cancelButton: {
    backgroundColor: C.mist,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.inkFaint,
  },
  confirmButton: {
    flex: 2,
    backgroundColor: C.forest,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },
});