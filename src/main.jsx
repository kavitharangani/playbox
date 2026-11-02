import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import sound from './sound.js';
import { getPref } from './store.js';
import { applyTheme } from './theme.js';
import '@fontsource-variable/outfit';
import './styles.css';

applyTheme(getPref('theme', 'indigo'));
sound.setEnabled(getPref('sound', true));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => { /* the app still works online */ });
}
