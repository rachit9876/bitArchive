import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { SUPPORTED_EXTS } from '../constants';
import {
  getExtensionFromUri,
  getRepoParts,
  normalizeExtension,
  toDataUri,
} from '../utils';

const withBranchRef = (path, config) => {
  if (!config?.branch) return path;
  const joiner = path.includes('?') ? '&' : '?';
  return `${path}${joiner}ref=${encodeURIComponent(config.branch)}`;
};

const getGithubApiUrl = (config, path) => {
  const parts = getRepoParts(config.repo);
  if (!parts) throw new Error('Invalid repo format. Use username/repo.');
  return `https://api.github.com/repos/${parts.owner}/${parts.name}/${path}`;
};

const CACHE_DIR = `${FileSystem.documentDirectory}cdn_cache/`;

const ensureCacheDir = async () => {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
  return CACHE_DIR;
};

const getCachePath = (filename, sha, extension) => {
  const base = (sha || filename).replace(/[^a-z0-9._-]/gi, '_');
  const ext = extension || normalizeExtension(getExtensionFromUri(filename));
  const suffix = ext && !base.endsWith(`.${ext}`) ? `.${ext}` : '';
  return `${CACHE_DIR}${base}${suffix}`;
};

const mapWithConcurrency = async (items, worker, concurrency = 6) => {
  if (!items.length) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current], current);
    }
  };

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
  return results;
};

export const githubRequest = async (config, path, options = {}) => {
  const url = getGithubApiUrl(config, path);
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${config.token}`,
      ...(options.headers || {}),
    },
  });

  if (response.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error('GitHub rate limit reached. Try again later.');
  }

  return response;
};

const fetchImageDataUri = async (config, filename, extension) => {
  const response = await githubRequest(
    config,
    withBranchRef(`contents/public/${filename}`, config),
    {
      headers: { Accept: 'application/vnd.github.raw' },
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to load image.');
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return toDataUri(base64, extension);
};

export const cacheBase64ToFile = async (base64, filename, sha, extension) => {
  if (Platform.OS === 'web') {
    const ext = extension || normalizeExtension(getExtensionFromUri(filename));
    return toDataUri(base64, ext);
  }

  const cachePath = getCachePath(filename, sha, extension);
  await ensureCacheDir();
  const info = await FileSystem.getInfoAsync(cachePath);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(cachePath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  return cachePath;
};

export const ensureNoMedia = async () => {
  if (Platform.OS !== 'android') return;
  await ensureCacheDir();
  const marker = `${CACHE_DIR}.nomedia`;
  const info = await FileSystem.getInfoAsync(marker);
  if (!info.exists) {
    await FileSystem.writeAsStringAsync(marker, '');
  }
};

export const cacheImageFromGithub = async (config, filename, extension, sha) => {
  if (Platform.OS === 'web') {
    return fetchImageDataUri(config, filename, extension);
  }

  const cachePath = getCachePath(filename, sha, extension);
  await ensureCacheDir();
  const info = await FileSystem.getInfoAsync(cachePath);
  if (info.exists) return cachePath;

  const url = getGithubApiUrl(config, withBranchRef(`contents/public/${filename}`, config));
  try {
    const result = await FileSystem.downloadAsync(url, cachePath, {
      headers: {
        Accept: 'application/vnd.github.raw',
        Authorization: `token ${config.token}`,
      },
    });
    return result.uri;
  } catch (error) {
    return fetchImageDataUri(config, filename, extension);
  }
};

export const fileExists = async (config, filename) => {
  const response = await githubRequest(
    config,
    withBranchRef(`contents/public/${filename}`, config)
  );
  if (response.status === 200) return response.json();
  if (response.status === 404) return null;
  const error = await response.json();
  throw new Error(error.message || 'Failed to check file.');
};

export const listPublicImages = async config => {
  const response = await githubRequest(config, withBranchRef('contents/public', config));
  if (response.status === 404) return [];
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list images.');
  }
  const data = await response.json();
  if (!Array.isArray(data)) return [];

  const candidates = data
    .filter(item => item.type === 'file')
    .map(item => ({
      ...item,
      extension: normalizeExtension(getExtensionFromUri(item.name)),
    }))
    .filter(item => SUPPORTED_EXTS.includes(item.extension));

  const images = await mapWithConcurrency(
    candidates,
    async item => {
      const displayUrl = await cacheImageFromGithub(
        config,
        item.name,
        item.extension,
        item.sha
      );
      return {
        name: item.name,
        url: displayUrl,
        localUri: displayUrl,
        sha: item.sha,
        size: item.size,
        extension: item.extension,
      };
    },
    4
  );

  return images;
};
