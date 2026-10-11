import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { fetchStudentOrders } from '../api/orderApi';
import { Order, OrderFeedback } from '../types';
import { Star, MessageSquareText, Send } from 'lucide-react';
import { PixelIcon } from '../components/pixel/PixelIcon';

const FEEDBACK_TAGS = [
  'too_spicy',
  'too_salty',
  'bland',
  'cold',
  'undercooked',
  'oily',
  'small_portion',
  'great_taste',
];

const tagLabel = (tag: string) => tag.replace(/_/g, ' ');

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [itemTags, setItemTags] = useState<Record<string, Record<string, string[]>>>({});
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    fetchStudentOrders()
      .then((response) => {
        if (active && response.success) setOrders(response.data || []);
      })
      .catch((error: any) => {
        if (active) setErrors({ page: error.response?.data?.error || error.message || 'Could not load order history.' });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleTag = (orderId: string, menuItemId: string, tag: string) => {
    setItemTags((current) => {
      const orderTags = current[orderId] || {};
      const tags = orderTags[menuItemId] || [];
      return {
        ...current,
        [orderId]: {
          ...orderTags,
          [menuItemId]: tags.includes(tag) ? tags.filter((value) => value !== tag) : [...tags, tag],
        },
      };
    });
  };

  const submitFeedback = async (order: Order) => {
    setSubmittingOrderId(order.id);
    setErrors((current) => ({ ...current, [order.id]: '' }));
    try {
      const response = await axios.post(`/student/orders/${order.orderNumber}/feedback`, {
        rating: ratings[order.id] || 5,
        comment: comments[order.id] || undefined,
        items: order.items.map((item) => ({
          menuItemId: item.menuItemId,
          tags: itemTags[order.id]?.[item.menuItemId] || [],
        })),
      });
      const feedback: OrderFeedback = {
        ...response.data.data,
        createdAt: response.data.data.createdAt || new Date().toISOString(),
        items: response.data.data.items || [],
      };
      setOrders((current) => current.map((entry) =>
        entry.id === order.id ? { ...entry, feedback } : entry
      ));
      setFeedbackOrderId(null);
    } catch (error: any) {
      setErrors((current) => ({
        ...current,
        [order.id]: error.response?.data?.error || error.response?.data?.message || error.message || 'Could not submit feedback.',
      }));
    } finally {
      setSubmittingOrderId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 bg-beige min-h-[60vh]">
      <div className="border-b border-line pb-4">
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">Order History</h1>
        <p className="mt-1 text-sm text-espresso">Your campus orders and feedback.</p>
      </div>
      {loading ? (
        <div className="py-12 text-center text-sm font-semibold text-espresso">Loading orders...</div>
      ) : errors.page ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errors.page}</div>
      ) : orders.length === 0 ? (
        <div className="px-card rounded-2xl p-10 text-center text-sm font-semibold text-espresso">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="px-card space-y-4 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-line pb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-slateblue">Order #{order.orderNumber}</h2>
                  <p className="mt-1 text-xs text-espresso">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                  <span className="px-chip">{order.orderStatus.replace(/_/g, ' ')}</span>
                  <span className="px-chip bg-cream">{order.paymentMethod}</span>
                </div>
              </div>
                {order.pickupSlot && (
                  <div className="rounded-xl bg-cream px-3 py-2 text-xs text-espresso">
                    Pickup slot: <strong>{order.pickupSlot}</strong>
                    {order.estimatedMinutes !== null && order.estimatedMinutes !== undefined && (
                      <span className="ml-2">({order.estimatedMinutes} min remaining)</span>
                    )}
                  </div>
                )}
              {order.specialInstructions && (
                <div className="px-card rounded-xl bg-butter p-3 text-navy">
                  <div className="text-[11px] font-bold uppercase tracking-wider">Cooking instruction</div>
                  <p className="mt-1 text-xs font-medium">{order.specialInstructions}</p>
                </div>
              )}
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm text-slateblue">
                    <span>{item.quantity} × {item.name}</span>
                    <span className="font-semibold">₹{item.priceAtPurchase * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-sm font-extrabold text-slateblue">
                <span>Total</span><span>₹{order.totalAmount}</span>
              </div>

              {order.orderStatus === 'DELIVERED' && (
                order.feedback ? (
                  <div className="rounded-2xl border border-line bg-cream p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slateblue">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                      {order.feedback.rating}/5
                    </div>
                    {order.feedback.comment && <p className="text-sm text-espresso">{order.feedback.comment}</p>}
                    {order.feedback.items.some((entry) => entry.tags.length > 0) && (
                      <div className="space-y-2">
                        {order.feedback.items.filter((entry) => entry.tags.length > 0).map((entry) => (
                          <div key={entry.menuItemId} className="flex flex-wrap gap-1.5">
                            {entry.tags.map((tag) => <span key={tag} className="px-chip bg-sand">{tagLabel(tag)}</span>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : feedbackOrderId === order.id ? (
                  <div className="rounded-2xl border border-line bg-cream p-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slateblue" htmlFor={`rating-${order.id}`}>Rating</label>
                      <select id={`rating-${order.id}`} value={ratings[order.id] || 5} onChange={(event) => setRatings((current) => ({ ...current, [order.id]: Number(event.target.value) }))} className="mt-1 rounded-xl border border-line bg-sand px-3 py-2 text-sm text-slateblue">
                        {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                      </select>
                    </div>
                    <label className="block text-xs font-bold text-slateblue">
                      Comment (optional)
                      <textarea value={comments[order.id] || ''} onChange={(event) => setComments((current) => ({ ...current, [order.id]: event.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-line bg-sand p-3 text-sm font-normal text-slateblue focus:outline-none focus:ring-2 focus:ring-skyblue" />
                    </label>
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slateblue">Tell us about each item</p>
                      {order.items.map((item) => (
                        <div key={item.menuItemId} className="space-y-2">
                          <p className="text-xs font-semibold text-espresso">{item.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {FEEDBACK_TAGS.map((tag) => {
                              const checked = itemTags[order.id]?.[item.menuItemId]?.includes(tag) || false;
                              return (
                                <button key={tag} type="button" onClick={() => toggleTag(order.id, item.menuItemId, tag)} className={`px-chip ${checked ? 'bg-skyblue' : 'bg-sand'}`}>
                                  {tagLabel(tag)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors[order.id] && <p role="alert" className="text-xs font-semibold text-red-700">{errors[order.id]}</p>}
                    <div className="flex gap-2">
                      <button type="button" disabled={submittingOrderId === order.id} onClick={() => submitFeedback(order)} className="px-btn disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-3.5 w-3.5" />{submittingOrderId === order.id ? 'Submitting...' : 'Submit feedback'}</button>
                      <button type="button" onClick={() => setFeedbackOrderId(null)} className="px-btn px-btn--cream">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setFeedbackOrderId(order.id); setErrors((current) => ({ ...current, [order.id]: '' })); }} className="px-btn px-btn--sky">
                    <MessageSquareText className="h-4 w-4" />Rate this order
                  </button>
                )
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
