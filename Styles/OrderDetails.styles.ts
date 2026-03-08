import { StyleSheet, Platform } from 'react-native'

// ─── Palette (matches MarketScreen / ProductDetailScreen / ListOrderScreen) ───
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
  green:       '#2e7d32',
  greenPale:   '#e8f5e9',
  greenBorder: '#a5d6a7',
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Loading / Empty ────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    gap: 12,
  },
  loadingText: {
    color: C.inkFaint,
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Page Header ────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.headerBg,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
    marginBottom: 14,
    backgroundColor: '#f0f7e8',
  },
  backBtnText: {
    color: C.sageMed,
    fontSize: 13,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    color: C.ink,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  orderId: {
    color: C.inkFaint,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  orderDate: {
    color: C.inkFaint,
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  statusBadgeText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  // ── Cards ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderSoft,
    margin: 14,
    marginBottom: 0,
    overflow: 'hidden',
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
  cardLast: {
    marginBottom: 40,
  },
  cardTitle: {
    color: C.inkSoft,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.mist,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Order Item Row ─────────────────────────────────────────────────────────
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: C.sagePale,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: C.sagePale,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImagePlaceholderText: {
    color: C.inkFaint,
    fontSize: 10,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    color: C.inkSoft,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQty: {
    color: C.inkFaint,
    fontSize: 13,
  },
  itemTotal: {
    color: C.forest,
    fontSize: 16,
    fontWeight: '800',
  },

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: C.borderSoft,
    marginVertical: 12,
    marginHorizontal: 16,
  },

  // ── Total Row ──────────────────────────────────────────────────────────────
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.sageTint,
    borderTopWidth: 1,
    borderTopColor: C.borderSoft,
  },
  totalLabel: {
    color: C.inkFaint,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalAmount: {
    color: C.forest,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  // ── Payment Box ────────────────────────────────────────────────────────────
  paymentBox: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    margin: 14,
    marginBottom: 10,
  },
  paymentStatus: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Info Box ───────────────────────────────────────────────────────────────
  infoBox: {
    backgroundColor: C.mist,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  infoLabel: {
    color: C.inkFaint,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  infoValue: {
    color: C.inkSoft,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
  },

  // ── Order Summary ──────────────────────────────────────────────────────────
  summaryBox: {
    margin: 14,
    backgroundColor: C.mist,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.borderSoft,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  summaryLabel: {
    color: C.inkFaint,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    color: C.inkSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryTotalLabel: {
    color: C.inkSoft,
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTotal: {
    color: C.forest,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
})