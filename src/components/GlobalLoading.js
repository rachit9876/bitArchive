import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useUIFeedback } from '../contexts/UIFeedbackContext';

const GlobalLoading = () => {
    const { loading } = useUIFeedback();
    const theme = useTheme();

    if (!loading) return null;

    const message = typeof loading === 'string' ? loading : 'Loading...';

    return (
        <Modal
            transparent={true}
            visible={true}
            animationType="fade"
            onRequestClose={() => { }} // Block back button
        >
            <View style={styles.container}>
                <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
                    <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
                    {message ? (
                        <Text variant="bodyLarge" style={[styles.text, { color: theme.colors.onSurface }]}>
                            {message}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    content: {
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
        elevation: 4,
        borderRadius: 28,
    },
    text: {
        marginTop: 12,
        textAlign: 'center',
    },
});

export default GlobalLoading;
