import { StyleSheet, Platform } from 'react-native';

// ─── Palette ──────────────────────────────────────────────────────────────────
// Deeper greens so the screen is visibly green, not white
const C = {
  forest:      '#2d5016',
  sage:        '#3d6b22',
  sageMed:     '#5a8c35',
  sagePale:    '#d4ecb8',   // deeper — was #e8f5dc
  sageMid:     '#b0d890',   // deeper — was #c8e8b0
  sageTint:    '#e4f5d0',   // deeper — was #f2fae9
  ink:         '#111a0a',
  inkSoft:     '#2e4420',
  inkFaint:    '#6a8450',
  mist:        '#dff0cc',   // noticeably green — was #f7faf3 (near white)
  fog:         '#cce8b0',   // deeper — was #eef3e8
  white:       '#ffffff',
  bg:          '#e8f2de',   // matches Community and Market screens
  headerBg:    '#bedd96',   // richer — was #ddeece
  border:      '#b8d898',
  borderSoft:  '#cce0a8',
  borderMid:   '#aed090',
  cardBg:      '#f0f9e4',   // card surfaces — light green, not white
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: C.bg,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroSection: {
    paddingVertical: 56,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: C.headerBg,
    borderBottomWidth: 1.5,
    borderBottomColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.sagePale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2.5,
    borderColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  logo: {
    width: 60,
    height: 60,
  },
  heroTitle: {
    fontWeight: '900',
    color: C.forest,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: C.inkSoft,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  heroDivider: {
    width: 48,
    height: 3,
    backgroundColor: C.sage,
    borderRadius: 2,
    marginTop: 20,
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    backgroundColor: C.bg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.sagePale,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '800',
    color: C.forest,
    letterSpacing: -0.3,
  },

  // ── Mission ───────────────────────────────────────────────────────────────
  missionText: {
    fontSize: 15,
    lineHeight: 26,
    color: C.inkSoft,
    marginBottom: 14,
    textAlign: 'justify',
    fontWeight: '400',
  },

  // ── Features ──────────────────────────────────────────────────────────────
  featuresSection: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    backgroundColor: C.mist,   // clearly green stripe
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  featureCard: {
    backgroundColor: C.cardBg,  // light green, not white
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.12)' } as any,
    }),
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.sagePale,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.inkSoft,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 13,
    color: C.inkFaint,
    lineHeight: 20,
    fontWeight: '400',
  },

  // ── Team ──────────────────────────────────────────────────────────────────
  teamSection: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    backgroundColor: C.bg,
  },
  teamIntro: {
    fontSize: 15,
    lineHeight: 24,
    color: C.inkSoft,
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
  },
  teamGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  memberCard: {
    backgroundColor: C.cardBg,  // light green, not white
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.12)' } as any,
    }),
  },
  memberImageContainer: {
    marginBottom: 14,
  },
  memberImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: C.borderMid,
    backgroundColor: C.sagePale,
  },
  memberImagePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.sagePale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: C.borderMid,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
    color: C.inkSoft,
    marginBottom: 4,
    textAlign: 'center',
  },
  memberRole: {
    fontSize: 13,
    color: C.sageMed,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  memberBio: {
    fontSize: 12,
    color: C.inkFaint,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    fontWeight: '500',
  },
  memberLinks: {
    flexDirection: 'row',
    gap: 10,
  },
  socialLink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.sagePale,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  contactSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: C.mist,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 24,
    color: C.inkSoft,
    marginBottom: 24,
    textAlign: 'center',
  },
  contactInfo: {
    gap: 16,
    alignItems: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.cardBg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: C.borderSoft,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  contactItemText: {
    fontSize: 15,
    color: C.sage,
    fontWeight: '500',
  },

  // ── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  modalContent: {
    backgroundColor: C.cardBg,
    width: '75%',
    maxWidth: 280,
    height: '100%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    borderBottomWidth: 1,
    borderBottomColor: C.borderMid,
    backgroundColor: C.sage,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    flex: 1,
    paddingTop: 8,
    backgroundColor: C.cardBg,
  },
  modalMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    gap: 12,
  },
  modalMenuText: {
    flex: 1,
    fontSize: 15,
    color: C.inkSoft,
    fontWeight: '600',
  },

  // ── Legacy ────────────────────────────────────────────────────────────────
  teamScrollContainer: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 10,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.sagePale,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2.5,
    borderColor: C.borderMid,
  },
});