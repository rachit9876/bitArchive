import React, { useEffect, useState } from 'react';
import appConfig from '../../app.json';
import { Alert, ScrollView, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Divider,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { getRepoParts } from '../utils';
import styles from '../styles';

const SettingsScreen = ({
  config,
  onUpdate,
  onClear,
  storageUsage,
  imageCount,
  onMessage,
}) => {
  const theme = useTheme();
  const [draft, setDraft] = useState(config);
  const [importText, setImportText] = useState('');
  const [clearing, setClearing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  /* ─── Save ─── */
  const save = async () => {
    if (!draft.token.trim() || !draft.repo.trim()) {
      onMessage('Token and repo are required.');
      return;
    }
    if (!getRepoParts(draft.repo)) {
      onMessage('Use username/repo format.');
      return;
    }
    await onUpdate(draft);
  };

  /* ─── Export / Import ─── */
  const exportConfig = async () => {
    await Clipboard.setStringAsync(JSON.stringify(draft));
    onMessage('Configuration copied to clipboard.');
  };

  const importConfig = async () => {
    try {
      const parsed = JSON.parse(importText.trim());
      if (!parsed.token || !parsed.repo)
        throw new Error('Missing token or repo.');
      await onUpdate({ ...draft, ...parsed });
      setImportText('');
      onMessage('Configuration imported.');
    } catch {
      onMessage('Invalid configuration JSON.');
    }
  };

  /* ─── Logout ─── */
  const confirmLogout = () => {
    Alert.alert(
      'Log Out',
      'This will remove your credentials and return to the setup screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: onClear },
      ]
    );
  };

  /* ─── Clear Local Cache ─── */
  const clearLocalCache = async () => {
    Alert.alert(
      'Clear Local Cache',
      'This will delete all cached/temporary images stored on this device. Your images on GitHub will NOT be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              const cacheDir = FileSystem.cacheDirectory;
              if (cacheDir) {
                const files = await FileSystem.readDirectoryAsync(cacheDir);
                const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
                let cleared = 0;
                for (const file of files) {
                  const ext = file.split('.').pop()?.toLowerCase();
                  if (imageExts.includes(ext)) {
                    try {
                      await FileSystem.deleteAsync(`${cacheDir}${file}`, {
                        idempotent: true,
                      });
                      cleared++;
                    } catch {
                      // skip
                    }
                  }
                }
                // Also clear the ImagePicker cache
                const pickerDir = `${FileSystem.cacheDirectory}ImagePicker/`;
                try {
                  const info = await FileSystem.getInfoAsync(pickerDir);
                  if (info.exists) {
                    await FileSystem.deleteAsync(pickerDir, { idempotent: true });
                  }
                } catch {
                  // skip
                }
                onMessage(`Cleared ${cleared} cached image${cleared !== 1 ? 's' : ''}.`);
              }
            } catch (error) {
              onMessage('Failed to clear cache.');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  };

  /* ─── Delete Repository ─── */
  const confirmDeleteRepo = () => {
    const parts = getRepoParts(config.repo);
    if (!parts) {
      onMessage('No repository configured.');
      return;
    }

    Alert.alert(
      'Delete Repository',
      `This will PERMANENTLY delete "${config.repo}" from GitHub, including ALL images stored in it.\n\nThis action CANNOT be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            // Double confirmation for safety
            Alert.alert(
              'Are you absolutely sure?',
              `Type YES to confirm deletion of "${config.repo}".`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'DELETE',
                  style: 'destructive',
                  onPress: deleteRepo,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const deleteRepo = async () => {
    const parts = getRepoParts(config.repo);
    if (!parts) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `https://api.github.com/repos/${parts.owner}/${parts.name}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${config.token}`,
          },
        }
      );

      if (response.status === 204 || response.status === 200) {
        onMessage('Repository deleted. Logging out…');
        setTimeout(() => onClear(), 1000);
      } else if (response.status === 403) {
        onMessage(
          'Permission denied. Your token needs the "delete_repo" scope.'
        );
      } else {
        const data = await response.json().catch(() => ({}));
        onMessage(data.message || 'Failed to delete repository.');
      }
    } catch (error) {
      onMessage('Network error. Could not delete repository.');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Render ─── */
  return (
    <ScrollView contentContainerStyle={styles.form}>
      {/* ── Config ── */}
      <Card style={styles.cardSpacing}>
        <Card.Title title="Configuration" />
        <Card.Content>
          <TextInput
            label="GitHub Token"
            mode="outlined"
            value={draft.token}
            secureTextEntry
            onChangeText={token => setDraft(prev => ({ ...prev, token }))}
            autoCapitalize="none"
          />
          <TextInput
            label="GitHub Repo"
            mode="outlined"
            value={draft.repo}
            onChangeText={repo => setDraft(prev => ({ ...prev, repo }))}
            autoCapitalize="none"
            style={styles.topSpacing}
          />
          <TextInput
            label="Base URL (optional)"
            mode="outlined"
            value={draft.baseUrl}
            onChangeText={baseUrl =>
              setDraft(prev => ({ ...prev, baseUrl }))
            }
            autoCapitalize="none"
            style={styles.topSpacing}
          />
          <Button mode="contained" style={styles.topSpacing} onPress={save}>
            Save Changes
          </Button>
        </Card.Content>
      </Card>

      {/* ── Storage ── */}
      <Card style={styles.cardSpacing}>
        <Card.Title title="Storage" />
        <Card.Content>
          <View style={{ gap: 4 }}>
            <Text>Images: {imageCount}</Text>
            <Text>Usage: {storageUsage}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* ── Account & Data ── */}
      <Card style={styles.cardSpacing}>
        <Card.Title title="Account & Data" />
        <Card.Content style={{ gap: 10 }}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={confirmLogout}
          >
            Log Out
          </Button>

          <Button
            mode="outlined"
            icon="delete-sweep"
            onPress={clearLocalCache}
            loading={clearing}
            disabled={clearing}
          >
            Clear Local Cache
          </Button>

          <Divider style={{ marginVertical: 4 }} />

          <Button
            mode="outlined"
            icon="delete-forever"
            textColor={theme.colors.error}
            onPress={confirmDeleteRepo}
            loading={deleting}
            disabled={deleting}
          >
            Delete Repository
          </Button>
          <Text
            style={{
              fontSize: 11,
              opacity: 0.5,
              color: theme.colors.onSurface,
            }}
          >
            Permanently deletes "{config.repo}" and all images from GitHub.
          </Text>
        </Card.Content>
      </Card>

      {/* ── Export / Import ── */}
      <Card style={styles.cardSpacing}>
        <Card.Title title="Export / Import" />
        <Card.Content>
          <Button mode="outlined" onPress={exportConfig}>
            Export to Clipboard
          </Button>
          <TextInput
            label="Import JSON"
            mode="outlined"
            value={importText}
            onChangeText={setImportText}
            multiline
            style={styles.topSpacing}
          />
          <Button
            mode="contained"
            style={styles.topSpacing}
            onPress={importConfig}
          >
            Import Configuration
          </Button>
        </Card.Content>
      </Card>

      {/* ── About ── */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Title title="About" />
        <Card.Content>
          <Text style={{ opacity: 0.6 }}>Bit Archive v{appConfig.expo.version}</Text>
          <Divider style={styles.topSpacing} />
          <Text style={[styles.hint, { textAlign: 'left' }]}>
            Private image archive powered by GitHub. Your images are stored in a
            private GitHub repository.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default SettingsScreen;
