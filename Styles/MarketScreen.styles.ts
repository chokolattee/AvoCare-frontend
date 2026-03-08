import { StyleSheet, Platform } from 'react-native';

export const MAX_CONTENT_WIDTH = 1200;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f2de',
  },

  // ─── Outer scroll ───────────────────────────────────────────────────
  outerScroll: {
    flex: 1,
  },
  outerScrollContent: {
    flexGrow: 1,
  },

  // ─── Header ─────────────────────────────────────────────────────────
  headerBar: {
    backgroundColor: '#ddeece',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e0b0',
    paddingBottom: 16,
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
  headerInner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2e4420',
    letterSpacing: -0.3,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7aad4e',
    marginTop: 2,
  },
  headerCount: {
    fontSize: 15,
    color: '#3d6b22',
    fontWeight: '700',
  },

  // ─── Search + filter row ─────────────────────────────────────────────
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e2f0d4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
  },
  searchWrapFocused: {
    borderColor: '#7aad4e',
    backgroundColor: '#f4faed',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2e4420',
    padding: 0,
    margin: 0,
  },

  // ─── Category trigger ────────────────────────────────────────────────
  categoryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f7e8',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d4e9b8',
    minWidth: 90,
    maxWidth: 140,
  },
  categoryTriggerOpen: {
    backgroundColor: '#3d6b22',
    borderColor: '#3d6b22',
  },
  categoryTriggerText: {
    fontSize: 13,
    color: '#5a8c35',
    fontWeight: '600',
    flex: 1,
  },
  categoryTriggerTextOpen: {
    color: '#fff',
  },

  // ─── Dropdown panel ──────────────────────────────────────────────────
  dropdownPanel: {
    backgroundColor: '#f4faed',
    borderBottomWidth: 1,
    borderBottomColor: '#e0edcd',
    zIndex: 10,
  },
  dropdownPanelInner: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 6,
  },
  dropdownPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  dropdownPanelHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7aad4e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropdownCloseBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2f0d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownScrollView: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#daefc8',
  },
  dropdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d4e9b8',
  },
  dropdownDotActive: {
    backgroundColor: '#3d6b22',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#5a7040',
  },
  dropdownItemTextActive: {
    color: '#2e4420',
    fontWeight: '600',
  },
  dropdownCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3d6b22',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Feed / grid ─────────────────────────────────────────────────────
  feedWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
  },
  resultsBar: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 13,
    color: '#3d6b22',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  // ─── Card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#f4faed',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d4e9b8',
    flexDirection: 'column',
    // ← removed minHeight so card shrinks to fit content on mobile
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 5 },
    }),
  },
  cardImageWrap: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#d8edca',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  cardImagePlaceholderText: {
    fontSize: 11,
    color: '#a5c890',
  },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  // ─── Card body ───────────────────────────────────────────────────────
  cardBody: {
    padding: 10,
    // ← removed flex: 1 so body doesn't stretch beyond its content
  },

  // ─── Card text group ─────────────────────────────────────────────────
  cardTextGroup: {
    marginBottom: 8,
  },

  cardCategory: {
    fontSize: 11,
    color: '#7aad4e',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2e4420',
    lineHeight: 20,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#3d6b22',
  },
  stockBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: '#daefc8',
    borderRadius: 8,
  },
  stockBadgeOOS: {
    backgroundColor: '#f5d5d5',
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5a8c35',
  },
  stockTextOOS: {
    color: '#c0392b',
  },

  // ─── States ──────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: {
    color: '#7a9460',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#b83232',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5a8c35',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#a8c48a',
  },
});