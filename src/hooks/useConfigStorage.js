import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { CONFIG_KEY } from '../constants';

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

  return useMemo(
    () => ({ loadConfig, saveConfig, clearConfig }),
    [loadConfig, saveConfig, clearConfig]
  );
};

export default useConfigStorage;
