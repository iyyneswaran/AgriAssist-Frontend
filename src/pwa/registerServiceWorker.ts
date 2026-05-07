export interface ServiceWorkerRegistrationResult {
  supported: boolean;
  registered: boolean;
  registration: ServiceWorkerRegistration | null;
  error?: string;
}

const isLocalhost = () =>
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]';

export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator && (window.isSecureContext || isLocalhost());
}

export async function registerAgriAssistServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
  if (!isServiceWorkerSupported()) {
    return {
      supported: false,
      registered: false,
      registration: null,
      error: 'Service workers require HTTPS or localhost.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      installingWorker?.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          installingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    await navigator.serviceWorker.ready;
    void registration.update();

    return {
      supported: true,
      registered: true,
      registration,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Service worker registration failed';
    console.error('[PWA] Service worker registration failed:', error);
    return {
      supported: true,
      registered: false,
      registration: null,
      error: message,
    };
  }
}

export function sendVapidKeyToServiceWorker(publicKey: string): void {
  const controller = navigator.serviceWorker?.controller;
  controller?.postMessage({ type: 'SET_VAPID_PUBLIC_KEY', publicKey });
}

export async function showLocalServiceWorkerNotification(body?: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({
    type: 'SHOW_LOCAL_TEST_NOTIFICATION',
    body,
  });
}
