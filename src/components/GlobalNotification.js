import React from 'react';
import { Snackbar, useTheme } from 'react-native-paper';
import { useUIFeedback } from '../contexts/UIFeedbackContext';

const GlobalNotification = () => {
    const { notification, hideNotification } = useUIFeedback();
    const theme = useTheme();

    const visible = Boolean(notification);
    const { message, action, duration = 3000 } = notification || {};

    return (
        <Snackbar
            visible={visible}
            onDismiss={hideNotification}
            duration={duration}
            action={action}
            style={{
                backgroundColor: theme.colors.inverseSurface,
                marginBottom: 80, // Avoid bottom tabs overlap
            }}
            theme={{ colors: { inverseOnSurface: theme.colors.inverseOnSurface } }}
        >
            {message}
        </Snackbar>
    );
};

export default GlobalNotification;
