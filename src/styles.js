import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0e16',
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
    marginTop: 8,
    opacity: 0.7,
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
    backgroundColor: 'rgba(0,0,0,0.12)',
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
    padding: 8,
    gap: 8,
  },
  gridItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  segmented: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  chip: {
    marginRight: 12,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2153ff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 32,
  },
  fabGroup: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    gap: 12,
    alignItems: 'flex-end',
  },
  fabSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2153ff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabIconSmall: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    gap: 16,
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
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
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
});

export default styles;
