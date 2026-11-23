import {
  addCaptureListener,
  drainCaptures,
  getWatchedPackages,
  hasPermission,
  isAvailable,
  openPermissionSettings,
  setWatchedPackages,
} from '../index';

describe('notification-capture sem módulo nativo (Jest / Expo Go / web)', () => {
  it('retorna valores neutros e não lança exceção', () => {
    expect(isAvailable()).toBe(false);
    expect(hasPermission()).toBe(false);
    expect(getWatchedPackages()).toEqual([]);
    expect(drainCaptures()).toEqual([]);
    expect(() => openPermissionSettings()).not.toThrow();
    expect(() => setWatchedPackages(['com.nu.production'])).not.toThrow();
  });

  it('addCaptureListener devolve assinatura no-op removível', () => {
    const subscription = addCaptureListener(() => {});
    expect(() => subscription.remove()).not.toThrow();
  });
});
