import axios from 'axios';

export interface ChatItemResult {
  id: string;
  name: string;
  price: number;
  available: boolean;
  imageUrl?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatResponse {
  reply: string;
  items: ChatItemResult[];
}

function isChatItemResult(value: unknown): value is ChatItemResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && typeof item.name === 'string'
    && typeof item.price === 'number'
    && typeof item.available === 'boolean'
    && (item.imageUrl === undefined || typeof item.imageUrl === 'string');
}

export async function sendChatMessage(message: string, history: ChatTurn[]): Promise<ChatResponse> {
  const response = await axios.post('/chat', { message, history });
  const data: unknown = response.data?.data;
  if (!response.data?.success || !data || typeof data !== 'object') {
    throw new Error('The canteen assistant returned an invalid response.');
  }
  const chatData = data as Record<string, unknown>;
  const reply = chatData.reply;
  const rawItems = chatData.items;
  if (typeof reply !== 'string' || !Array.isArray(rawItems)) {
    throw new Error('The canteen assistant returned an invalid response.');
  }
  const items = rawItems.filter(isChatItemResult);
  if (items.length !== rawItems.length) {
    throw new Error('The canteen assistant returned an invalid response.');
  }
  return { reply, items };
}
