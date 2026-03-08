import { StyleSheet, Platform } from 'react-native';

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
  orange:      '#e65100',
  orangePale:  '#fff3e0',
  orangeBorder:'#ffe0b2',
  star:        '#ffc107',
};

const MAX_CONTENT_WIDTH = 960;

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
    // ← removed overflow:'hidden' — it was blocking scroll on web
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 12,
    backgroundColor: C.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: C.fog,
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

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 12,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center' as const,
  },

  // ── Section card ──────────────────────────────────────────────────────────
  section: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.borderSoft,
    gap: 12,
    ...Platform.select({
      ios:     { shadowColor: '#1a3a05', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.08)' } as any,
    }),
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sageMed,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Product row ───────────────────────────────────────────────────────────
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    backgroundColor: C.mist,
    gap: 12,
  },
  productRowSelected: {
    borderColor: C.sage,
    backgroundColor: C.sageTint,
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: C.sagePale,
    borderWidth: 1,
    borderColor: C.border,
  },
  productMeta: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.inkSoft,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 13,
    color: C.sageMed,
    fontWeight: '600',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: C.sage,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: C.sage,
  },

  // ── Rating ────────────────────────────────────────────────────────────────
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: C.sage,
    fontWeight: '700',
    marginTop: 2,
  },

  // ── Comment ───────────────────────────────────────────────────────────────
  textInput: {
    backgroundColor: C.mist,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    borderRadius: 12,
    padding: 14,
    color: C.inkSoft,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 130,
    lineHeight: 22,
  },
  textInputError: {
    borderColor: C.red,
    backgroundColor: C.redPale,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  errorText: {
    fontSize: 12,
    color: C.red,
    flex: 1,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: C.inkFaint,
    fontWeight: '500',
  },

  // ── Upload ────────────────────────────────────────────────────────────────
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.mist,
  },
  uploadBtnDisabled: {
    opacity: 0.4,
  },
  uploadBtnText: {
    color: C.sage,
    fontWeight: '600',
    fontSize: 14,
  },

  // ── Image preview grid ────────────────────────────────────────────────────
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewItem: {
    position: 'relative',
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderMid,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: C.red,
    borderRadius: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Archive banner ────────────────────────────────────────────────────────
  archiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.orangePale,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.orangeBorder,
  },
  archiveBannerText: {
    fontSize: 13,
    color: C.orange,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: C.orange,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  archiveBtnText: {
    color: C.orange,
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.sage,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  submitBtnDisabled: {
    backgroundColor: C.borderMid,
  },
  submitBtnText: {
    color: C.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

export default s;