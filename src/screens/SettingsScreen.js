import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { getRepoParts } from '../utils';
import styles from '../styles';

const SettingsScreen = ({ config, onUpdate, onClear, storageUsage, onMessage }) => {
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
            label="Base URL"
            mode="outlined"
            value={draft.baseUrl}
            onChangeText={baseUrl => setDraft(prev => ({ ...prev, baseUrl }))}
            autoCapitalize="none"
            style={styles.topSpacing}
          />
          <Button mode="contained" style={styles.topSpacing} onPress={save}>
            Save Changes
          </Button>
          <Button mode="outlined" style={styles.topSpacing} onPress={onClear}>
            Clear Configuration
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.cardSpacing}>
        <Card.Title title="Storage" />
        <Card.Content>
          <Text>Usage: {storageUsage}</Text>
        </Card.Content>
      </Card>

      <Card>
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
    </ScrollView>
  );
};

export default SettingsScreen;
