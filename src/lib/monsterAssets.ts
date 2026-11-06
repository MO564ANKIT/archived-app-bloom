import type { MonsterId } from '@/types';
import shopzilla from '@/assets/monsters/shopzilla.png.asset.json';
import coffeeling from '@/assets/monsters/coffeeling.png.asset.json';
import munchlord from '@/assets/monsters/munchlord.png.asset.json';
import saverion from '@/assets/monsters/saverion.png.asset.json';
import napcoin from '@/assets/monsters/napcoin.png.asset.json';
import impulso from '@/assets/monsters/impulso.png.asset.json';

// Artwork is tried first; if it fails to load, the built-in drawing is shown instead.
export const MONSTER_IMAGE_SOURCES: Record<MonsterId, readonly string[]> = {
  shopzilla: [shopzilla.url],
  coffeeling: [coffeeling.url],
  munchlord: [munchlord.url],
  saverion: [saverion.url],
  napcoin: [napcoin.url],
  impulso: [impulso.url],
};
