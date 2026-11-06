import { roastChat, type RoastResponse } from '@/lib/roastChat.functions';

export interface RoastHistoryItem {
  role: 'user' | 'bot';
  text: string;
}

export interface RoastRequest {
  personality: string;
  message: string;
  today: string;
  history: RoastHistoryItem[];
}

function friendly(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (/unauthorized/i.test(message)) return 'Sign in to chat with the roaster.';
  return 'The roaster took too long or could not be reached. Please try again.';
}

export async function requestRoast(request: RoastRequest): Promise<string> {
  let result: RoastResponse;
  try {
    result = await roastChat({ data: request });
  } catch (err) {
    throw new Error(friendly(err));
  }
  if (!result.ok) throw new Error(result.error);
  if (result.reply.trim().length === 0) throw new Error('The roast service sent an empty reply. Please try again.');
  return result.reply;
}
