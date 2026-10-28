/** Utility functions for opt-in weather alert notifications. */

export const NOTIF_STORAGE_KEY = 'aether_browser_notifications_enabled';

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export function isNotificationActive(): boolean {
  if (!isNotificationSupported()) return false;
  const isEnabled = localStorage.getItem(NOTIF_STORAGE_KEY) === 'true';
  return isEnabled && Notification.permission === 'granted';
}

export function setNotificationActive(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(NOTIF_STORAGE_KEY, enabled ? 'true' : 'false');
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationActive(true);
    } else {
      setNotificationActive(false);
    }
    return permission;
  } catch (err) {
    console.warn('Gagal meminta izin notifikasi:', err);
    return 'denied';
  }
}

export function sendWeatherNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      void navigator.serviceWorker.ready
        .then((reg) =>
          reg.showNotification(title, {
            icon: '/icon.svg',
            badge: '/icon.svg',
            ...options,
          })
        )
        .catch((err) => console.warn('Error sending weather notification:', err));
    } else {
      new Notification(title, {
        icon: '/icon.svg',
        ...options,
      });
    }
  } catch (err) {
    console.warn('Error sending notification:', err);
  }
}
