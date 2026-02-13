import React from 'react';
import { UIFeedbackProvider } from './src/contexts/UIFeedbackContext';
import Main from './src/Main';

export default function App() {
  return (
    <UIFeedbackProvider>
      <Main />
    </UIFeedbackProvider>
  );
}
