import { Platform, StyleSheet } from 'react-native';

// ─── Design tokens ────────────────────────────────────────────
const C = {
  bg:           '#e8f2de',   // MarketScreen container bg
  surface:      '#f4faed',   // MarketScreen card bg
  surfaceAlt:   '#eef7e6',   // slightly darker card variant
  border:       '#d4e9b8',   // MarketScreen card border
  borderDark:   '#c8e0b0',   // MarketScreen header border
  primary:      '#2e4420',   // MarketScreen headerTitle color (dark forest)
  primaryMid:   '#3d6b22',   // MarketScreen primary action color
  primaryLight: '#e2f0d4',   // MarketScreen searchWrap bg
  primaryFaint: '#f0f7e8',   // MarketScreen tabActive bg
  headerBg:     '#ddeece',   // MarketScreen headerBar bg
  text:         '#2e4420',   // dark forest text
  textMid:      '#4a6635',   // mid green text
  textLight:    '#7a9460',   // muted green text
  accent:       '#7aad4e',   // MarketScreen headerDot / categoryLabel color
  tagBg:        '#e2f0d4',   // MarketScreen searchWrap bg reused for tags
  ripeness:     '#2E9E6E',   // keep semantic colors
  leaf:         '#3D8C3D',
  disease:      '#C94040',
  warn:         '#c07c2a',   // archive orange from CommunityScreen
  noteBg:       '#f0f7e8',   // soft green note box
  noteBorder:   '#c8e0b0',
  noteLabel:    '#5a8c35',
};

const shadow = Platform.select({
  ios: {
    shadowColor: '#2a4d10',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  android: { elevation: 2 },
  web: {
    boxShadow: '0 2px 12px rgba(42,77,16,0.08)',
  } as any,
  default: {},
});

const shadowSm = Platform.select({
  ios: {
    shadowColor: '#2a4d10',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  android: { elevation: 1 },
  web: { boxShadow: '0 1px 6px rgba(42,77,16,0.06)' } as any,
  default: {},
});

export const styles = StyleSheet.create({
  // ── Root ────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web'
      ? ({
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        } as any)
      : {}),
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    backgroundColor: C.headerBg,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 20 : 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.borderDark,
    ...(Platform.OS === 'web' ? ({ flexShrink: 0 } as any) : {}),
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  headerInner: {
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? 28 : 24,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  headerCount: {
    fontSize: 13,
    color: C.primaryMid,
    fontWeight: '700',
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },

  // ── Main scrollable area ─────────────────────────────────────
  mainContent: {
    flex: 1,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web'
      ? ({
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
        } as any)
      : {}),
  },

  // ── Centre column ────────────────────────────────────────────
  centerColumn: {
    maxWidth: 880,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  // ── Controls bar ─────────────────────────────────────────────
  controlsBar: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
    marginBottom: 18,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 9,
    borderWidth: 1.5,
    borderColor: C.border,
    flex: Platform.OS === 'web' ? 1 : undefined,
    ...shadowSm,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    outlineStyle: 'none',
  } as any,

  // ── Category chips ───────────────────────────────────────────
  categoriesRow: {
    flexGrow: 0,
    flexDirection: 'row',
  },
  categoriesContent: {
    flexDirection: 'row',
    gap: 7,
    paddingRight: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.primaryFaint,
    borderWidth: 1.5,
    borderColor: C.border,
    gap: 5,
    ...shadowSm,
  },
  categoryButtonActive: {
    backgroundColor: C.primaryMid,
    borderColor: C.primaryMid,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMid,
    letterSpacing: 0.1,
  },
  categoryTextActive: { color: '#fff' },

  // ── Results header ───────────────────────────────────────────
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resultsCount: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Analysis card ────────────────────────────────────────────
  analysisCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...shadow,
  },

  // Coloured top accent bar
  cardAccentBar: {
    height: 3,
  },

  // Card body padding
  cardBody: {
    padding: 16,
  },

  // ── Card header row ──────────────────────────────────────────
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { flex: 1 },
  analysisTypeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.2,
  },
  timeAgo: {
    fontSize: 12,
    color: C.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#fceaea',
    borderWidth: 1,
    borderColor: '#f5c6c6',
  },

  // ── Image strip ──────────────────────────────────────────────
  imageStrip: {
    marginBottom: 14,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageStripContent: {
    flexDirection: 'row',
    gap: 10,
  },
  imageThumbWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.tagBg,
  },
  imageThumb: {
    // size set inline
  },
  imagePill: {
    position: 'absolute',
    bottom: 7,
    left: 7,
    backgroundColor: 'rgba(30,50,20,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  imagePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Stat row ─────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryFaint,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    flex: 1,
    minWidth: 110,
    borderWidth: 1,
    borderColor: C.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  confDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Recommendation ───────────────────────────────────────────
  recBox: {
    flexDirection: 'row',
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  recIcon: { marginTop: 1 },
  recText: {
    flex: 1,
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
    fontWeight: '500',
  },

  // ── Ripeness detail pills ────────────────────────────────────
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.tagBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  pillText: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '500',
  },

  // ── Notes ────────────────────────────────────────────────────
  notesBox: {
    backgroundColor: C.noteBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.noteBorder,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.noteLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },

  // ── Probabilities ────────────────────────────────────────────
  probsSection: {
    marginTop: 4,
  },
  probsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  probsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  probLabel: {
    fontSize: 12,
    color: C.textMid,
    width: 90,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  probTrack: {
    flex: 1,
    height: 5,
    backgroundColor: C.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  probFill: {
    height: '100%',
    borderRadius: 3,
  },
  probPct: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMid,
    width: 42,
    textAlign: 'right',
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.tagBg,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 14,
    color: C.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Login prompt ─────────────────────────────────────────────
  loginPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  loginIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.tagBg,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginPromptTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  loginPromptText: {
    fontSize: 15,
    color: C.textLight,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 23,
  },
  loginButton: {
    backgroundColor: C.primaryMid,
    paddingHorizontal: 36,
    paddingVertical: 13,
    borderRadius: 10,
    minWidth: 180,
    alignItems: 'center',
    ...shadow,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});