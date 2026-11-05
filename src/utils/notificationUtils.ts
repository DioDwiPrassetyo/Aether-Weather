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

export const SIREN_STORAGE_KEY = 'aether_early_warning_siren_enabled';

export function isSirenEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIREN_STORAGE_KEY) === 'true';
}

export function setSirenEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SIREN_STORAGE_KEY, enabled ? 'true' : 'false');
  }
}

/**
 * Synthesizes a clean, modern aerospace/meteorological dual-tone early warning alert chime
 * using the browser's native Web Audio API (zero external audio dependencies).
 */
export function playWeatherAlertSiren(severity: 'danger' | 'warning' | 'test' = 'test'): void {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Master gain to keep volume comfortable and safe
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.connect(ctx.destination);

    // Pattern depends on severity
    const pulses =
      severity === 'danger'
        ? [
            { freq1: 853, freq2: 960, start: 0, dur: 0.28 },
            { freq1: 853, freq2: 960, start: 0.36, dur: 0.28 },
            { freq1: 1050, freq2: 1200, start: 0.72, dur: 0.45 },
          ]
        : [
            { freq1: 660, freq2: 880, start: 0, dur: 0.22 },
            { freq1: 880, freq2: 1100, start: 0.28, dur: 0.34 },
          ];

    pulses.forEach((p) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const pulseGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(p.freq1, now + p.start);
      osc2.frequency.setValueAtTime(p.freq2, now + p.start);

      pulseGain.gain.setValueAtTime(0.0001, now + p.start);
      pulseGain.gain.exponentialRampToValueAtTime(0.5, now + p.start + 0.03);
      pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + p.start + p.dur);

      osc1.connect(pulseGain);
      osc2.connect(pulseGain);
      pulseGain.connect(masterGain);

      osc1.start(now + p.start);
      osc2.start(now + p.start);
      osc1.stop(now + p.start + p.dur + 0.02);
      osc2.stop(now + p.start + p.dur + 0.02);
    });

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1500);
  } catch (err) {
    console.warn('Unable to play synthesized weather alert chime:', err);
  }
}
