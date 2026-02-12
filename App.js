import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import ShareMenu from 'react-native-share-menu';
import GalleryScreen from './src/screens/GalleryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SetupScreen from './src/screens/SetupScreen';
import UploadTab from './src/screens/UploadTab';
import ZoomableImage from './src/components/ZoomableImage';
import {
  CopyIcon,
  GearIcon,
  GridIcon,
  ImageIcon,
  SearchIcon,
  ShareIcon,
  SortIcon,
  TrashIcon,
  UploadIcon,
} from './src/components/Icons';
import useConfigStorage from './src/hooks/useConfigStorage';
import {
  cacheImageFromGithub,
  ensureNoMedia,
  githubRequest,
  listPublicImages,
} from './src/services/github';
import {
  payloadFromUri,
  pickImageFromLibrary,
  pickImageFromCamera,
  payloadFromRemoteUrl,
  uploadImageBase64,
} from './src/services/upload';
import { buildBaseUrl } from './src/utils';
import styles from './src/styles';

/* ─── Material 3 Expressive — Lavender ──────────────────── */

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7C5CBF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EDDCFF',
    onPrimaryContainer: '#2B0052',
    secondary: '#9A82DB',
    secondaryContainer: '#E8DEF8',
    onSecondaryContainer: '#1D192B',
    tertiary: '#B58DAE',
    tertiaryContainer: '#FFD8F4',
    background: '#F6F2FA',
    onBackground: '#1C1B1F',
    surface: '#FFFBFE',
    onSurface: '#1C1B1F',
    surfaceVariant: '#EDE7F3',
    onSurfaceVariant: '#49454F',
    outline: '#79747E',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#F3EDF7',
      level2: '#EDE8F2',
      level3: '#E8E0ED',
    },
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#CFBCFF',
    onPrimary: '#381E72',
    primaryContainer: '#4F378B',
    onPrimaryContainer: '#EDDCFF',
    secondary: '#CCC2DC',
    secondaryContainer: '#4A4458',
    onSecondaryContainer: '#E8DEF8',
    tertiary: '#EFB8C8',
    tertiaryContainer: '#633B48',
    background: '#0F0D17',
    onBackground: '#E6E1E5',
    surface: '#1A1723',
    onSurface: '#E6E1E5',
    surfaceVariant: '#23202E',
    onSurfaceVariant: '#CAC4D0',
    surfaceDisabled: '#E6E1E51F',
    outline: '#938F99',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: 'transparent',
      level1: '#1F1B2C',
      level2: '#242032',
      level3: '#292538',
    },
  },
};

/* ─── Bottom Tab Bar ──────────────────────────────────── */

const TAB_ITEMS = [
  { key: 'gallery', label: 'Gallery', Icon: GridIcon },
  { key: 'upload', label: 'Upload', Icon: UploadIcon },
  { key: 'settings', label: 'Settings', Icon: GearIcon },
];

