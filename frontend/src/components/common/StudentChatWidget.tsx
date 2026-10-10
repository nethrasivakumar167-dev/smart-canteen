import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Plus, Send, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { sendChatMessage, ChatItemResult, ChatTurn } from '../../api/chatApi';
import { useCartStore } from '../../store/cartStore';
import { useToastStore } from '../../store/toastStore';

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
  text: 'Hi! Ask me about today’s specials, dishes, or what’s available.',
};

function errorText(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: unknown } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return 'Sorry, I couldn’t reach the canteen assistant. Please try again.';
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
          aria-label="Student canteen chat"
          className="fixed bottom-[5.25rem] right-3 z-[60] flex max-h-[calc(100dvh-7rem)] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-cream shadow-2xl md:bottom-6"
        >
          <header className="flex items-center justify-between bg-navy px-4 py-3 text-cream">
            <div>
              <h2 className="font-serif text-lg font-semibold">CampusBite Assistant</h2>
              <p className="text-[11px] text-skyblue">Menu, specials & availability</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-2 text-cream transition hover:bg-slateblue-light"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="stripe-band shrink-0" />

          <div ref={messageListRef} className="min-h-36 flex-1 space-y-3 overflow-y-auto bg-cream p-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <p
                    className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-navy text-cream'
                        : 'rounded-bl-md border border-line bg-sand text-navy'
                    }`}
                  >
                    {message.text}
                  </p>
                  {!!message.items?.length && (
                    <div className="space-y-2">
                      {message.items.map((item) => (
                        <article key={item.id} className="rounded-xl border border-line bg-sand p-3 text-navy">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-serif text-sm font-semibold">{item.name}</h3>
                            <span className="shrink-0 font-mono text-sm font-bold">₹{item.price}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${item.available ? 'text-emerald-700' : 'text-rust'}`}>
                              {item.available ? 'Available now' : 'Unavailable now'}
                            </span>
                            <button
                              type="button"
                              disabled={!item.available}
                              onClick={() => handleAddToCart(item)}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
              <p role="status" className="w-fit rounded-2xl bg-sand px-3 py-2 text-xs text-espresso">
                Assistant is typing…
              </p>
            )}
            <div />
          </div>

          <div className="space-y-2 border-t border-line bg-cream p-3">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={typing}
                  onClick={() => void submitMessage(reply)}
                  className="shrink-0 rounded-full border border-line bg-sand px-3 py-1.5 text-[11px] font-semibold text-navy transition hover:border-emerald-700 hover:bg-skysoft disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>
            {error && <p role="alert" className="text-xs font-medium text-rust">{error}</p>}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                aria-label="Message the canteen assistant"
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, 300))}
                maxLength={300}
                placeholder="Ask about the menu…"
                className="min-w-0 flex-1 rounded-full border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                aria-label="Send message"
                disabled={!input.trim() || typing}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-cream transition hover:bg-slateblue-light disabled:cursor-not-allowed disabled:opacity-50"
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
        aria-label={open ? 'Close canteen chat' : 'Open canteen chat'}
        aria-expanded={open}
        className="fixed bottom-[5.25rem] right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-navy text-cream shadow-xl transition hover:scale-105 hover:bg-slateblue-light md:bottom-6"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
};
