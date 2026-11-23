/** A notification as the native reader delivers it. `key` identifies the notification (dedupe). */
export type RawCapture = {
  key: string;
  packageName: string;
  title: string | null;
  text: string | null;
  bigText: string | null;
  /** Epoch milliseconds when the notification was posted. */
  postedAt: number;
};

/**
 * Port for the native notification reader (modules/notification-capture).
 * Only the infrastructure adapter knows the native module; use cases see this interface.
 */
export interface NotificationSource {
  /** False where the native reader is not built in (Expo Go, iOS, tests). */
  isAvailable(): boolean;
  hasPermission(): boolean;
  openPermissionSettings(): void;
  setWatchedPackages(packages: string[]): void;
  getWatchedPackages(): string[];
  /** Returns the captures received since the last drain, and clears them. */
  drainCaptures(): RawCapture[];
  addCaptureListener(listener: (capture: RawCapture) => void): { remove(): void };
}
