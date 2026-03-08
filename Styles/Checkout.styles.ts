import { StyleSheet, Platform } from 'react-native';

export const confirmStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6faf2',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ─── Section cards ───────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f0e0',
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f7e8',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
    flex: 1,
  },
  cardBadge: {
    backgroundColor: '#3d6b22',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    padding: 14,
  },

  // ─── Info rows ───────────────────────────────────────────────────────
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9abf74',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#2e4420',
    fontWeight: '500',
  },

  // ─── Order item row ──────────────────────────────────────────────────
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f7e8',
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e8f5dc',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2e4420',
    marginBottom: 2,
  },
  orderItemQtyPrice: {
    fontSize: 12,
    color: '#888',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3d6b22',
  },

  // ─── Summary rows ────────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryValueFree: {
    color: '#3d6b22',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8f0e0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2e4420',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3d6b22',
  },

  // ─── Free shipping alert ─────────────────────────────────────────────
  freeShippingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef7e4',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c8e8a0',
  },
  freeShippingText: {
    fontSize: 12,
    color: '#3d6b22',
    fontWeight: '500',
    flex: 1,
  },
  nearFreeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff8e6',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffe099',
  },
  nearFreeText: {
    fontSize: 12,
    color: '#8a6000',
    fontWeight: '500',
    flex: 1,
  },

  // ─── Buttons ─────────────────────────────────────────────────────────
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3d6b22',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: '#3d6b22',
    fontSize: 15,
    fontWeight: '600',
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  secureNoteText: {
    fontSize: 12,
    color: '#9abf74',
  },

  // ─── Delivery info ───────────────────────────────────────────────────
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  deliveryInfoText: {
    fontSize: 13,
    color: '#5a8c35',
  },
});

export const paymentStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6faf2',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ─── Card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f0e0',
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f7e8',
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
  },
  cardBody: {
    padding: 14,
    gap: 12,
  },

  // ─── User banner ─────────────────────────────────────────────────────
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef7e4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#c8e8a0',
  },
  userBannerText: {
    fontSize: 12,
    color: '#2e4420',
    flex: 1,
  },

  // ─── Form ────────────────────────────────────────────────────────────
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a7040',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#f8fdf4',
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#2e4420',
  },
  inputFocused: {
    borderColor: '#3d6b22',
    backgroundColor: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputHint: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 2,
  },

  // ─── Test mode banner ────────────────────────────────────────────────
  testBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff8e6',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffe099',
  },
  testBannerText: {
    fontSize: 12,
    color: '#8a6000',
    flex: 1,
    lineHeight: 17,
  },

  // ─── Pay button ──────────────────────────────────────────────────────
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3d6b22',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 4,
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── Order summary rows ──────────────────────────────────────────────
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f7e8',
  },
  summaryItemImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#e8f5dc',
  },
  summaryItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e4420',
    flex: 1,
  },
  summaryItemQty: {
    fontSize: 11,
    color: '#888',
  },
  summaryItemTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3d6b22',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e8f0e0',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3d6b22',
  },
  shippingAddress: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginTop: 4,
  },
});

export const orderSuccessStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6faf2',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eef7e4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#7aad4e',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2e4420',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 21,
  },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3d6b22',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 8,
  },
  ordersBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3d6b22',
  },
  shopBtnText: {
    color: '#3d6b22',
    fontSize: 14,
    fontWeight: '600',
  },
});

export const shippingStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6faf2',
  },

  // ─── Header ─────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0e0',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e4420',
    flex: 1,
  },

  // ─── Scroll ──────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ─── User info banner ────────────────────────────────────────────────
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eef7e4',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e8a0',
  },
  userBannerText: {
    fontSize: 13,
    color: '#2e4420',
  },
  userBannerName: {
    fontWeight: '700',
  },

  // ─── Section title ───────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5a8c35',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
    marginTop: 4,
  },

  // ─── Saved addresses ─────────────────────────────────────────────────
  savedAddressCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    marginBottom: 8,
    overflow: 'hidden',
  },
  savedAddressCardSelected: {
    borderColor: '#3d6b22',
  },
  savedAddressCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3d6b22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3d6b22',
  },
  savedAddressText: {
    flex: 1,
    fontSize: 13,
    color: '#2e4420',
    lineHeight: 19,
  },

  // ─── New address button ──────────────────────────────────────────────
  newAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3d6b22',
    borderStyle: 'dashed',
    marginBottom: 16,
    justifyContent: 'center',
  },
  newAddressBtnText: {
    fontSize: 13,
    color: '#3d6b22',
    fontWeight: '600',
  },

  // ─── Form fields ─────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a7040',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#2e4420',
  },
  inputFocused: {
    borderColor: '#3d6b22',
  },

  // ─── Submit button ───────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: '#3d6b22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});