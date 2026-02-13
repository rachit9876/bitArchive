import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { StyleSheet as RNStyleSheet } from 'react-native';

// Fallback background color if theme fails or for high contrast
const OVERLAY_COLOR = '#0f0d17';

export default function BiometricAuth({ onAuthenticate, visible, autoPrompt = true }) {
    const theme = useTheme();
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();
                setIsSupported(compatible && enrolled);
            } catch (e) {
                console.warn('Biometric check failed', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const authenticate = useCallback(async () => {
        try {
            setAuthError(null);
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Bit Archive',
                fallbackLabel: 'Use Passcode',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
            });

            if (result.success) {
                onAuthenticate();
            } else {
                // Keep the error silent or minimal unless it's a permanent failure, 
                // as user might just have clicked cancel.
                if (result.error !== 'user_cancel') {
                    setAuthError('Authentication failed. Please try again.');
                }
            }
        } catch (error) {
            setAuthError('An error occurred during authentication.');
            console.warn(error);
        }
    }, [onAuthenticate]);

    useEffect(() => {
        if (visible && isSupported && !loading && autoPrompt) {
            // Small delay to ensure view is ready and not conflicting with splash
            const timer = setTimeout(() => {
                authenticate();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [visible, isSupported, loading, authenticate, autoPrompt]);

    if (!visible) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background || OVERLAY_COLOR }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Text style={{ fontSize: 40 }}>🔒</Text>
                </View>

                <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
                    Bit Archive
                </Text>
                <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    App Locked
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" style={{ marginTop: 32 }} />
                ) : (
                    <View style={styles.actions}>
                        {isSupported ? (
                            <Button
                                mode="contained"
                                onPress={authenticate}
                                contentStyle={{ height: 48 }}
                                style={{ borderRadius: 24, minWidth: 200 }}
                            >
                                Unlock
                            </Button>
                        ) : (
                            <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
                                Biometric authentication is not available on this device.
                            </Text>
                        )}

                        {authError && (
                            <Text style={{ color: theme.colors.error, marginTop: 16, textAlign: 'center' }}>
                                {authError}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...RNStyleSheet.absoluteFillObject,
        zIndex: 99999, // Ensure it sits on top of everything
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 32,
        width: '100%',
        maxWidth: 400,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        marginBottom: 48,
        textAlign: 'center',
        opacity: 0.7,
    },
    actions: {
        width: '100%',
        alignItems: 'center',
    }
});
