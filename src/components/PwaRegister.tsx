'use client';

import { useEffect } from 'react';

export const PwaRegister = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('AetherWeather PWA Service Worker terdaftar:', reg.scope);
          })
          .catch((err) => {
            console.warn('Gagal mendaftarkan Service Worker:', err);
          });
      });
    }
  }, []);

  return null;
};
