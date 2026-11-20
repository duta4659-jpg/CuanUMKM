import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      console.info('CuanUMKM siap digunakan secara offline.');
    },
    onRegisterError(error) {
      console.warn('Registrasi Service Worker dilewati:', error);
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
