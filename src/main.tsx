import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically register PWA Service Worker for offline support & asset caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('PWA updated. Reloading for newest version...');
  },
  onOfflineReady() {
    console.log('Grand Royale PWA is ready for offline play.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);

