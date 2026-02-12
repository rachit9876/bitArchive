export const getRepoParts = repo => {
  const [owner, name] = repo.split('/').map(part => part.trim());
  if (!owner || !name) return null;
  return { owner, name };
};

export const buildBaseUrl = config => {
  if (config.baseUrl) return config.baseUrl.replace(/\/$/, '') + '/';
  const parts = getRepoParts(config.repo);
  if (!parts) return '';
  return `https://raw.githubusercontent.com/${parts.owner}/${parts.name}/${config.branch}/public/`;
};

export const getExtensionFromUri = uri => {
  const match = uri.toLowerCase().match(/\.([a-z0-9]+)(\?|#|$)/);
  if (!match) return null;
  return match[1];
};

export const normalizeExtension = ext => {
  if (!ext) return null;
  const lower = ext.toLowerCase();
  if (lower === 'jpeg') return 'jpg';
  return lower;
};

export const getExtensionFromMime = mimeType => {
  if (!mimeType) return null;
  const parts = mimeType.split('/');
  if (parts.length !== 2) return null;
  return normalizeExtension(parts[1]);
};

export const getMimeFromExtension = ext => {
  if (!ext) return 'image/*';
  if (ext === 'jpg') return 'image/jpeg';
  return `image/${ext}`;
};

export const toDataUri = (base64, extension) => {
  const mime = getMimeFromExtension(extension);
  return `data:${mime};base64,${base64}`;
};
