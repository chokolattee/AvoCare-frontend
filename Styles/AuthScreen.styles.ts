import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB_WIDE = SCREEN_WIDTH >= 768;

export const GREEN_DARK = '#2d5a27';
export const GREEN_MID  = '#4a8c3f';
export const GREEN_LIGHT = '#e8f5e4';
export const GREEN_ACCENT = '#6dbf5a';
export const WHITE = '#ffffff';
export const TEXT_DARK = '#1a2e18';
export const TEXT_MUTED = '#7a9477';
export const INPUT_BORDER = '#c8e0c4';

export const styles = StyleSheet.create({

  /* ─── Root / Modal Shell ──────────────────────────────── */
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  /* Card that holds left panel + right form */
  card: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 860,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '95%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.4, shadowRadius: 32 },
      android: { elevation: 24 },
      web:     { boxShadow: '0 24px 64px rgba(0,0,0,0.35)' } as any,
    }),
  },

  /* ─── Left Green Panel ───────────────────────────────── */
  leftPanel: {
    flex: 1,
    backgroundColor: GREEN_DARK,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 40,
    minWidth: 220,
  },
  leftPanelHidden: {
    display: 'none',
  },
  leftWelcome: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  leftAppName: {
    color: WHITE,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 12,
  },
  leftTagline: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 180,
  },
  leftLogoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  leftLogo: {
    width: 44,
    height: 44,
  },
  leftSwitchLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 40,
  },
  leftSwitchBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  leftSwitchBtnText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },

  /* ─── Right Form Panel ───────────────────────────────── */
  rightPanel: {
    flex: 1.2,
    backgroundColor: WHITE,
  },
  scrollContent: {
    padding: 40,
    paddingTop: 44,
    paddingBottom: 32,
    flexGrow: 1,
  },

  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 32,
  },

  /* ─── Alert Banners ──────────────────────────────────── */
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edfaec',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: GREEN_ACCENT,
  },
  successText: {
    color: GREEN_DARK,
    fontSize: 13,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef0f0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#e05252',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    flex: 1,
  },
  errorTextSmall: {
    color: '#c0392b',
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2,
  },

  /* ─── Inputs ─────────────────────────────────────────── */
  inputGroup: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputRowItem: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: GREEN_LIGHT,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: TEXT_DARK,
    fontWeight: '500',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#e05252',
    backgroundColor: '#fff5f5',
  },

  /* ─── Buttons ────────────────────────────────────────── */
  submitButton: {
    backgroundColor: GREEN_DARK,
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    ...Platform.select({
      ios:     { shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 6 },
      web:     { boxShadow: '0 6px 18px rgba(45,90,39,0.35)' } as any,
    }),
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e6f0e4',
  },
  orDividerText: {
    marginHorizontal: 12,
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  googleButton: {
    backgroundColor: WHITE,
    paddingVertical: 13,
    borderRadius: 50,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
  },
  googleButtonText: {
    color: TEXT_DARK,
    fontWeight: '600',
    fontSize: 14,
  },

  /* ─── Mobile-only bottom switch ─────────────────────── */
  mobileSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 4,
  },
  mobileSwitchLabel: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  mobileSwitchBtn: {
    color: GREEN_DARK,
    fontWeight: '700',
    fontSize: 13,
  },

  /* ─── Terms ──────────────────────────────────────────── */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: INPUT_BORDER,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: GREEN_DARK,
    borderColor: GREEN_DARK,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: TEXT_MUTED,
    lineHeight: 17,
  },
  termsLink: {
    color: GREEN_MID,
    fontWeight: '600',
  },

  /* legacy aliases kept so nothing breaks */
  modalContainer:           { backgroundColor: WHITE, borderRadius: 20, width: '100%', maxWidth: 450, maxHeight: '90%' },
  logoContainer:            { alignItems: 'center', marginVertical: 0 },
  logo:                     { width: 250, height: 100 },
  divider:                  { height: 1, backgroundColor: '#e0e0e0', marginVertical: 20 },
  formSelection:            { flexDirection: 'row', gap: 10, marginBottom: 30 },
  selectionButton:          { flex: 1, padding: 12, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 10, alignItems: 'center' },
  selectionButtonActive:    { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  selectionButtonText:      { color: '#666', fontWeight: '600', fontSize: 16 },
  selectionButtonTextActive:{ color: WHITE },
  formPanel:                { marginBottom: 20 },
  successMessageContainer:  { backgroundColor: '#d4edda', borderColor: '#c3e6cb', borderWidth: 1, borderRadius: 4, padding: 12, marginVertical: 10 },
  successMessageText:       { color: '#155724', fontSize: 14 },
});