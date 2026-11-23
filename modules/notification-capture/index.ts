import { requireOptionalNativeModule } from 'expo';

export type RawCapture = {
  /** StatusBarNotification.key + postTime, único */
  key: string;
  packageName: string;
  title: string | null;
  /** EXTRA_TEXT */
  text: string | null;
  /** EXTRA_BIG_TEXT */
  bigText: string | null;
  /** epoch ms */
  postedAt: number;
};

type NotificationCaptureEvents = {
  onCapture: (event: RawCapture) => void;
};

type NotificationCaptureNative = {
  addListener<E extends keyof NotificationCaptureEvents>(
    eventName: E,
    listener: NotificationCaptureEvents[E],
  ): { remove(): void };
  hasPermission(): boolean;
  openPermissionSettings(): void;
  setWatchedPackages(packages: string[]): void;
  getWatchedPackages(): string[];
  drainCaptures(): RawCapture[];
};

// Retorna null em iOS, web, Expo Go e Jest (módulo nativo não linkado).
const native = requireOptionalNativeModule<NotificationCaptureNative>('NotificationCapture');

const NOOP_SUBSCRIPTION = { remove: () => {} };

function safe<T>(fallback: T, fn: (mod: NotificationCaptureNative) => T): T {
  if (!native) return fallback;
  try {
    return fn(native);
  } catch {
    return fallback;
  }
}

/** true quando o módulo nativo existe nesta build (Android com dev/prod build). */
export function isAvailable(): boolean {
  return native !== null;
}

/** true quando o usuário habilitou o listener em Settings.Secure. */
export function hasPermission(): boolean {
  return safe(false, (mod) => mod.hasPermission());
}

/** Abre a tela de acesso a notificações do Android. */
export function openPermissionSettings(): void {
  safe(undefined, (mod) => mod.openPermissionSettings());
}

/** Define os pacotes observados (persistido em SharedPreferences). */
export function setWatchedPackages(packages: string[]): void {
  safe(undefined, (mod) => mod.setWatchedPackages(packages));
}

/** Pacotes observados. Padrão quando nunca configurado: ["com.nu.production"]. */
export function getWatchedPackages(): string[] {
  return safe<string[]>([], (mod) => mod.getWatchedPackages());
}

/** Retorna a fila persistida e a esvazia (atômico). */
export function drainCaptures(): RawCapture[] {
  return safe<RawCapture[]>([], (mod) => mod.drainCaptures());
}

/** Recebe capturas enquanto o app está vivo. Não remove da fila: use drainCaptures e deduplique por key. */
export function addCaptureListener(cb: (c: RawCapture) => void): { remove(): void } {
  if (!native) return NOOP_SUBSCRIPTION;
  try {
    return native.addListener('onCapture', cb);
  } catch {
    return NOOP_SUBSCRIPTION;
  }
}
