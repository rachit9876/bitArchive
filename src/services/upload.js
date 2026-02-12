import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import CryptoJS from 'crypto-js';
import { Buffer } from 'buffer';
import { MAX_BYTES, SUPPORTED_EXTS } from '../constants';
import {
  getExtensionFromMime,
  getExtensionFromUri,
  normalizeExtension,
} from '../utils';
import {
  cacheBase64ToFile,
  cacheImageFromGithub,
  fileExists,
  githubRequest,
} from './github';

const getBase64FromUri = async uri => {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
};

const getFileSize = async uri => {
  const info = await FileSystem.getInfoAsync(uri);
  return info.size || 0;
};

const ensureFileUri = async (uri, extension) => {
  if (!uri.startsWith('content://')) return uri;
  const safeName = `share_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const ext = extension ? `.${extension}` : '';
  const target = `${FileSystem.cacheDirectory}${safeName}${ext}`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
};

const resolveExtension = (uri, mimeType) => {
  return (
    normalizeExtension(getExtensionFromUri(uri)) ||
    normalizeExtension(getExtensionFromMime(mimeType)) ||
    (mimeType && mimeType.startsWith('image/') ? 'jpg' : null)
  );
};

const payloadFromAsset = async asset => {
  const extension = resolveExtension(asset.fileName || asset.uri, asset.mimeType);
  if (!extension) throw new Error('Unable to infer file extension.');
  const uri = await ensureFileUri(asset.uri, extension);
  const base64 = asset.base64 || (await getBase64FromUri(uri));
  const size = asset.fileSize || (await getFileSize(uri));
  return { base64, extension, size };
};

export const buildFilenameFromPayload = ({ base64, extension }) => {
  const normalizedExtension = normalizeExtension(extension);
  const hash = CryptoJS.SHA256(base64).toString().slice(0, 12);
  return `${hash}.${normalizedExtension}`;
};

const isAlreadyExistsError = error => {
  const message = (error?.message || '').toLowerCase();
  if (
    message.includes('already exists') ||
    message.includes('exists') ||
    message.includes('sha wasn\'t supplied') ||
    message.includes('"sha" wasn\'t supplied')
  ) {
    return true;
  }
  if (Array.isArray(error?.errors)) {
    return error.errors.some(item => {
      const text = `${item?.code || ''} ${item?.message || ''}`.toLowerCase();
      return text.includes('exist') || text.includes('sha') || text.includes('update');
    });
  }
  return false;
};

export const uploadImageBase64 = async ({ base64, extension, size, config }) => {
  if (!SUPPORTED_EXTS.includes(extension)) {
    throw new Error('Unsupported file type.');
  }
  if (size > MAX_BYTES) {
    throw new Error('File exceeds 24MB limit.');
  }

  const filename = buildFilenameFromPayload({ base64, extension });
  const response = await githubRequest(config, `contents/public/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Add ${filename}`,
      content: base64,
      branch: config.branch,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 422 && isAlreadyExistsError(error)) {
      try {
        const localUri = await cacheImageFromGithub(config, filename, extension);
        return {
          image: {
            name: filename,
            url: localUri,
            localUri,
            sha: null,
            size,
            extension,
          },
          existed: true,
        };
      } catch {
        const existing = await fileExists(config, filename);
        if (existing) {
          const localUri = await cacheImageFromGithub(
            config,
            filename,
            extension,
            existing.sha
          );
          return {
            image: {
              name: filename,
              url: localUri,
              localUri,
              sha: existing.sha,
              size: existing.size || size,
              extension,
            },
            existed: true,
          };
        }
      }
    }
    throw new Error(error.message || 'Upload failed.');
  }

  const data = await response.json();
  const localUri = await cacheBase64ToFile(base64, filename, data.content?.sha, extension);
  return {
    image: {
      name: filename,
      url: localUri,
      localUri,
      sha: data.content?.sha,
      size,
      extension,
    },
    existed: false,
  };
};

export const pickImageFromLibrary = async onMessage => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    onMessage('Media library permission is required.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    base64: true,
    quality: 1,
    allowsMultipleSelection: true,
    selectionLimit: 0,
  });
  if (result.canceled) return null;
  const assets = result.assets || [];
  if (!assets.length) return null;
  return Promise.all(assets.map(payloadFromAsset));
};

export const pickImageFromCamera = async onMessage => {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    onMessage('Camera permission is required.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    base64: true,
    quality: 1,
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;

  return payloadFromAsset(asset);
};

export const payloadFromUri = async (uri, mimeType) => {
  const extension = resolveExtension(uri, mimeType);
  if (!extension) throw new Error('Unable to infer file extension.');
  const fileUri = await ensureFileUri(uri, extension);
  const base64 = await getBase64FromUri(fileUri);
  const size = await getFileSize(fileUri);
  return { base64, extension, size };
};

export const payloadFromRemoteUrl = async remoteUrl => {
  if (!remoteUrl.trim()) return null;
  const response = await fetch(remoteUrl.trim());
  if (!response.ok) throw new Error('Failed to fetch remote image.');

  const arrayBuffer = await response.arrayBuffer();
  const bytes = arrayBuffer.byteLength;
  if (bytes > MAX_BYTES) throw new Error('File exceeds 24MB limit.');

  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const extension = normalizeExtension(
    getExtensionFromUri(remoteUrl) || getExtensionFromMime(response.headers.get('content-type'))
  );
  if (!extension) throw new Error('Unable to infer file extension.');

  return { base64, extension, size: bytes };
};
