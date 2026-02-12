import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  galleryWrap: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  form: {
    padding: 16,
    gap: 12,
  },
  title: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  topSpacing: {
    marginTop: 12,
  },
  cardSpacing: {
    marginBottom: 16,
  },
  progressRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    marginTop: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
  imageRow: {
    marginTop: 12,
  },
  skeletonList: {
    marginTop: 12,
    gap: 12,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeleton: {
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    width: '80%',
  },
  skeletonLineShort: {
    height: 12,
    borderRadius: 6,
    width: '50%',
    marginTop: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imageInfo: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  grid: {
    padding: 4,
  },
  gridItem: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  chip: {
    marginRight: 12,
  },
  /* ---------- Bottom Tab Bar ---------- */
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(207,188,255,0.15)',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  /* ---------- Search Bar ---------- */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    fontSize: 14,
  },
  sortChip: {
    height: 32,
  },
  /* ---------- Upload Tab ---------- */
  uploadTab: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  uploadCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  uploadCardContent: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  uploadCardLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadCardHint: {
    fontSize: 12,
    opacity: 0.5,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  uploadGridItem: {
    flex: 1,
    minWidth: '45%',
  },
  /* ---------- Overlay spinner ---------- */
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,13,23,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  uploadOverlayText: {
    color: '#EDDCFF',
    fontSize: 14,
    fontWeight: '600',
  },
  /* ---------- Image Info in Viewer ---------- */
  imageMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  imageMeta: {
    color: 'rgba(207,188,255,0.7)',
    fontSize: 12,
  },
  /* ---------- Dialogs ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlDialog: {
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    gap: 16,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  /* ---------- Image Viewer Modal ---------- */
  modal: {
    flex: 1,
    backgroundColor: 'rgba(15,13,23,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalPager: {
    flexGrow: 0,
  },
  modalImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '90%',
    height: '100%',
    borderRadius: 16,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  /* ---------- Empty State ---------- */
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.7,
  },
  emptyHint: {
    fontSize: 13,
    opacity: 0.45,
    textAlign: 'center',
    lineHeight: 20,
  },
  /* ---------- Stats Row ---------- */
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.6,
  },
});

export default styles;
