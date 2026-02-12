import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import * as Sharing from 'expo-sharing';
import ShareMenu from 'react-native-share-menu';
import GalleryScreen from './src/screens/GalleryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SetupScreen from './src/screens/SetupScreen';
import ZoomableImage from './src/components/ZoomableImage';
import { CameraIcon, ClipboardIcon, LinkIcon, ImageIcon, EyeIcon, EyeOffIcon } from './src/components/Icons';
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
  uploadImageBase64,
} from './src/services/upload';
import styles from './src/styles';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2153ff',
    background: '#f5f6fb',
    surface: '#ffffff',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7fa6ff',
    background: '#0b0e16',
    surface: '#151a26',
  },
};

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
  const [imagesVisible, setImagesVisible] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [snackbar, setSnackbar] = useState('');
  const [pendingShare, setPendingShare] = useState(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const selectedImage =
    selectedIndex !== null ? images[selectedIndex] || null : null;

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

  const requestRefreshImages = useCallback(() => {
    if (!config) return;
    Alert.alert(
      'Refresh images',
      'Load the latest images from GitHub? This makes API requests and may count toward rate limits.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Load', onPress: () => refreshImages() },
      ]
    );
  }, [config, refreshImages]);

  const handleAddImage = useCallback(image => {
    setImages(prev => [image, ...prev]);
  }, []);

  const uploadPayloads = useCallback(
    async payloads => {
      let uploaded = 0;
      let existed = 0;
      for (const item of payloads) {
        const result = await uploadImageBase64({ ...item, config });
        handleAddImage(result.image);
        uploaded += 1;
        if (result.existed) existed += 1;
      }
      return { uploaded, existed };
    },
    [config, handleAddImage]
  );

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
    } catch (error) {
      showMessage(error.message || 'Upload failed.');
    }
  }, [config, showMessage, uploadPayloads]);

  const handleCamera = useCallback(async () => {
    if (!config) return;
    try {
      const { pickImageFromCamera } = await import('./src/services/upload');
      const payload = await pickImageFromCamera(showMessage);
      if (!payload) return;
      const { uploaded, existed } = await uploadPayloads([payload]);
      showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
    } catch (error) {
      showMessage(error.message || 'Upload failed.');
    }
  }, [config, showMessage, uploadPayloads]);

  const handlePaste = useCallback(async () => {
    if (!config) return;
    try {
      const Clipboard = await import('expo-clipboard');

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
  }, [config, showMessage, uploadPayloads]);

  const handleUrlUpload = useCallback(async () => {
    if (!config || !remoteUrl.trim()) return;
    try {
      const { payloadFromRemoteUrl } = await import('./src/services/upload');
      const payload = await payloadFromRemoteUrl(remoteUrl);
      if (payload) {
        const { uploaded, existed } = await uploadPayloads([payload]);
        showMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
      }
      setShowUrlDialog(false);
      setRemoteUrl('');
    } catch (error) {
      showMessage(error.message || 'Upload failed.');
    }
  }, [config, remoteUrl, showMessage, uploadPayloads]);

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
  }, [config, showMessage, uploadPayloads]);

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
  }, [config, pendingShare, showMessage, uploadPayloads]);

  useEffect(() => {
    if (selectedIndex === null) return;
    if (selectedIndex >= images.length) {
      setSelectedIndex(images.length ? images.length - 1 : null);
    }
  }, [images.length, selectedIndex]);

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
    [config, showMessage]
  );

  const storageUsage = useMemo(() => {
    const total = images.reduce((sum, image) => sum + (image.size || 0), 0);
    const mb = (total / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  }, [images]);

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
                <ActivityIndicator />
                <Text style={styles.hint}>Loading configuration...</Text>
              </View>
            </SafeAreaView>
          </SafeAreaProvider>
        </PaperProvider>
      </GestureHandlerRootView>
    );
  }

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <SafeAreaView
            style={[styles.screen, { backgroundColor: theme.colors.background }]}
            edges={['top', 'bottom']}
          >
            <Appbar.Header>
              <Appbar.Content title="GitHub CDN" />
              <Chip mode="outlined" style={styles.chip}>
                {config.repo}
              </Chip>
            </Appbar.Header>
            <SegmentedButtons
              value={screen}
              onValueChange={setScreen}
              buttons={[
                { value: 'gallery', label: 'Gallery' },
                { value: 'settings', label: 'Settings' },
              ]}
              style={styles.segmented}
            />
            <View style={styles.content}>
              {screen === 'gallery' && (
                <View style={styles.galleryWrap}>
                  <GalleryScreen
                    images={imagesVisible ? images : []}
                    refreshing={loadingImages}
                    onRefresh={requestRefreshImages}
                    onOpen={image => {
                      const index = images.findIndex(item => item.name === image.name);
                      setSelectedIndex(index >= 0 ? index : 0);
                    }}
                  />
                  <View style={styles.fabGroup}>
                    <Pressable style={styles.fabSmall} onPress={() => setImagesVisible(!imagesVisible)}>
                      {imagesVisible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                    </Pressable>
                    <Pressable style={styles.fabSmall} onPress={handleCamera}>
                      <CameraIcon size={20} />
                    </Pressable>
                    <Pressable style={styles.fabSmall} onPress={handlePaste}>
                      <ClipboardIcon size={20} />
                    </Pressable>
                    <Pressable style={styles.fabSmall} onPress={() => setShowUrlDialog(true)}>
                      <LinkIcon size={20} />
                    </Pressable>
                    <Pressable style={styles.fabSmall} onPress={handleQuickAdd}>
                      <ImageIcon size={20} />
                    </Pressable>
                  </View>
                </View>
              )}
              {screen === 'settings' && (
                <SettingsScreen
                  config={config}
                  onUpdate={handleUpdateConfig}
                  onClear={handleClearConfig}
                  storageUsage={storageUsage}
                  onMessage={showMessage}
                />
              )}
            </View>
            <Modal visible={showUrlDialog} transparent animationType="fade">
              <Pressable style={styles.modalOverlay} onPress={() => setShowUrlDialog(false)}>
                <Pressable style={styles.urlDialog} onPress={e => e.stopPropagation()}>
                  <Text style={styles.dialogTitle}>Enter Image URL</Text>
                  <TextInput
                    mode="outlined"
                    value={remoteUrl}
                    onChangeText={setRemoteUrl}
                    placeholder="https://example.com/image.jpg"
                    autoCapitalize="none"
                    autoFocus
                  />
                  <View style={styles.dialogActions}>
                    <Button mode="outlined" onPress={() => { setShowUrlDialog(false); setRemoteUrl(''); }}>
                      Cancel
                    </Button>
                    <Button mode="contained" onPress={handleUrlUpload}>
                      Upload
                    </Button>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
            <Modal visible={selectedIndex !== null} transparent animationType="fade">
              <View style={styles.modal}>
                {selectedImage && (
                  <FlatList
                    data={images}
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
                        setSelectedIndex(current => (current === null ? 0 : current));
                      }, 50);
                    }}
                    onMomentumScrollEnd={event => {
                      const width = event.nativeEvent.layoutMeasurement.width;
                      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
                      setSelectedIndex(nextIndex);
                    }}
                    style={[styles.modalPager, { height: screenHeight * 0.7 }]}
                    renderItem={({ item }) => (
                      <View style={[styles.modalImageWrap, { width: screenWidth }]}>
                        <ZoomableImage
                          uri={item.url}
                          width={screenWidth}
                          height={screenHeight * 0.7}
                          onDismiss={() => setSelectedIndex(null)}
                        />
                      </View>
                    )}
                  />
                )}
                {selectedImage && (
                  <View style={styles.modalActions}>
                    <Button mode="outlined" onPress={() => setSelectedIndex(null)}>
                      Close
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={async () => {
                        if (await Sharing.isAvailableAsync()) {
                          const localUri = await ensureLocalUri(selectedImage);
                          if (!localUri) return;
                          await Sharing.shareAsync(localUri);
                        } else {
                          showMessage('Sharing is not available.');
                        }
                      }}
                    >
                      Share
                    </Button>
                    <Button mode="outlined" onPress={() => handleDelete(selectedImage)}>
                      Delete
                    </Button>
                  </View>
                )}
              </View>
            </Modal>
            <Snackbar visible={Boolean(snackbar)} onDismiss={() => setSnackbar('')} duration={3000}>
              {snackbar}
            </Snackbar>
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
