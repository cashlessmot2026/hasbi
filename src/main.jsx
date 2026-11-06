import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { I18nProvider } from './i18n/index.jsx';
import './styles.css';

registerSW({ immediate: true });

const root = createRoot(document.getElementById('root'));
const isAdmin = /\/admin\/?$/.test(location.pathname) || location.hash.startsWith('#/admin');

if (isAdmin) {
  // Panel oculto: solo se descarga al entrar a /admin
  import('./admin/AdminApp.jsx').then(({ default: AdminApp }) =>
    root.render(<React.StrictMode><AdminApp /></React.StrictMode>)
  );
} else {
  root.render(
    <React.StrictMode>
      <I18nProvider>
        <App />
      </I18nProvider>
    </React.StrictMode>
  );
}
