import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
    ActivityIndicator,
    Card,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import {
    CameraIcon,
    ClipboardIcon,
    ImageIcon,
    LinkIcon,
} from '../components/Icons';
import styles from '../styles';

const UploadTab = ({ uploading, onPickGallery, onCamera, onPaste, onUrlSubmit }) => {
    const theme = useTheme();
    const [remoteUrl, setRemoteUrl] = useState('');

    const handleUrlSubmit = useCallback(() => {
        if (!remoteUrl.trim()) return;
        onUrlSubmit(remoteUrl.trim());
        setRemoteUrl('');
    }, [remoteUrl, onUrlSubmit]);

    return (
        <View style={{ flex: 1 }}>
            {uploading && (
                <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.uploadOverlayText}>Uploading…</Text>
                </View>
            )}

            <View style={[styles.searchRow, { backgroundColor: theme.colors.background }]}>
                <View style={[styles.searchPill, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <LinkIcon size={20} color={theme.colors.onSurfaceVariant} />
                    <TextInput
                        mode="flat"
                        placeholder="Paste image URL here…"
                        value={remoteUrl}
                        onChangeText={setRemoteUrl}
                        dense
                        underlineColor="transparent"
                        activeUnderlineColor="transparent"
                        style={[
                            styles.searchInput,
                            { backgroundColor: 'transparent' },
                        ]}
                        right={
                            remoteUrl.trim() ? (
                                <TextInput.Icon icon="arrow-right" onPress={handleUrlSubmit} />
                            ) : null
                        }
                        onSubmitEditing={handleUrlSubmit}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.uploadTab}>
                <Text variant="titleMedium" style={{ opacity: 0.7, marginBottom: 4 }}>
                    Add images to your archive
                </Text>

                <View style={styles.uploadGrid}>
                    <View style={styles.uploadGridItem}>
                        <Pressable onPress={onPickGallery}>
                            <Card style={styles.uploadCard} mode="elevated">
                                <Card.Content style={styles.uploadCardContent}>
                                    <ImageIcon size={32} color={theme.colors.primary} />
                                    <Text style={[styles.uploadCardLabel, { color: theme.colors.onSurface }]}>
                                        Gallery
                                    </Text>
                                    <Text style={[styles.uploadCardHint, { color: theme.colors.onSurface }]}>
                                        Pick from library
                                    </Text>
                                </Card.Content>
                            </Card>
                        </Pressable>
                    </View>

                    <View style={styles.uploadGridItem}>
                        <Pressable onPress={onCamera}>
                            <Card style={styles.uploadCard} mode="elevated">
                                <Card.Content style={styles.uploadCardContent}>
                                    <CameraIcon size={32} color={theme.colors.primary} />
                                    <Text style={[styles.uploadCardLabel, { color: theme.colors.onSurface }]}>
                                        Camera
                                    </Text>
                                    <Text style={[styles.uploadCardHint, { color: theme.colors.onSurface }]}>
                                        Take a photo
                                    </Text>
                                </Card.Content>
                            </Card>
                        </Pressable>
                    </View>

                    <View style={styles.uploadGridItem}>
                        <Pressable onPress={onPaste}>
                            <Card style={styles.uploadCard} mode="elevated">
                                <Card.Content style={styles.uploadCardContent}>
                                    <ClipboardIcon size={32} color={theme.colors.primary} />
                                    <Text style={[styles.uploadCardLabel, { color: theme.colors.onSurface }]}>
                                        Paste
                                    </Text>
                                    <Text style={[styles.uploadCardHint, { color: theme.colors.onSurface }]}>
                                        From clipboard
                                    </Text>
                                </Card.Content>
                            </Card>
                        </Pressable>
                    </View>


                </View>
            </ScrollView>
        </View>
    );
};

export default UploadTab;