function BottomTabBar({ active, onChange }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.surface,
          paddingBottom: Math.max(insets.bottom, 4),
        },
      ]}
    >
      {TAB_ITEMS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        const color = isActive ? theme.colors.primary : theme.colors.onSurface + '88';
        return (
          <Pressable
            key={key}
            style={styles.tabItem}
            onPress={() => onChange(key)}
            android_ripple={{ color: theme.colors.primary + '22', borderless: true }}
          >
            <Icon size={22} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ─── Main App ────────────────────────────────────────── */

export default function App() {
  const colorScheme = useColorScheme();
  const theme = useMemo(() => (colorScheme === 'dark' ? darkTheme : lightTheme), [colorScheme]);
  const { loadConfig, saveConfig, clearConfig } = useConfigStorage();
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [screen, setScreen] = useState('gallery');
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [snackbar, setSnackbar] = useState('');
  const [pendingShare, setPendingShare] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  /* ─── Derived state ──── */

  const filteredImages = useMemo(() => {
    let list = images;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(img => img.name.toLowerCase().includes(q));
    }
    if (sortOrder === 'oldest') {
      list = [...list].reverse();
    }
    return list;
  }, [images, searchQuery, sortOrder]);

  const selectedImage =
    selectedIndex !== null ? filteredImages[selectedIndex] || null : null;

  const storageUsage = useMemo(() => {
    const total = images.reduce((sum, image) => sum + (image.size || 0), 0);
    if (total < 1024) return `${total} B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / (1024 * 1024)).toFixed(2)} MB`;
  }, [images]);

  /* ─── Helpers ──── */

  const showMessage = message => {
    setSnackbar(message);
  };

  const refreshImages = useCallback(async () => {
    if (!config) return;
    setLoadingImages(true);
    try {
      const list = await listPublicImages(config);
      setImages(list);
    } catch (error) {
      showMessage(error.message || 'Failed to refresh images.');
    } finally {
      setLoadingImages(false);
    }
  }, [config]);

  const handleAddImage = useCallback(image => {
    setImages(prev => [image, ...prev]);
  }, []);

  const uploadPayloads = useCallback(
    async payloads => {
      let uploaded = 0;
      let existed = 0;
      setUploading(true);
      try {
        for (const item of payloads) {
          const result = await uploadImageBase64({ ...item, config });
          handleAddImage(result.image);
          uploaded += 1;
          if (result.existed) existed += 1;
        }
      } finally {
        setUploading(false);
      }
      return { uploaded, existed };
    },
    [config, handleAddImage]
  );

  /* ─── Upload handlers ──── */

  const handleQuickAdd = useCallback(async () => {
    if (!config) return;
    try {
      const payload = await pickImageFromLibrary(showMessage);
      if (!payload) return;
      const payloads = Array.isArray(payload) ? payload : [payload];
      const { uploaded, existed } = await uploadPayloads(payloads);
      if (uploaded > 1) {
        showMessage(
          existed
            ? `Uploaded ${uploaded}. ${existed} already existed.`
            : `Uploaded ${uploaded} images.`
        );
      } else {
        showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
      }
      setScreen('gallery');
    } catch (error) {
      showMessage(error.message || 'Upload failed.');
    }
  }, [config, uploadPayloads]);

  const handleCamera = useCallback(async () => {
    if (!config) return;
    try {
      const payload = await pickImageFromCamera(showMessage);
      if (!payload) return;
      const { uploaded, existed } = await uploadPayloads([payload]);
      showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
      setScreen('gallery');
    } catch (error) {
      showMessage(error.message || 'Upload failed.');
    }
  }, [config, uploadPayloads]);

  const handlePaste = useCallback(async () => {
    if (!config) return;
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.startsWith('http')) {
        setRemoteUrl(text);
        setShowUrlDialog(true);
        return;
      }

      try {
        const hasImage = await Clipboard.hasImageAsync();
        if (hasImage) {
          const image = await Clipboard.getImageAsync({ format: 'png' });
          if (image?.data) {
            const cleanBase64 = image.data.replace(/^data:image\/\w+;base64,/, '');
            const payload = { base64: cleanBase64, extension: 'png', size: Math.ceil(cleanBase64.length * 0.75) };
            const { uploaded, existed } = await uploadPayloads([payload]);
            showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
            setScreen('gallery');
            return;
          }
        }
      } catch (imgError) {
        console.log('Image paste error:', imgError);
      }

      showMessage('Clipboard does not contain an image or URL.');
    } catch (error) {
      showMessage(error.message || 'Paste failed.');
    }
  }, [config, uploadPayloads]);

  const handleUrlUpload = useCallback(async (url) => {
    const targetUrl = url || remoteUrl;
    if (!config || !targetUrl.trim()) return;
    try {
      const payload = await payloadFromRemoteUrl(targetUrl);
      if (payload) {
        const { uploaded, existed } = await uploadPayloads([payload]);
        showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
        setScreen('gallery');
      }
      setShowUrlDialog(false);
      setRemoteUrl('');
    } catch (error) {
      showMessage(error.message || 'Upload failed.');
    }
  }, [config, remoteUrl, uploadPayloads]);

  /* ─── Share intent ──── */

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const handleShare = async share => {
      if (!share?.data) return;
      const mimeType = share.mimeType || share.type || '';
      if (mimeType && !mimeType.startsWith('image/')) {
        showMessage('Only images are supported.');
        return;
      }
      const items = Array.isArray(share.data) ? share.data : [share.data];
      if (!config) {
        setPendingShare({ items, mimeType });
        showMessage('Finish setup to receive shared images.');
        return;
      }
      const payloads = await Promise.all(
        items.map(uri => payloadFromUri(uri, mimeType))
      );
      const { uploaded, existed } = await uploadPayloads(payloads);
      if (uploaded > 1) {
        showMessage(
          existed
            ? `Uploaded ${uploaded}. ${existed} already existed.`
            : `Uploaded ${uploaded} images.`
        );
      } else {
        showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
      }
      setScreen('gallery');
    };

    ShareMenu.getInitialShare(handleShare);
    const listener = ShareMenu.addNewShareListener(handleShare);
    return () => listener?.remove();
  }, [config, uploadPayloads]);

  useEffect(() => {
    if (!config || !pendingShare) return;
    const { items, mimeType } = pendingShare;
    const run = async () => {
      try {
        const payloads = await Promise.all(
          items.map(uri => payloadFromUri(uri, mimeType))
        );
        const { uploaded, existed } = await uploadPayloads(payloads);
        if (uploaded > 1) {
          showMessage(
            existed
              ? `Uploaded ${uploaded}. ${existed} already existed.`
              : `Uploaded ${uploaded} images.`
          );
        } else {
          showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
        }
        setScreen('gallery');
      } catch (error) {
        showMessage(error.message || 'Upload failed.');
      } finally {
        setPendingShare(null);
      }
    };
    run();
  }, [config, pendingShare, uploadPayloads]);

  /* ─── Index safety ──── */

  useEffect(() => {
    if (selectedIndex === null) return;
    if (selectedIndex >= filteredImages.length) {
      setSelectedIndex(filteredImages.length ? filteredImages.length - 1 : null);
    }
  }, [filteredImages.length, selectedIndex]);

  /* ─── Delete ──── */

  const handleDelete = useCallback(
    image => {
      Alert.alert('Delete image', 'This will remove the file from GitHub.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await githubRequest(config, `contents/public/${image.name}`, {
                method: 'DELETE',
                body: JSON.stringify({
                  message: `Delete ${image.name}`,
                  sha: image.sha,
                  branch: config.branch,
                }),
              });
              if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Delete failed.');
              }
              setImages(prev => prev.filter(item => item.name !== image.name));
              setSelectedIndex(null);
              showMessage('Deleted.');
            } catch (error) {
              showMessage(error.message || 'Delete failed.');
            }
          },
        },
      ]);
    },
    [config]
  );

  /* ─── Copy URL ──── */

  const handleCopyUrl = useCallback(
    async image => {
      if (!image) return;
      const base = buildBaseUrl(config);
      const url = `${base}${image.name}`;
      await Clipboard.setStringAsync(url);
      showMessage('URL copied to clipboard.');
    },
    [config]
  );

  /* ─── Local URI ──── */

  const ensureLocalUri = useCallback(
    async image => {
      if (!image) return null;
      if (image.localUri) return image.localUri;
      try {
        const uri = await cacheImageFromGithub(config, image.name, image.extension, image.sha);
        return uri;
      } catch (error) {
        showMessage(error.message || 'Failed to load image.');
        return null;
      }
    },
    [config]
  );

  /* ─── File size formatter ──── */

  const formatSize = size => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  /* ─── Config lifecycle ──── */

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await loadConfig();
        if (stored) {
          setConfig(stored);
        }
      } finally {
        setConfigLoading(false);
      }
    };
    load();
  }, [loadConfig]);

  useEffect(() => {
    if (config) {
      refreshImages();
    }
  }, [config]);

  useEffect(() => {
    ensureNoMedia();
  }, []);

  const handleCompleteSetup = async nextConfig => {
    setConfig(nextConfig);
    await saveConfig(nextConfig);
  };

  const handleUpdateConfig = async nextConfig => {
    setConfig(nextConfig);
    await saveConfig(nextConfig);
    showMessage('Configuration saved.');
  };

  const handleClearConfig = async () => {
    await clearConfig();
    setConfig(null);
    setImages([]);
  };

  /* ─── Loading ──── */

  if (configLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <SafeAreaView
              style={[styles.screen, { backgroundColor: theme.colors.background }]}
              edges={['top', 'bottom']}
            >
              <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" />
                <Text style={styles.hint}>Loading configuration…</Text>
              </View>
            </SafeAreaView>
          </SafeAreaProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  /* ─── Setup ──── */

  if (!config) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <SafeAreaView
              style={[styles.screen, { backgroundColor: theme.colors.background }]}
              edges={['top', 'bottom']}
            >
              <SetupScreen onComplete={handleCompleteSetup} onMessage={showMessage} />
              <Snackbar
                visible={Boolean(snackbar)}
                onDismiss={() => setSnackbar('')}
                duration={3000}
              >
                {snackbar}
              </Snackbar>
            </SafeAreaView>
          </SafeAreaProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

  /* ─── Main UI ──── */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <SafeAreaView
            style={[styles.screen, { backgroundColor: theme.colors.background }]}
            edges={[]}
          >
            {/* ─ Header ─ */}
            <Appbar.Header style={{ height: 48 }}>
              <Appbar.Content
                title="Bit Archive"
                titleStyle={{ fontWeight: '700', fontSize: 17 }}
              />
              <Text style={{ fontSize: 11, opacity: 0.5, marginRight: 16 }}>
                {images.length} image{images.length !== 1 ? 's' : ''} · {storageUsage}
              </Text>
              {screen === 'gallery' && (
                <Appbar.Action
                  icon={() => <SearchIcon size={20} color={theme.colors.onSurface + (showSearch ? 'ff' : '99')} />}
                  onPress={() => {
                    setShowSearch(prev => !prev);
                    if (showSearch) setSearchQuery('');
                  }}
                />
              )}
            </Appbar.Header>

            {/* ─ Search & Sort (gallery only) ─ */}
            {screen === 'gallery' && showSearch && (
              <View
                style={[
                  styles.searchRow,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <SearchIcon size={18} color={theme.colors.onSurface + '77'} />
                <TextInput
                  mode="flat"
                  placeholder="Search images…"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  dense
                  autoFocus
                  underlineColor="transparent"
                  activeUnderlineColor={theme.colors.primary}
                  onBlur={() => {
                    if (!searchQuery.trim()) setShowSearch(false);
                  }}
                  style={[
                    styles.searchInput,
                    { backgroundColor: 'transparent' },
                  ]}
                />
                <Pressable
                  onPress={() =>
                    setSortOrder(prev => (prev === 'newest' ? 'oldest' : 'newest'))
                  }
                  android_ripple={{ color: theme.colors.primary + '22', borderless: true }}
                >
                  <Chip
                    mode="outlined"
                    compact
                    style={styles.sortChip}
                    icon={() => (
                      <SortIcon size={14} color={theme.colors.onSurface + 'aa'} />
                    )}
                  >
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </Chip>
                </Pressable>
              </View>
            )}

            {/* ─ Content ─ */}
            <View style={styles.content}>
              {screen === 'gallery' && (
                <GalleryScreen
                  images={filteredImages}
                  refreshing={loadingImages}
                  onRefresh={refreshImages}
                  onOpen={image => {
                    const index = filteredImages.findIndex(
                      item => item.name === image.name
                    );
                    setSelectedIndex(index >= 0 ? index : 0);
                  }}
                />
              )}
              {screen === 'upload' && (
                <UploadTab
                  uploading={uploading}
                  onPickGallery={handleQuickAdd}
                  onCamera={handleCamera}
                  onPaste={handlePaste}
                  onUrlSubmit={handleUrlUpload}
                />
              )}
              {screen === 'settings' && (
                <SettingsScreen
                  config={config}
                  onUpdate={handleUpdateConfig}
                  onClear={handleClearConfig}
                  storageUsage={storageUsage}
                  imageCount={images.length}
                  onMessage={showMessage}
                />
              )}
            </View>

            {/* ─ Bottom Tab Bar ─ */}
            <BottomTabBar active={screen} onChange={setScreen} />

            {/* ─ URL Dialog ─ */}
            <Modal visible={showUrlDialog} transparent animationType="fade">
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setShowUrlDialog(false)}
              >
                <Pressable
                  style={[
                    styles.urlDialog,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  onPress={e => e.stopPropagation()}
                >
                  <Text
                    style={[styles.dialogTitle, { color: theme.colors.onSurface }]}
                  >
                    Enter Image URL
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={remoteUrl}
                    onChangeText={setRemoteUrl}
                    placeholder="https://example.com/image.jpg"
                    autoCapitalize="none"
                    autoFocus
                  />
                  <View style={styles.dialogActions}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowUrlDialog(false);
                        setRemoteUrl('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button mode="contained" onPress={() => handleUrlUpload()}>
                      Upload
                    </Button>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* ─ Image Viewer Modal ─ */}
            <Modal
              visible={selectedIndex !== null}
              transparent
              animationType="fade"
            >
              <View style={styles.modal}>
                {selectedImage && (
                  <>
                    <FlatList
                      data={filteredImages}
                      horizontal
                      pagingEnabled
                      initialScrollIndex={selectedIndex}
                      keyExtractor={item => item.name}
                      getItemLayout={(_, index) => ({
                        length: screenWidth,
                        offset: screenWidth * index,
                        index,
                      })}
                      onScrollToIndexFailed={() => {
                        setTimeout(() => {
                          setSelectedIndex(current =>
                            current === null ? 0 : current
                          );
                        }, 50);
                      }}
                      onMomentumScrollEnd={event => {
                        const width =
                          event.nativeEvent.layoutMeasurement.width;
                        const nextIndex = Math.round(
                          event.nativeEvent.contentOffset.x / width
                        );
                        setSelectedIndex(nextIndex);
                      }}
                      style={[styles.modalPager, { height: screenHeight * 0.65 }]}
                      renderItem={({ item }) => (
                        <View
                          style={[styles.modalImageWrap, { width: screenWidth }]}
                        >
                          <ZoomableImage
                            uri={item.url}
                            width={screenWidth}
                            height={screenHeight * 0.65}
                            onDismiss={() => setSelectedIndex(null)}
                          />
                        </View>
                      )}
                    />
                    {/* Image info */}
                    <View style={styles.imageMetaRow}>
                      <Text style={styles.imageMeta}>{selectedImage.name}</Text>
                      {selectedImage.size > 0 && (
                        <Text style={styles.imageMeta}>
                          {formatSize(selectedImage.size)}
                        </Text>
                      )}
                      {selectedImage.extension && (
                        <Text style={styles.imageMeta}>
                          {selectedImage.extension.toUpperCase()}
                        </Text>
                      )}
                    </View>
                    {/* Actions */}
                    <View style={styles.modalActions}>
                      <Button
                        mode="outlined"
                        textColor="#CFBCFF"
                        onPress={() => setSelectedIndex(null)}
                        icon={() => <Text style={{ color: '#CFBCFF' }}>✕</Text>}
                      >
                        Close
                      </Button>

                      <Button
                        mode="outlined"
                        textColor="#CFBCFF"
                        onPress={async () => {
                          if (await Sharing.isAvailableAsync()) {
                            const localUri =
                              await ensureLocalUri(selectedImage);
                            if (!localUri) return;
                            await Sharing.shareAsync(localUri);
                          } else {
                            showMessage('Sharing is not available.');
                          }
                        }}
                        icon={() => <ShareIcon size={16} color="#CFBCFF" />}
                      >
                        Share
                      </Button>
                      <Button
                        mode="outlined"
                        textColor="#F2B8B5"
                        onPress={() => handleDelete(selectedImage)}
                        icon={() => <TrashIcon size={16} color="#F2B8B5" />}
                      >
                        Delete
                      </Button>
                    </View>
                  </>
                )}
              </View>
            </Modal>

            {/* ─ Snackbar ─ */}
            <Snackbar
              visible={Boolean(snackbar)}
              onDismiss={() => setSnackbar('')}
              duration={3000}
            >
              {snackbar}
            </Snackbar>
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
