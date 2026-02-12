import React, { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import useConfigStorage from '../hooks/useConfigStorage';
import { initialConfig } from '../constants';
import { getRepoParts } from '../utils';
import styles from '../styles';

const SetupScreen = ({ onComplete, onMessage }) => {
  const theme = useTheme();
  const { saveConfig } = useConfigStorage();
  const [draft, setDraft] = useState(initialConfig);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const insets = useSafeAreaInsets();

  const validate = useCallback(() => {
    const nextErrors = {};
    if (!draft.token.trim()) nextErrors.token = 'Token is required.';
    if (!draft.repo.trim()) nextErrors.repo = 'Repository is required.';
    if (draft.repo && !getRepoParts(draft.repo)) nextErrors.repo = 'Use username/repo format.';
    if (draft.baseUrl && !draft.baseUrl.startsWith('http')) {
      nextErrors.baseUrl = 'Base URL must be http(s).';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [draft]);

  const testConnection = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const parts = getRepoParts(draft.repo);
      const response = await fetch(`https://api.github.com/repos/${parts.owner}/${parts.name}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `token ${draft.token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Connection failed.');
      }
      const data = await response.json();
      setDraft(prev => ({ ...prev, branch: data.default_branch || 'main' }));
      onMessage('Connection successful.');
    } catch (error) {
      onMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [draft, onMessage, validate]);

  const save = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await saveConfig(draft);
      onComplete(draft);
    } catch (error) {
      onMessage('Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  }, [draft, onComplete, onMessage, saveConfig, validate]);

  const pasteConfig = useCallback(async () => {
    setLoading(true);
    try {
      const text = await Clipboard.getStringAsync();
      const parsed = JSON.parse(text.trim());
      if (!parsed.token || !parsed.repo) throw new Error('Missing token or repo.');
      setDraft(prev => ({ ...prev, ...parsed }));
      onMessage('Configuration pasted from clipboard.');
    } catch (error) {
      onMessage('Invalid configuration in clipboard.');
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView contentContainerStyle={[styles.form, { paddingTop: 12 }]}>
        <Text variant="headlineMedium" style={styles.title}>
          Configure your GitHub CDN
        </Text>
        <TextInput
          label="GitHub Personal Access Token"
          mode="outlined"
          value={draft.token}
          secureTextEntry
          onChangeText={token => setDraft(prev => ({ ...prev, token }))}
          error={Boolean(errors.token)}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={Boolean(errors.token)}>
          {errors.token}
        </HelperText>
        <TextInput
          label="GitHub Repository"
          mode="outlined"
          value={draft.repo}
          onChangeText={repo => setDraft(prev => ({ ...prev, repo }))}
          error={Boolean(errors.repo)}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={Boolean(errors.repo)}>
          {errors.repo}
        </HelperText>
        <TextInput
          label="Base URL (optional)"
          mode="outlined"
          value={draft.baseUrl}
          onChangeText={baseUrl => setDraft(prev => ({ ...prev, baseUrl }))}
          error={Boolean(errors.baseUrl)}
          autoCapitalize="none"
        />
        <HelperText type="error" visible={Boolean(errors.baseUrl)}>
          {errors.baseUrl}
        </HelperText>
        <Button mode="outlined" onPress={pasteConfig} loading={loading} style={styles.topSpacing}>
          Paste Configuration
        </Button>
        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={testConnection} loading={loading}>
            Test Connection
          </Button>
          <Button mode="contained" onPress={save} loading={loading}>
            Save Configuration
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

export default SetupScreen;
