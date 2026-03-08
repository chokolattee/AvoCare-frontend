import { StyleSheet, Platform } from 'react-native';

// ── Palette (Market / AvoCare brand) ───────────────────────
// Page bg:       #e8f2de  (light sage)
// Header bg:     #ddeece
// Card bg:       #f4faed  (pale sage)
// Image area:    #d8edca
// Accent green:  #7aad4e  (Market bright green)
// Dark btn:      #3d6b22  (Market primary action)
// Text primary:  #2e4420
// Text muted:    #3d6b22 / #7a9a60
// Border:        #d4e9b8

export const getStyles = (isWide: boolean) => StyleSheet.create({
  // ── Root ────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#e8f2de',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f2de',
    padding: 24,
  },

  // ── Web: full-screen scrollable wrapper with gap between panels
  webWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 20,           // gap between the two cards
  },

  // ── Web: left card (camera) ──────────────────────────────
  webLeftCard: {
    flex: 1,
    maxWidth: 520,
    backgroundColor: '#2e4420',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column',
    shadowColor: '#2a4d10',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
  },

  // ── Web: right card (results) ────────────────────────────
  webRightCard: {
    flex: 1,
    maxWidth: 520,
    backgroundColor: '#f4faed',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d4e9b8',
    shadowColor: '#2a4d10',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  webRightScroll: { flex: 1 },
  webRightContent: {
    padding: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },

  // ── Mobile layout ────────────────────────────────────────
  mobileScrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  mobileCameraSection: {
    backgroundColor: '#2e4420',
    // no border radius — full bleed like the reference screenshot
  },
  mobileResultsSection: {
    backgroundColor: '#f4faed',
    padding: 16,
  },

  // ── Camera area ──────────────────────────────────────────
  cameraArea: {
    width: '100%',
    height: isWide ? undefined : 440,
    flex: isWide ? 1 : undefined,
    backgroundColor: '#0a1508',
    position: 'relative',
    overflow: 'hidden',
    minHeight: isWide ? 280 : 380,
  },
  camera: { flex: 1, width: '100%', height: '100%' },
  frameOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10,
  },
  frameCorner: { position: 'absolute', width: 28, height: 28, borderColor: '#7aad4e' },
  topLeft:    { top: 28,    left: 28,  borderTopWidth: 2.5, borderLeftWidth: 2.5,  borderTopLeftRadius: 4 },
  topRight:   { top: 28,    right: 28, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 },
  bottomLeft: { bottom: 28, left: 28,  borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 },
  bottomRight:{ bottom: 28, right: 28, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute', left: 28, right: 28, height: 2,
    backgroundColor: '#7aad4e', opacity: 0.8, zIndex: 11, borderRadius: 1,
    shadowColor: '#7aad4e', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 6,
  },

  // Camera UI chrome
  cameraControls: { position: 'absolute', top: 16, right: 16, zIndex: 20 },
  controlButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(122,173,78,0.3)',
  },
  controlButtonActive: { backgroundColor: 'rgba(122,173,78,0.25)', borderColor: '#7aad4e' },
  closeButton: {
    position: 'absolute', top: 16, left: 16, width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
    zIndex: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  cameraStatus: {
    position: 'absolute', top: 70, left: 16, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, zIndex: 20, gap: 6,
  },
  cameraStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7aad4e' },
  cameraStatusText: { color: '#d4e9b8', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  // Mobile: title inside dark camera area (like screenshot)
  scanHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    paddingHorizontal: 20, paddingBottom: 16, zIndex: 15,
  },
  scanHeaderTitle: {
    fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: 0.1,
  },
  scanHeaderSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '400',
  },

  scanInstruction: {
    position: 'absolute', bottom: 88, left: 0, right: 0, textAlign: 'center',
    color: '#c8e0b0', fontSize: 13, fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.55)', paddingVertical: 10, zIndex: 20, letterSpacing: 0.3,
  },
  capturedImage: { flex: 1, width: '100%' },
  resetButton: {
    position: 'absolute', top: 16, right: 16, width: 40, height: 40,
    borderRadius: 20, backgroundColor: 'rgba(220,53,53,0.85)',
    justifyContent: 'center', alignItems: 'center', zIndex: 20,
  },

  // ── Placeholder (dark panel "tap to scan" idle state) ────
  placeholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#2e4420', padding: 28,
  },
  placeholderIcon: { fontSize: 72, marginBottom: 16 },
  placeholderTapHint: {
    fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: '500',
    letterSpacing: 0.3, marginTop: 8,
  },
  placeholderTitle: {
    fontSize: 20, fontWeight: '700', color: '#f4faed', marginBottom: 6, letterSpacing: 0.2,
  },
  placeholderText: {
    fontSize: 13, color: '#a8c48a', textAlign: 'center', maxWidth: 210, lineHeight: 19,
  },

  // ── Progress overlay ─────────────────────────────────────
  progressOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,21,8,0.92)', justifyContent: 'center', alignItems: 'center', zIndex: 30,
  },
  progressCard: {
    backgroundColor: '#2e4420', borderRadius: 20, padding: 28, alignItems: 'center',
    minWidth: 200, marginHorizontal: 24, borderWidth: 1, borderColor: 'rgba(122,173,78,0.25)',
  },
  progressText: { fontSize: 30, fontWeight: '800', color: '#7aad4e', marginTop: 16, letterSpacing: -1 },
  progressSubtext: {
    fontSize: 12, color: '#a8c48a', marginTop: 8, textAlign: 'center', paddingHorizontal: 8, lineHeight: 17,
  },
  progressTrack: {
    width: 160, height: 3, backgroundColor: 'rgba(122,173,78,0.15)',
    borderRadius: 2, overflow: 'hidden', marginTop: 14,
  },
  progressFill: { height: '100%', backgroundColor: '#7aad4e', borderRadius: 2 },

  // ── Action buttons ───────────────────────────────────────
  actionButtons: {
    padding: 12, backgroundColor: '#2e4420', alignItems: 'center', gap: 8,
  },
  // Mobile scanning: white pill "Upload From Gallery"
  uploadPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f4faed', borderRadius: 100,
    paddingVertical: 12, paddingHorizontal: 28, gap: 8,
    shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  uploadPillText: { color: '#2e4420', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  captureButton: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#d4e9b8',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7aad4e' },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, gap: 8, width: '100%',
  },
  primaryButton: { backgroundColor: '#3d6b22' },
  secondaryButton: {
    backgroundColor: 'rgba(122,173,78,0.12)', borderWidth: 1.5, borderColor: 'rgba(122,173,78,0.4)',
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
  secondaryButtonText: { color: '#7aad4e', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  instructions: {
    textAlign: 'center', color: '#a8c48a', fontSize: 12,
    paddingHorizontal: 16, marginTop: 2, lineHeight: 17, paddingBottom: 4,
  },

  // ── Permissions ──────────────────────────────────────────
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#2e4420', marginTop: 14, marginBottom: 8 },
  errorText: {
    fontSize: 13, color: '#3d6b22', textAlign: 'center',
    paddingHorizontal: 20, marginBottom: 16, lineHeight: 19,
  },
  permissionButton: { backgroundColor: '#3d6b22', paddingVertical: 13, paddingHorizontal: 32, borderRadius: 12 },
  permissionButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Empty state ──────────────────────────────────────────
  emptyResult: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, minHeight: 200,
  },
  emptyResultIcon: { fontSize: 48, marginBottom: 14, opacity: 0.22 },
  emptyResultText: {
    fontSize: 13, color: '#7aad4e', textAlign: 'center', lineHeight: 20, maxWidth: 220,
  },

  // ── Result card ──────────────────────────────────────────
  resultCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2,
    borderWidth: 1, borderColor: '#d4e9b8',
    shadowColor: '#2a4d10', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
  },
  gateBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3d6b22', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, marginBottom: 14, gap: 6,
  },
  gateBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  statusIndicator: { borderRadius: 14, padding: 18, marginBottom: 16, alignItems: 'center' },
  statusTitle: {
    fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6, letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  statusDescription: { fontSize: 13, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: 18 },
  rejectionDetails: {
    padding: 14, backgroundColor: '#fff3f3', borderRadius: 10, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#F44336',
  },
  rejectionConfidence: { fontSize: 13, color: '#c62828', textAlign: 'center', marginBottom: 5, fontWeight: '700' },
  rejectionHint: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 17 },
  infoCard: { marginBottom: 14 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#edf2e8',
  },
  infoLabel: { fontSize: 10, fontWeight: '700', color: '#7aad4e', letterSpacing: 0.8, textTransform: 'uppercase' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#2e4420' },
  confidenceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  confidenceLabel: { fontSize: 10, color: '#b0c8a0', fontWeight: '700', width: 100, textTransform: 'uppercase', letterSpacing: 0.5 },
  confidenceTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: '#e8f0e0' },
  confidenceFill: { height: '100%', borderRadius: 3 },
  confidenceValue: { fontSize: 12, fontWeight: '800', width: 42, textAlign: 'right' },
  probabilityCard: { backgroundColor: '#f4faed', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#d4e9b8' },
  probabilityTitle: { fontSize: 11, fontWeight: '700', color: '#3d6b22', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  probabilityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  probabilityLabel: { fontSize: 11, fontWeight: '600', color: '#333', width: 80, marginRight: 6, textTransform: 'capitalize' },
  probabilityBar: { flex: 1, height: 16, backgroundColor: '#e8f0e0', borderRadius: 8, overflow: 'hidden', marginRight: 6 },
  probabilityFill: { height: '100%', borderRadius: 8 },
  probabilityValue: { fontSize: 11, fontWeight: '700', color: '#555', width: 40, textAlign: 'right' },
  recommendationCard: {
    backgroundColor: '#f4faed', borderRadius: 12, padding: 14, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#3d6b22',
  },
  recommendationTitle: { fontSize: 11, fontWeight: '800', color: '#2e4420', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  recommendationText: { fontSize: 13, color: '#2e4420', lineHeight: 19 },
  sectionBanner: {
    backgroundColor: '#ddeece', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 12, gap: 8,
    borderWidth: 1, borderColor: '#c8e0b0',
  },
  sectionBannerText: { color: '#3d6b22', fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  detectionsContainer: { marginBottom: 14 },
  detectionsTitle: { fontSize: 12, fontWeight: '800', color: '#2e4420', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.7 },
  detectionCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderColor: '#e8f0e0',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  detectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  detectionNum: { fontSize: 13, fontWeight: '800', minWidth: 26 },
  detectionClass: { fontSize: 13, fontWeight: '700', flex: 1 },
  primaryBadge: { backgroundColor: '#ff9800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  confidenceBadgeText: { fontSize: 12, fontWeight: '800' },
  miniProbContainer: { marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f5ea' },
  miniProbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  miniProbLabel: { fontSize: 10, fontWeight: '700', color: '#3d6b22', width: 80, marginRight: 6, textTransform: 'capitalize' },
  miniProbBar: { flex: 1, height: 12, backgroundColor: '#daefc8', borderRadius: 6, overflow: 'hidden', marginRight: 6 },
  miniProbFill: { height: '100%', borderRadius: 6 },
  miniProbValue: { fontSize: 10, fontWeight: '800', color: '#2e4420', width: 32, textAlign: 'right' },
  miniRec: { backgroundColor: '#f4faed', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#d4e9b8' },
  miniRecTitle: { fontSize: 10, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniRecText: { color: '#2e4420', fontSize: 11, lineHeight: 16 },
  imageSaveNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f4faed', borderRadius: 8, padding: 8, marginBottom: 12,
    borderWidth: 1, borderColor: '#d4e9b8',
  },
  imageSaveNoteText: { fontSize: 11, color: '#7aad4e', fontStyle: 'italic' },
  buttonGroup: { gap: 10 },
  saveButton: { backgroundColor: '#3d6b22', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  scanAgainButton: {
    backgroundColor: '#f4faed', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#d4e9b8',
  },
  scanAgainButtonText: { color: '#3d6b22', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  benefitsCard: {
    backgroundColor: '#f4faed', borderRadius: 12, borderWidth: 1, borderColor: '#d4e9b8', padding: 14, marginTop: 12,
  },
  benefitsTitle: { fontSize: 13, fontWeight: '800', color: '#2e4420', marginBottom: 10, letterSpacing: 0.2 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  benefitBullet: { fontSize: 12, color: '#7aad4e', marginRight: 8, marginTop: 2 },
  benefitText: { flex: 1, fontSize: 12, color: '#2e4420', lineHeight: 17 },

  // ── Save Success Popup ───────────────────────────────────
  popupOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,20,8,0.65)',
    justifyContent: 'center', alignItems: 'center', zIndex: 100,
  },
  popupCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    marginHorizontal: 28, width: '100%', maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 20,
  },
  popupIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f4faed', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16, borderWidth: 3, borderColor: '#d4e9b8',
  },
  popupTitle: {
    fontSize: 20, fontWeight: '800', color: '#2e4420', marginBottom: 6, letterSpacing: 0.2,
  },
  popupSubtitle: {
    fontSize: 14, color: '#3d6b22', textAlign: 'center', lineHeight: 20, marginBottom: 24,
  },
  popupPrimaryBtn: {
    backgroundColor: '#3d6b22', borderRadius: 12, paddingVertical: 13,
    paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 10,
  },
  popupPrimaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
  popupSecondaryBtn: {
    paddingVertical: 10, paddingHorizontal: 20,
  },
  popupSecondaryBtnText: { color: '#7aad4e', fontSize: 13, fontWeight: '600' },

  // stubs
  scrollContent: { flexGrow: 1 },
  imageSection: { marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#3d6b22', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 },
  imageBox: { aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#daefc8', borderWidth: 1, borderColor: '#d4e9b8' },
  imageComparisonRow: { flexDirection: 'row', gap: 10 },
  imageComparisonItem: { flex: 1 },
  imageComparisonLabel: { fontSize: 10, fontWeight: '700', color: '#8aad70', marginBottom: 5, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.6 },
  comparisonImage: { width: '100%', height: '100%' },
  boundingBox: { position: 'absolute', borderWidth: 2.5, borderStyle: 'solid', backgroundColor: 'transparent' },
  detectionLabel: { position: 'absolute', top: -22, left: 0, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  detectionLabelText: { color: '#fff', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  detectionConfidenceText: { color: '#fff', fontSize: 8, fontWeight: '700', marginTop: 1 },
});