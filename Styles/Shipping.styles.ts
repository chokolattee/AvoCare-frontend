import { StyleSheet, Platform } from 'react-native';

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

  // ─── Checkout steps ──────────────────────────────────────────────────
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0e0',
    gap: 0,
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#3d6b22',
  },
  stepCircleInactive: {
    backgroundColor: '#ddd',
  },
  stepCircleCompleted: {
    backgroundColor: '#7aad4e',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepLabelActive: {
    color: '#3d6b22',
  },
  stepLabelInactive: {
    color: '#aaa',
  },
  stepConnector: {
    height: 2,
    flex: 0.5,
    marginBottom: 18,
  },
  stepConnectorActive: {
    backgroundColor: '#7aad4e',
  },
  stepConnectorInactive: {
    backgroundColor: '#ddd',
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

  // ─── Section heading ─────────────────────────────────────────────────
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
  pickerWrap: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    color: '#2e4420',
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