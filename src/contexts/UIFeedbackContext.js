import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const UIFeedbackContext = createContext(null);

export const UIFeedbackProvider = ({ children }) => {
    const [loading, setLoading] = useState(false); // boolean or string
    const [notification, setNotification] = useState(null); // { message, action?, duration? }

    const showLoading = useCallback((message = true) => {
        setLoading(message);
    }, []);

    const hideLoading = useCallback(() => {
        setLoading(false);
    }, []);

    const showMessage = useCallback((message, options = {}) => {
        setNotification({ message, ...options });
    }, []);

    const hideNotification = useCallback(() => {
        setNotification(null);
    }, []);

    const value = useMemo(() => ({
        loading,
        notification,
        showLoading,
        hideLoading,
        showMessage,
        hideNotification,
    }), [loading, notification, showLoading, hideLoading, showMessage, hideNotification]);

    return (
        <UIFeedbackContext.Provider value={value}>
            {children}
        </UIFeedbackContext.Provider>
    );
};

export const useUIFeedback = () => {
    const context = useContext(UIFeedbackContext);
    if (!context) {
        throw new Error('useUIFeedback must be used within a UIFeedbackProvider');
    }
    return context;
};
