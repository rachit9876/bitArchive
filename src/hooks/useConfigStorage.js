import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CONFIG_KEY, DUPLICATE_INDEX_KEY_PREFIX } from '../constants';

const getDuplicateIndexKey = repo => {
  const normalizedRepo = (repo || '').trim().toLowerCase();
  if (!normalizedRepo) return null;
  return `${DUPLICATE_INDEX_KEY_PREFIX}:${normalizedRepo}`;
};

const useConfigStorage = () => {
  const getItem = useCallback(async key => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  }, []);

  const setItem = useCallback(async (key, value) => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        return;
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }, []);

  const deleteItem = useCallback(async key => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        return;
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }, []);

  const loadConfig = useCallback(async () => {
    const raw = await getItem(CONFIG_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }, [getItem]);

  const saveConfig = useCallback(async config => {
    await setItem(CONFIG_KEY, JSON.stringify(config));
  }, [setItem]);

  const clearConfig = useCallback(async () => {
    await deleteItem(CONFIG_KEY);
  }, [deleteItem]);

  const loadDuplicateIndex = useCallback(async repo => {
    const key = getDuplicateIndexKey(repo);
    if (!key) return [];
    const raw = await getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(name => typeof name === 'string' && name.trim());
    } catch (error) {
      return [];
    }
  }, [getItem]);

  const saveDuplicateIndex = useCallback(async (repo, names) => {
    const key = getDuplicateIndexKey(repo);
    if (!key) return;
    const safeNames = Array.isArray(names) ? names : [];
    const unique = Array.from(
      new Set(
        safeNames.filter(name => typeof name === 'string' && name.trim())
      )
    );
    await setItem(key, JSON.stringify(unique));
  }, [setItem]);

  const clearDuplicateIndex = useCallback(async repo => {
    const key = getDuplicateIndexKey(repo);
    if (!key) return;
    await deleteItem(key);
  }, [deleteItem]);

  return useMemo(
    () => ({
      loadConfig,
      saveConfig,
      clearConfig,
      loadDuplicateIndex,
      saveDuplicateIndex,
      clearDuplicateIndex,
    }),
    [
      loadConfig,
      saveConfig,
      clearConfig,
      loadDuplicateIndex,
      saveDuplicateIndex,
      clearDuplicateIndex,
    ]
  );
};

export default useConfigStorage;
