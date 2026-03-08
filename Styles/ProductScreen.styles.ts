import { StyleSheet, Platform } from 'react-native';

// ─── Palette (same as AboutScreen, DashboardScreen, UsersScreen, ForumScreen, AnalysisScreen) ─
const C = {
  forest:     '#2d5016',
  sage:       '#3d6b22',
  sageMed:    '#5a8c35',
  sagePale:   '#d4ecb8',
  sageMid:    '#b0d890',
  sageTint:   '#e4f5d0',
  inkSoft:    '#2e4420',
  inkFaint:   '#6a8450',
  mist:       '#dff0cc',
  fog:        '#cce8b0',
  bg:         '#cce8a8',
  borderSoft: '#cce0a8',
  borderMid:  '#aed090',
  cardBg:     '#f0f9e4',
  white:      '#ffffff',

  // Semantic
  red:        '#ef4444',
};

export const styles = StyleSheet.create({

  // ── Container ─────────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: C.forest,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -0.6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  addButtonText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Header action row (PDF + refresh) ─────────────────────────────────────
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  pdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    gap: 8,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
      web:     { boxShadow: '0 2px 8px rgba(26,58,5,0.08)' } as any,
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.inkSoft,
    fontWeight: '500',
    padding: 0,
  },

  // ── Filters ───────────────────────────────────────────────────────────────
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  filterGroup: {
    marginBottom: 4,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
  },
  filterButton: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: C.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  filterButtonActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.inkFaint,
    letterSpacing: 0.1,
  },
  filterButtonTextActive: {
    color: C.white,
  },

  // ── Scroll / Loading / Empty ───────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: C.inkFaint,
    fontWeight: '600',
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  tableContainer: {
    margin: 16,
    backgroundColor: C.cardBg,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10 },
      android: { elevation: 3 },
      web:     { boxShadow: '0 2px 12px rgba(26,58,5,0.09)' } as any,
    }),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.forest,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sageMid,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  tableBody: {
    backgroundColor: C.cardBg,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.borderSoft,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: C.cardBg,
  },
  tableRowEven: {
    backgroundColor: C.mist,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableCellName: {
    flex: 2,
    alignItems: 'flex-start',
  },
  tableCellText: {
    fontSize: 13,
    color: C.inkSoft,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Thumbnail ─────────────────────────────────────────────────────────────
  thumbnailImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.borderSoft,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  thumbnailPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.mist,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },

  outOfStockValue: {
    color: C.red,
    fontWeight: '700',
  },

  // ── Status badge ──────────────────────────────────────────────────────────
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusText: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Actions cell ──────────────────────────────────────────────────────────
  actionsCell: {
    flex: 0.8,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Modal Overlay ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,58,5,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    width: '95%',
    maxHeight: '88%',
    borderWidth: 1.5,
    borderColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 10 },
      web:     { boxShadow: '0 8px 32px rgba(26,58,5,0.14)' } as any,
    }),
  },
  modalContentDesktop: {
    width: '60%',
    maxWidth: 680,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: C.borderSoft,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: C.inkSoft,
    letterSpacing: -0.3,
  },
  modalBody: {
    padding: 20,
  },

  // ── Form fields ───────────────────────────────────────────────────────────
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: C.inkFaint,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  required: {
    color: C.red,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addCategoryLink: {
    fontSize: 12,
    color: C.sage,
    fontWeight: '700',
  },
  addLink: {
    fontSize: 12,
    color: C.sage,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: C.inkSoft,
    backgroundColor: C.mist,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderColor: C.borderSoft,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: C.mist,
  },
  picker: {
    height: 45,
    color: C.inkSoft,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // ── Image picker ──────────────────────────────────────────────────────────
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.borderMid,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    gap: 6,
    backgroundColor: C.mist,
  },
  imagePickerText: {
    fontSize: 13,
    color: C.sage,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    marginTop: 10,
  },
  imagePreview: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderMid,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: C.white,
    borderRadius: 10,
  },

  // ── Nutrition entries ─────────────────────────────────────────────────────
  nutritionEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  nutritionInput: {
    flex: 1,
    marginBottom: 0,
  },

  // ── Modal actions ─────────────────────────────────────────────────────────
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  saveButton: {
    backgroundColor: C.forest,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.2,
  },

  // ── Category Modal ────────────────────────────────────────────────────────
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,58,5,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoryModalContent: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1.5,
    borderColor: C.borderMid,
    ...Platform.select({
      ios:     { shadowColor: C.forest, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16 },
      android: { elevation: 10 },
      web:     { boxShadow: '0 8px 24px rgba(26,58,5,0.12)' } as any,
    }),
  },
  categoryModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.inkSoft,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  categoryModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});