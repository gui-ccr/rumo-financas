import type { NotificationSource, RawCapture } from '../domain/notification-source';

/** Surface of the native module (modules/notification-capture), as the adapter uses it. */
type NativeNotificationCapture = {
  isAvailable(): boolean;
  hasPermission(): boolean;
  openPermissionSettings(): void;
  setWatchedPackages(packages: string[]): void;
  getWatchedPackages(): string[];
  drainCaptures(): RawCapture[];
  addCaptureListener(listener: (capture: RawCapture) => void): { remove(): void };
};

/**
 * The native module is absent in Expo Go, on iOS and in tests. Loading it is guarded, so the app
 * runs without it: every call then reports "not available" and captures nothing.
 */
function loadNative(): NativeNotificationCapture | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../../../modules/notification-capture') as
      | NativeNotificationCapture
      | { default: NativeNotificationCapture };
    return 'default' in mod ? mod.default : mod;
  } catch {
    return null;
  }
}

/** Implements the NotificationSource port on top of the native module. */
export class NativeNotificationSource implements NotificationSource {
  private readonly native = loadNative();

  isAvailable() {
    return this.native !== null && this.native.isAvailable();
  }

  hasPermission() {
    return this.native !== null && this.native.hasPermission();
  }

  openPermissionSettings() {
    this.native?.openPermissionSettings();
  }

  setWatchedPackages(packages: string[]) {
    this.native?.setWatchedPackages(packages);
  }

  getWatchedPackages() {
    return this.native?.getWatchedPackages() ?? [];
  }

  drainCaptures() {
    return this.native?.drainCaptures() ?? [];
  }

  addCaptureListener(listener: (capture: RawCapture) => void) {
    if (!this.native) return { remove() {} };
    return this.native.addCaptureListener(listener);
  }
}
