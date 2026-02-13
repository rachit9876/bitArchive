import React, { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import useConfigStorage from '../hooks/useConfigStorage';
import { initialConfig } from '../constants';
import { getRepoParts } from '../utils';
import styles from '../styles';

const DEFAULT_REPO_NAME = 'Bit-Archive-imgs';

const SetupScreen = ({ onComplete, onMessage }) => {
  const theme = useTheme();
  const { saveConfig } = useConfigStorage();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [draft, setDraft] = useState(initialConfig);
  const [errors, setErrors] = useState({});

  /* ─── Quick Setup: "Continue with GitHub" ─── */

  const quickSetup = useCallback(async () => {
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      onMessage('Please paste your GitHub Personal Access Token.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify token & get username
      setStatusText('Verifying token…');
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `token ${trimmedToken}`,
        },
      });
      if (!userRes.ok) {
        const err = await userRes.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid token. Check permissions and try again.');
      }
      const user = await userRes.json();
      const username = user.login;
      const repoFullName = `${username}/${DEFAULT_REPO_NAME}`;

      // 2. Check if repo exists
      setStatusText(`Checking for ${DEFAULT_REPO_NAME}…`);
      const repoRes = await fetch(
        `https://api.github.com/repos/${repoFullName}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${trimmedToken}`,
          },
        }
      );

      let branch = 'main';

      if (repoRes.status === 404) {
        // 3. Create the repo
        setStatusText(`Creating ${DEFAULT_REPO_NAME}…`);
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${trimmedToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: DEFAULT_REPO_NAME,
            description: 'Private image archive powered by Bit Archive',
            private: true,
            auto_init: true,
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create repository.');
        }
        const created = await createRes.json();
        branch = created.default_branch || 'main';

        // 4. Create public/ folder with .gitkeep
        setStatusText('Setting up folder structure…');
        await new Promise(resolve => setTimeout(resolve, 1500)); // wait for GitHub to init
        try {
          await fetch(
            `https://api.github.com/repos/${repoFullName}/contents/public/.gitkeep`,
            {
              method: 'PUT',
              headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `token ${trimmedToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'Initialize public folder',
                content: '',
                branch,
              }),
            }
          );
        } catch (e) {
          // non-critical
        }

        onMessage(`Created ${DEFAULT_REPO_NAME} repository! ✓`);
      } else if (repoRes.ok) {
        // Repo exists — use it
        const repoData = await repoRes.json();
        branch = repoData.default_branch || 'main';
        onMessage(`Found existing ${DEFAULT_REPO_NAME} — continuing.`);
      } else {
        const err = await repoRes.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to check repository.');
      }

      // 5. Save config
      const config = {
        token: trimmedToken,
        repo: repoFullName,
        baseUrl: '',
        branch,
      };
      await saveConfig(config);
      onComplete(config);
    } catch (error) {
      onMessage(error.message || 'Setup failed.');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  }, [token, onComplete, onMessage, saveConfig]);

  /* ─── Advanced Setup (manual) ─── */

  const validateAdvanced = useCallback(() => {
    const nextErrors = {};
    if (!draft.token.trim()) nextErrors.token = 'Token is required.';
    if (!draft.repo.trim()) nextErrors.repo = 'Repository is required.';
    if (draft.repo && !getRepoParts(draft.repo))
      nextErrors.repo = 'Use username/repo format.';
    if (draft.baseUrl && !draft.baseUrl.startsWith('http')) {
      nextErrors.baseUrl = 'Base URL must start with http(s).';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [draft]);

  const saveAdvanced = useCallback(async () => {
    if (!validateAdvanced()) return;
    setLoading(true);
    try {
      const parts = getRepoParts(draft.repo);
      const response = await fetch(
        `https://api.github.com/repos/${parts.owner}/${parts.name}`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${draft.token}`,
          },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Connection failed.');
      }
      const data = await response.json();
      const config = {
        ...draft,
        branch: data.default_branch || draft.branch || 'main',
      };
      await saveConfig(config);
      onComplete(config);
    } catch (error) {
      onMessage(error.message || 'Failed to connect.');
    } finally {
      setLoading(false);
    }
  }, [draft, onComplete, onMessage, saveConfig, validateAdvanced]);

  const pasteToken = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim()) {
        setToken(text.trim());
        onMessage('Token pasted from clipboard.');
      } else {
        onMessage('Clipboard is empty.');
      }
    } catch {
      onMessage('Failed to read clipboard.');
    }
  }, [onMessage]);

  /* ─── Render ─── */

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: theme.colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView contentContainerStyle={[styles.form, { paddingTop: 24 }]}>
        {/* ── Quick Setup ── */}
        {!showAdvanced && (
          <>
            <Text
              variant="headlineMedium"
              style={[styles.title, { color: theme.colors.onBackground }]}
            >
              Welcome to Bit Archive
            </Text>
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                lineHeight: 22,
                marginBottom: 8,
              }}
            >
              Store your images privately on GitHub. Paste your Personal Access
              Token to get started — we'll create a private{' '}
              <Text style={{ fontWeight: '700', color: theme.colors.primary }}>
                {DEFAULT_REPO_NAME}
              </Text>{' '}
              repo automatically.
            </Text>

            <Button
              mode="text"
              compact
              onPress={() =>
                Linking.openURL(
                  'https://github.com/settings/tokens/new?scopes=repo&description=Bit+Archive'
                )
              }
              style={{ alignSelf: 'flex-start', marginBottom: 4 }}
            >
              Create a token on GitHub →
            </Button>

            <TextInput
              label="GitHub Personal Access Token"
              mode="outlined"
              value={token}
              secureTextEntry
              onChangeText={setToken}
              autoCapitalize="none"
              right={
                <TextInput.Icon icon="content-paste" onPress={pasteToken} />
              }
            />

            {statusText ? (
              <View style={styles.progressRow}>
                <ActivityIndicator size={16} />
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  {statusText}
                </Text>
              </View>
            ) : null}

            <Button
              mode="contained"
              onPress={quickSetup}
              loading={loading}
              disabled={loading || !token.trim()}
              style={{ marginTop: 16 }}
              contentStyle={{ height: 48 }}
              labelStyle={{ fontSize: 15, fontWeight: '700' }}
              icon="github"
            >
              Continue with GitHub
            </Button>

            <Button
              mode="text"
              compact
              onPress={() => setShowAdvanced(true)}
              style={{ marginTop: 16 }}
            >
              Advanced Setup (custom repo) →
            </Button>
          </>
        )}

        {/* ── Advanced Setup ── */}
        {showAdvanced && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Button
                mode="text"
                compact
                onPress={() => setShowAdvanced(false)}
                icon="arrow-left"
              >
                Back
              </Button>
              <Text
                variant="titleMedium"
                style={{ flex: 1, color: theme.colors.onBackground }}
              >
                Advanced Setup
              </Text>
            </View>
            <TextInput
              label="GitHub Personal Access Token"
              mode="outlined"
              value={draft.token}
              secureTextEntry
              onChangeText={t => setDraft(prev => ({ ...prev, token: t }))}
              error={Boolean(errors.token)}
              autoCapitalize="none"
            />
            <HelperText type="error" visible={Boolean(errors.token)}>
              {errors.token}
            </HelperText>
            <TextInput
              label="GitHub Repository (user/repo)"
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
              onChangeText={baseUrl =>
                setDraft(prev => ({ ...prev, baseUrl }))
              }
              error={Boolean(errors.baseUrl)}
              autoCapitalize="none"
            />
            <HelperText type="error" visible={Boolean(errors.baseUrl)}>
              {errors.baseUrl}
            </HelperText>
            <Button
              mode="contained"
              onPress={saveAdvanced}
              loading={loading}
              style={{ marginTop: 8 }}
            >
              Connect & Save
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default SetupScreen;
