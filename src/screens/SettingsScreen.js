import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { Button, Card, Divider, Text, TextInput, useTheme } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { getRepoParts } from '../utils';
import styles from '../styles';

const SettingsScreen = ({ config, onUpdate, onClear, storageUsage, imageCount, onMessage }) => {
  const theme = useTheme();
  const [draft, setDraft] = useState(config);
  const [importText, setImportText] = useState('');

  useEffect(() => {
    setDraft(config);
  }, [config]);

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

  const exportConfig = async () => {
    await Clipboard.setStringAsync(JSON.stringify(draft));
    onMessage('Configuration copied to clipboard.');
  };

  const importConfig = async () => {
    try {
      const parsed = JSON.parse(importText.trim());
      if (!parsed.token || !parsed.repo) throw new Error('Missing token or repo.');
      await onUpdate({ ...draft, ...parsed });
      setImportText('');
      onMessage('Configuration imported.');
    } catch (error) {
      onMessage('Invalid configuration JSON.');
    }
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear Configuration',
      'This will remove all saved credentials and settings. You will need to set up again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: onClear },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.form}>
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
            onChangeText={baseUrl => setDraft(prev => ({ ...prev, baseUrl }))}
            autoCapitalize="none"
            style={styles.topSpacing}
          />
          <Button mode="contained" style={styles.topSpacing} onPress={save}>
            Save Changes
          </Button>
          <Button mode="outlined" style={styles.topSpacing} onPress={confirmClear}>
            Clear Configuration
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.cardSpacing}>
        <Card.Title title="Storage" />
        <Card.Content>
          <View style={{ gap: 4 }}>
            <Text>Images: {imageCount}</Text>
            <Text>Usage: {storageUsage}</Text>
          </View>
        </Card.Content>
      </Card>

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
          <Button mode="contained" style={styles.topSpacing} onPress={importConfig}>
            Import Configuration
          </Button>
        </Card.Content>
      </Card>

      <Card>
        <Card.Title title="About" />
        <Card.Content>
          <Text style={{ opacity: 0.6 }}>Bit Archive v1.0.0</Text>
          <Divider style={styles.topSpacing} />
          <Text style={[styles.hint, { textAlign: 'left' }]}>
            Private image archive powered by GitHub. Your images are stored in a GitHub repository and served via raw content URLs.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default SettingsScreen;
