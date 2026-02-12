import React, { useCallback, useState } from 'react';
import { Image, ScrollView, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Text,
  TextInput,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import {
  payloadFromRemoteUrl,
  payloadFromUri,
  pickImageFromCamera,
  pickImageFromLibrary,
  uploadImageBase64,
} from '../services/upload';
import styles from '../styles';

const UploadScreen = ({
  config,
  images,
  onRefresh,
  onAddImage,
  onDelete,
  onMessage,
  onOpen,
  loadingImages,
}) => {
  const [uploading, setUploading] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');

  const pickFromLibrary = useCallback(async () => {
    return pickImageFromLibrary(onMessage);
  }, [onMessage]);

  const pickFromCamera = useCallback(async () => {
    return pickImageFromCamera(onMessage);
  }, [onMessage]);

  const pasteFromClipboard = useCallback(async () => {
    const image = await Clipboard.getImageAsync();
    if (image?.uri) {
      return payloadFromUri(image.uri);
    }

    const text = await Clipboard.getStringAsync();
    if (text && text.startsWith('http')) {
      setRemoteUrl(text);
      return null;
    }

    throw new Error('Clipboard does not contain an image or URL.');
  }, []);

  const uploadRemoteUrl = useCallback(async () => {
    return payloadFromRemoteUrl(remoteUrl);
  }, [remoteUrl]);

  const runUpload = useCallback(
    async handler => {
      try {
        setUploading(true);
        const payload = await handler();
        if (payload) {
          const payloads = Array.isArray(payload) ? payload : [payload];
          let uploaded = 0;
          let existed = 0;
          for (const item of payloads) {
            const result = await uploadImageBase64({ ...item, config });
            onAddImage(result.image);
            uploaded += 1;
            if (result.existed) existed += 1;
          }
          if (uploaded > 1) {
            onMessage(
              existed
                ? `Uploaded ${uploaded}. ${existed} already existed.`
                : `Uploaded ${uploaded} images.`
            );
          } else {
            onMessage(existed ? 'Already uploaded. Loaded from cache.' : 'Upload complete.');
          }
        }
      } catch (error) {
        if (error?.message) onMessage(error.message);
      } finally {
        setUploading(false);
      }
    },
    [config, onAddImage, onMessage]
  );

  return (
    <ScrollView contentContainerStyle={styles.form}>
      <Card style={styles.cardSpacing}>
        <Card.Title title="Upload" subtitle="Pick, paste, or fetch an image" />
        <Card.Content>
          <View style={styles.buttonRow}>
            <Button mode="contained" onPress={() => runUpload(pickFromLibrary)}>
              Gallery
            </Button>
            <Button mode="outlined" onPress={() => runUpload(pickFromCamera)}>
              Camera
            </Button>
            <Button mode="outlined" onPress={() => runUpload(pasteFromClipboard)}>
              Paste
            </Button>
          </View>
          <TextInput
            label="Remote image URL"
            mode="outlined"
            value={remoteUrl}
            onChangeText={setRemoteUrl}
            autoCapitalize="none"
          />
          <Button
            mode="contained-tonal"
            style={styles.topSpacing}
            onPress={() => runUpload(uploadRemoteUrl)}
          >
            Fetch & Upload
          </Button>
          <Text style={styles.hint}>Drag and drop is not supported on this platform.</Text>
          {uploading && (
            <View style={styles.progressRow}>
              <ActivityIndicator />
              <Text>Uploading...</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="Uploaded Images" />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={onRefresh}
            style={styles.topSpacing}
            loading={loadingImages}
            disabled={loadingImages}
          >
            Refresh
          </Button>
          <Divider style={styles.topSpacing} />
          {loadingImages && images.length === 0 ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`} style={styles.imageRow}>
                  <Card.Content style={styles.rowContent}>
                    <View style={[styles.thumbnail, styles.skeleton]} />
                    <View style={styles.imageInfo}>
                      <View style={[styles.skeletonLine, styles.skeleton]} />
                      <View style={[styles.skeletonLineShort, styles.skeleton]} />
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          ) : images.length === 0 ? (
            <Text style={styles.hint}>No uploads yet.</Text>
          ) : (
            images.map(image => (
              <Card key={image.name} style={styles.imageRow}>
                <Card.Content style={styles.rowContent}>
                  <Image source={{ uri: image.url }} style={styles.thumbnail} />
                  <View style={styles.imageInfo}>
                    <Text numberOfLines={1}>{image.name}</Text>
                    <View style={styles.actionRow}>
                      <Button mode="text" onPress={() => onOpen(image)}>
                        View
                      </Button>
                      <Button mode="text" onPress={() => onDelete(image)}>
                        Delete
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default UploadScreen;
