import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Plus, Send, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { sendChatMessage, ChatItemResult, ChatTurn } from '../../api/chatApi';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';
import { PixelBot } from '../pixel/PixelBot';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  items?: ChatItemResult[];
}

const quickReplies = ["Today's special", 'Recommend something', "What's available for lunch?"];
const initialMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: "Heyy, I'm ur BiteBuddy. I can help u make every Bite spl :)",
};

function errorText(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return 'Sorry, I couldn’t reach BiteBuddy. Please try again.';
}

export const StudentChatWidget: React.FC = () => {
  const location = useLocation();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const messageListRef = useRef<HTMLDivElement>(null);
  const isCartPage = location.pathname === '/cart';

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const submitMessage = async (value: string) => {
    const message = value.trim();
    if (!message || typing) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', text: message };
    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setError('');
    setTyping(true);

    const history: ChatTurn[] = messages
      .slice(-6)
      .map(({ role, text }) => ({ role, text: text.slice(0, 300) }));
    try {
      const result = await sendChatMessage(message, history);
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: result.reply,
          items: result.items,
        },
      ]);
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setTyping(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMessage(input);
  };

  const handleAddToCart = (item: ChatItemResult) => {
    if (!item.available) return;
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || '',
      isVegetarian: true,
      preparationTime: 8,
    });
    addToast({
      type: 'success',
      title: 'Added to Preorder',
      message: `${item.name} added to your cart.`,
    });
  };

  if (isCartPage) return null;

  return (
    <>
      {open && (
        <section
          aria-label="BiteBuddy chat"
          className="theme-chat fixed bottom-[5.25rem] right-3 z-[60] flex max-h-[calc(100dvh-7rem)] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-2xl md:bottom-6"
        >
          <header className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="theme-pixel-tile h-9 w-9 rounded-md">
                <PixelBot size={28} />
              </span>
              <div>
                <h2 className="font-serif text-lg font-semibold">BiteBuddy</h2>
                <p className="theme-chat-muted text-[11px]">Menu, specials & availability</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close BiteBuddy chat"
              className="theme-chat-close rounded-full p-2 text-[var(--color-text-primary)] transition"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="checker-strip shrink-0" />

          <div ref={messageListRef} className="min-h-36 flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <p
                    className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'theme-chat-inverse rounded-br-md'
                        : 'theme-chat-surface rounded-bl-md border'
                    }`}
                  >
                    {message.text}
                  </p>
                  {!!message.items?.length && (
                    <div className="space-y-2">
                      {message.items.map((item) => (
                        <article key={item.id} className="theme-chat-surface rounded-xl border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-serif text-sm font-semibold">{item.name}</h3>
                            <span className="shrink-0 font-mono text-sm font-bold">₹{item.price}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${item.available ? 'theme-chat-available rounded-full px-2 py-0.5' : 'theme-chat-danger'}`}>
                              {item.available ? 'Available now' : 'Unavailable now'}
                            </span>
                            <button
                              type="button"
                              disabled={!item.available}
                              onClick={() => handleAddToCart(item)}
                              className="theme-chat-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-100"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add to cart
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <p role="status" className="theme-chat-surface w-fit rounded-2xl px-3 py-2 text-xs">
                BiteBuddy is typing…
              </p>
            )}
            <div />
          </div>

          <div className="space-y-2 border-t border-[var(--color-border)] p-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={typing}
                  onClick={() => void submitMessage(reply)}
                  className="theme-chat-surface shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-[var(--color-bg-secondary)] disabled:opacity-100"
                >
                  {reply}
                </button>
              ))}
            </div>
            {error && <p role="alert" className="theme-chat-danger text-xs font-medium">{error}</p>}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                aria-label="Message BiteBuddy"
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 300))}
                maxLength={300}
                placeholder="Ask about the menu…"
                className="theme-control min-w-0 flex-1 rounded-full border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || typing}
                className="theme-chat-inverse flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-100"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close BiteBuddy chat' : 'Open BiteBuddy'}
        aria-expanded={open}
        className="px-btn fixed bottom-[5.25rem] right-4 z-[60] h-14 w-14 animate-bob p-0 shadow-xl md:bottom-6"
      >
        {open ? <X className="h-6 w-6" /> : (
          <span className="theme-pixel-tile h-10 w-10 rounded-lg">
            <PixelBot size={32} />
          </span>
        )}
      </button>
    </>
  );
};
