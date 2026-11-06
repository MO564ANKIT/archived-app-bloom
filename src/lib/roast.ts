export type Personality = 'softie' | 'savage' | 'big-brain' | 'unhinged';

export interface PersonalityInfo {
  id: Personality;
  label: string;
  tagline: string;
  greeting: string;
}

export const PERSONALITIES: PersonalityInfo[] = [
  {
    id: 'softie',
    label: 'Softie',
    tagline: 'Gentle nudges and big hugs',
    greeting: 'Hi, friend. Tell me what you are thinking about buying, or just ask for a check-in.',
  },
  {
    id: 'savage',
    label: 'Savage',
    tagline: 'Blunt, fast, no sugar coating',
    greeting: 'Go ahead. Show me the damage. I have seen worse, but not much worse.',
  },
  {
    id: 'big-brain',
    label: 'Big Brain',
    tagline: 'Numbers first, feelings second',
    greeting: 'Send me an amount or a purchase and I will show you the trade-offs with numbers.',
  },
  {
    id: 'unhinged',
    label: 'Unhinged',
    tagline: 'Chaotic energy, zero chill',
    greeting: 'WELCOME TO THE WALLET ARENA. Type a price. Let us see what your monsters do.',
  },
];
