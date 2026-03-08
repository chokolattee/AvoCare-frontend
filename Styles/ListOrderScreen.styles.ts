import { StyleSheet, Platform } from 'react-native';

export const MAX_CONTENT_WIDTH = 960;

// ─── Palette (matches MarketScreen / ProductDetailScreen) ─────────────────────
const C = {
  forest:      '#2d5016',
  sage:        '#3d6b22',
  sageMed:     '#5a8c35',
  sageLt:      '#7aad4e',
  sagePale:    '#e8f5dc',
  sageMid:     '#c8e8b0',
  sageTint:    '#f2fae9',
  ink:         '#111a0a',
  inkSoft:     '#2e4420',
  inkFaint:    '#7a9460',
  mist:        '#f7faf3',
  fog:         '#eef3e8',
  white:       '#ffffff',
  bg:          '#e8f2de',
  headerBg:    '#ddeece',
  border:      '#d5e8c0',
  borderSoft:  '#e8f2dc',
  borderMid:   '#c8e0b0',
  red:         '#b83232',
  redPale:     '#fdf0f0',
  redBorder:   '#efc0c0',
  amber:       '#f59e0b',
  amberPale:   '#fffbeb',
  amberBorder: '#fde68a',
  blue:        '#1565c0',
  bluePale:    '#e3f2fd',
  orange:      '#e65100',
  orangePale:  '#fff3e0',
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web' ? { height: '100vh' as any, overflow: 'hidden' as any } : {}),
  },

  // ─── Header ───────────────────────────────────────────────────────────────
  headerBar: {
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  headerContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center' as const,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#f0f7e8',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  backText: {
    fontSize: 13,
    color: C.sageMed,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.ink,
    letterSpacing: -0.4,
  },

  // ─── Reviews header button ─────────────────────────────────────────────────
  reviewsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: C.amberPale,
    borderWidth: 1.5,
    borderColor: C.amberBorder,
  },
  reviewsHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  tabsScrollContent: {
    paddingBottom: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 2,
    paddingBottom: 0,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: C.sage,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.inkFaint,
  },
  tabTextActive: {
    color: C.sage,
    fontWeight: '800',
  },
  tabCountBadge: {
    backgroundColor: C.fog,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.border,
  },
  tabCountBadgeActive: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
  },
  tabCountTextActive: {
    color: C.white,
  },

  // ─── Scroll / List ────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflow: 'auto' as any } : {}),
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  listInner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center' as const,
    gap: 12,
  },

  // ─── States ───────────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: C.inkFaint,
  },
  errorText: {
    fontSize: 15,
    color: C.red,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.inkSoft,
  },
  emptySubText: {
    fontSize: 13,
    color: C.inkFaint,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  // ─── Order Card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a05',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 12px rgba(26,58,5,0.08)' } as any,
    }),
  },

  // ── Card top accent strip (color-coded by status) ──────────────────────────
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    paddingBottom: 10,
    backgroundColor: C.mist,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: 0.8,
  },
  orderDate: {
    fontSize: 11,
    color: C.inkFaint,
    marginTop: 2,
    fontWeight: '500',
  },

  // ── Status pill ────────────────────────────────────────────────────────────
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Status colours — matched to app palette
  statusProcessing:     { backgroundColor: C.orangePale,  borderColor: '#ffd0a0' },
  statusTextProcessing: { color: C.orange },
  statusShipped:        { backgroundColor: C.bluePale,    borderColor: '#b3d4f5' },
  statusTextShipped:    { color: C.blue },
  statusDelivered:      { backgroundColor: C.sagePale,    borderColor: C.sageMid },
  statusTextDelivered:  { color: C.forest },
  statusCancelled:      { backgroundColor: C.redPale,     borderColor: C.redBorder },
  statusTextCancelled:  { color: C.red },
  statusDefault:        { backgroundColor: C.fog,         borderColor: C.border },
  statusTextDefault:    { color: C.inkFaint },

  divider: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginHorizontal: 14,
  },

  // ─── Items preview ────────────────────────────────────────────────────────
  itemsPreview: {
    gap: 8,
    padding: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.sagePale,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: C.sagePale,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.inkSoft,
  },
  itemQtyPrice: {
    fontSize: 12,
    color: C.inkFaint,
    marginTop: 2,
  },
  moreItems: {
    fontSize: 12,
    color: C.sageMed,
    fontStyle: 'italic',
    paddingLeft: 54,
  },

  // ─── Card footer (total) ──────────────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.sageTint,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  totalLabel: {
    fontSize: 12,
    color: C.inkFaint,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: C.forest,
    letterSpacing: -0.4,
  },

  // ─── Action buttons row ───────────────────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    paddingTop: 10,
  },
  viewBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    backgroundColor: C.white,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sage,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.redPale,
    borderWidth: 1.5,
    borderColor: C.redBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.red,
  },
  reviewBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.amber,
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
  },
  viewReviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: C.amberBorder,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: C.amberPale,
  },
  viewReviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },

  // ─── Header spacer (unused but kept for compat) ───────────────────────────
  headerSpacer: {
    width: 60,
  },
});