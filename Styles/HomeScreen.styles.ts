import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f2de',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ─── Hero / Carousel ──────────────────────────────────────────────────────
  heroGradient: {
    flex: 1,
    position: 'relative',
  },
  carouselContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  welcomeText: {
    color: '#e8ffd7',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  highlight: {
    color: '#c8f0a0',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    zIndex: 3,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  carouselDotActive: {
    backgroundColor: '#fff',
    width: 28,
    borderRadius: 4,
  },

  // ─── Action Buttons ───────────────────────────────────────────────────────
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButtonIcon: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    width: '100%',
    alignItems: 'center',
  },
  actionButtonTitle: {
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  actionButtonSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 14,
    textAlign: 'center',
  },

  // ─── News Section ─────────────────────────────────────────────────────────
  newsSection: {
    backgroundColor: '#f4faed',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#2e4420',
    letterSpacing: -0.2,
  },
  newsList: {
    gap: 8,
  },
  newsItem: {
    paddingVertical: 11,
    paddingHorizontal: 13,
    backgroundColor: '#e8f2de',
    borderRadius: 9,
    borderLeftWidth: 3,
    borderLeftColor: '#3d6b22',
  },
  newsItemContent: {
    flex: 1,
  },
  newsItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e4420',
    marginBottom: 4,
    lineHeight: 19,
  },
  newsItemSource: {
    fontSize: 11,
    color: '#7a9460',
    fontStyle: 'italic',
  },

  // ─── Community Section ────────────────────────────────────────────────────
  communitySection: {
    backgroundColor: '#f4faed',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  communityPreview: {
    gap: 12,
  },
  communityText: {
    fontSize: 13,
    color: '#4a6635',
    lineHeight: 20,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d6b22',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  communityButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ─── Forum Post Card ──────────────────────────────────────────────────────
  forumPostCard: {
    backgroundColor: '#eef7e6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  forumPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  forumPostUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forumPostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddeece',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#b8d4a4',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  forumPostAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2e4420',
  },
  forumCategoryBadge: {
    backgroundColor: '#ddeece',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#c8e0b0',
  },
  forumCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3d6b22',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  forumPostTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
    marginBottom: 5,
    lineHeight: 21,
  },
  forumPostContent: {
    fontSize: 13,
    color: '#4a6635',
    lineHeight: 19,
    marginBottom: 10,
  },
  forumPostImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#e2f0d4',
  },
  forumPostImage: {
    width: '100%',
    height: '50%',
  },
  moreImagesOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(30,50,20,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  moreImagesText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  forumPostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0edcd',
  },
  forumPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forumPostStatText: {
    fontSize: 13,
    color: '#5a8c35',
    marginLeft: 4,
    fontWeight: '600',
  },
  readMoreText: {
    fontSize: 12,
    color: '#3d6b22',
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ─── Avocado Benefits Section ─────────────────────────────────────────────
  benefitsSection: {
    backgroundColor: '#f4faed',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d4e9b8',
    ...Platform.select({
      ios: {
        shadowColor: '#2a4d10',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  avocadoIcon: {
    fontSize: 24,
  },
  benefitsGrid: {
    gap: 10,
  },
  benefitCard: {
    backgroundColor: '#e8f2de',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#3d6b22',
    borderWidth: 1,
    borderColor: '#d4e9b8',
  },
  benefitIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 9,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e4420',
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 12,
    color: '#4a6635',
    lineHeight: 18,
  },
});