'use client';

import { useEffect } from 'react';

export const PwaRegister = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const hadController = Boolean(navigator.serviceWorker.controller);
    let hasReloaded = false;
    const handleControllerChange = () => {
      if (hadController && !hasReloaded && navigator.serviceWorker.controller) {
        hasReloaded = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          console.log('AetherWeather PWA Service Worker terdaftar:', reg.scope);
          return reg.update();
        })
        .catch((err) => {
          console.warn('Gagal mendaftarkan Service Worker:', err);
        });
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        handleControllerChange
      );
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
};
