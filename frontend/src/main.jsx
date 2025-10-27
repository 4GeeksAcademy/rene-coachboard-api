import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import App from './App.jsx';
import { AuthProvider } from './AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Register service worker and request notification permission
// Service worker registration disabled to prevent auto-refresh/hot reload
export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    await Notification.requestPermission();
  }
}
export function notify(title, options) {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => {
      reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, options });
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
