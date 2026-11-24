import { Bike, Coffee, Gamepad2, Heart, Leaf, Moon, Music, PiggyBank, Rocket, Star, Sun, Wallet, type LucideIcon } from 'lucide-react-native';

import { AVATAR_ICON_KEYS, type AvatarIconKey } from '../domain/profile';

/** Lucide glyph for each stored avatar icon key. Typed as a full record so a new key cannot be forgotten. */
export const AVATAR_ICONS: Record<AvatarIconKey, LucideIcon> = {
  bike: Bike,
  wallet: Wallet,
  'piggy-bank': PiggyBank,
  rocket: Rocket,
  star: Star,
  heart: Heart,
  sun: Sun,
  moon: Moon,
  coffee: Coffee,
  music: Music,
  gamepad: Gamepad2,
  leaf: Leaf,
};

export function avatarIconFor(key: AvatarIconKey | null): LucideIcon | null {
  return key ? AVATAR_ICONS[key] : null;
}

export { AVATAR_ICON_KEYS };
