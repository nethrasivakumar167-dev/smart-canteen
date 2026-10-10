import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { createOrder } from '../api/orderApi';
import axios from 'axios';
import { fetchMenuItems } from '../api/menuApi';
import { MenuItem } from '../types';
import { FoodImage, hasUsableMenuImage } from '../components/common/FoodImage';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    specialInstructions,
    setSpecialInstructions,
    getSubtotal,
    getGrandTotal,
  } = useCartStore();

  const { addToast } = useToastStore();

  const [paymentMethod, setPaymentMethod] = useState<'DEMO' | 'UPI' | 'CARD' | 'CASH'>('DEMO');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<boolean>(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [pickupSlots, setPickupSlots] = useState<Array<{
    start: string;
    end: string;
    label: string;
    remainingCapacity: number;
    bookable: boolean;
    unavailableReason: string | null;
  }>>([]);
  const [selectedSlotStart, setSelectedSlotStart] = useState('');
  const [slotItems, setSlotItems] = useState<Map<string, MenuItem>>(new Map());
  const [slotsLoading, setSlotsLoading] = useState(true);

  const subtotal = getSubtotal();
  const grandTotal = getGrandTotal();
  const selectedSlot = pickupSlots.find((slot) => slot.start === selectedSlotStart);

  React.useEffect(() => {
    let active = true;
    axios.get('/student/slots')
      .then((response) => {
        if (!active || !response.data.success) return;
        const slots = response.data.data || [];
        setPickupSlots(slots);
        setSelectedSlotStart(slots.find((slot: any) => slot.bookable)?.start || '');
      })
      .catch((error) => {
        if (active) addToast({
          type: 'error',
          title: 'Pickup slots unavailable',
          message: error.response?.data?.error || error.message || 'Could not load pickup slots.',
        });
      })
      .finally(() => { if (active) setSlotsLoading(false); });
    return () => { active = false; };
  }, [addToast]);

  React.useEffect(() => {
    if (!selectedSlotStart || items.length === 0) {
      setSlotItems(new Map());
      return;
    }
    let active = true;
    fetchMenuItems({ availableAt: selectedSlotStart })
      .then((results) => {
        if (active) setSlotItems(new Map(results.map((item) => [item.id, item])));
      });
    return () => { active = false; };
  }, [selectedSlotStart, items]);

  const unavailableAtSlot = items.filter((cartItem) => {
    const menuItem = slotItems.get(cartItem.menuItemId);
    return Boolean(menuItem && menuItem.availableNow === false);
  });

  const handleSimulateCheckout = async () => {
    if (items.length === 0) return;

    if (!isAuthenticated) {
      addToast({
        type: 'info',
        title: 'Authentication Required',
        message: 'Please sign in to your student account to place preorders.',
      });
      navigate('/student/login');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const payload = {
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          customizations: i.customizations,
        })),
        paymentMethod,
        specialInstructions,
        pickupSlotStart: selectedSlotStart,
      };

      const res = await createOrder(payload);

      if (res.success && res.data) {
        setPlacedOrder(res.data);
        clearCart();
        setOrderSuccessModal(true);
        addToast({
          type: 'success',
          title: 'Preorder Placed Successfully!',
          message: `Order #${res.data.orderNumber} registered in kitchen queue.`,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Order Failed',
          message: res.error || 'Failed to place order. Please try again.',
        });
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unable to complete order. Please check item availability.';
      addToast({
        type: 'error',
        title: 'Order Placement Error',
        message: errMsg,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0 && !orderSuccessModal) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6 bg-beige">
        <div className="w-24 h-24 rounded-full bg-navy/10 text-navy flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-navy">
            Your Preorder Cart is Empty
          </h2>
          <p className="text-sm text-espresso">
            Looks like you haven't added any dishes yet. Explore today's freshly prepared campus menu.
          </p>
        </div>

        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-navy to-slate text-cream font-extrabold text-sm shadow-lg hover:shadow-glow transition transform hover:-translate-y-0.5"
        >
          <span>Explore Campus Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 bg-beige">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            Review Your Preorder
          </h1>
          <p className="text-xs sm:text-sm text-espresso mt-0.5">
            {items.reduce((acc, i) => acc + i.quantity, 0)} items in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Cart Items & Customizations & Pickup Slot */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Cart Items List */}
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-sand p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CartFoodImage imageUrl={item.imageUrl} name={item.name} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {item.isVegetarian ? (
                        <span className="veg-badge shrink-0">
                          <span className="veg-badge-dot" />
                        </span>
                      ) : (
                        <span className="non-veg-badge shrink-0">
                          <span className="non-veg-badge-dot" />
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-navy truncate">
                        {item.name}
                      </h4>
                    </div>

                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[11px] text-espresso truncate mt-0.5">
                        {item.customizations.map((c) => c.selectedOption).join(', ')}
                      </p>
                    )}

                    <div className="text-xs font-bold text-navy font-mono mt-1">
                      ₹{item.price} each
                    </div>
                  </div>
                </div>

                {/* Stepper & Total */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-cream border border-line rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-cream text-navy flex items-center justify-center text-xs shadow-sm hover:bg-navy hover:text-cream transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono text-navy">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-cream text-navy flex items-center justify-center text-xs shadow-sm hover:bg-navy hover:text-cream transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[60px]">
                    <span className="text-sm font-extrabold text-navy font-mono">
                      ₹{item.itemTotal}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-espresso hover:text-red-500 p-1 transition"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pickup Slot Selection */}
          <div className="p-5 bg-sand border border-line rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <Clock className="w-4 h-4 text-navy" />
              Pickup Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slotsLoading ? (
                <p className="col-span-full text-xs text-espresso">Loading available pickup slots...</p>
              ) : pickupSlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  disabled={!slot.bookable}
                  onClick={() => setSelectedSlotStart(slot.start)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedSlotStart === slot.start
                      ? 'bg-navy text-cream border-navy shadow-sm'
                      : 'bg-cream border-line text-navy'
                  }`}
                >
                  <span className="text-xs font-bold">{slot.label}</span>
                  {!slot.bookable ? (
                    <span className="text-[10px] font-semibold">
                      {slot.unavailableReason === 'Full'
                        ? 'Full'
                        : slot.unavailableReason === 'Past'
                          ? 'Past'
                          : 'Soon'}
                    </span>
                  ) : selectedSlotStart === slot.start ? (
                    <CheckCircle2 className="w-4 h-4 text-cream" />
                  ) : null}
                </button>
              ))}
            </div>
            {unavailableAtSlot.length > 0 && (
              <p role="alert" className="text-xs font-semibold text-amber-700">
                Not available at this slot: {unavailableAtSlot.map((item) => item.name).join(', ')}.
              </p>
            )}
            {!selectedSlotStart && !slotsLoading && (
              <p role="alert" className="text-xs font-semibold text-red-700">No pickup slot is currently bookable. Please try again later.</p>
            )}
          </div>

          {/* Cooking Notes / Special Instructions */}
          <div className="p-5 bg-sand border border-line rounded-2xl shadow-sm space-y-2">
            <label className="text-xs font-bold text-espresso block">
              Kitchen Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, pack chutney separately, extra hot coffee..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-line text-xs sm:text-sm text-navy placeholder:text-espresso/50 focus:outline-none focus:ring-2 focus:ring-skyblue/50"
            />
          </div>

        </div>

        {/* Right Column: Order Summary, Payment & Checkout */}
        <div className="lg:col-span-5 space-y-6">

          {/* Payment Method Selector */}
          <div className="p-5 bg-sand border border-line rounded-2xl shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-navy" />
              Payment Mode
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod('DEMO')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'DEMO'
                    ? 'bg-navy text-cream border-navy font-bold'
                    : 'bg-white border-line text-navy'
                }`}
              >
                <span>⚡ Demo Instant Pay</span>
                {paymentMethod === 'DEMO' && <CheckCircle2 className="w-4 h-4 text-cream" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'UPI'
                    ? 'bg-navy text-cream border-navy font-bold'
                    : 'bg-white border-line text-navy'
                }`}
              >
                <span>📱 UPI / QR</span>
                {paymentMethod === 'UPI' && <CheckCircle2 className="w-4 h-4 text-cream" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'CARD'
                    ? 'bg-navy text-cream border-navy font-bold'
                    : 'bg-white border-line text-navy'
                }`}
              >
                <span>💳 Campus / Debit Card</span>
                {paymentMethod === 'CARD' && <CheckCircle2 className="w-4 h-4 text-cream" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'CASH'
                    ? 'bg-navy text-cream border-navy font-bold'
                    : 'bg-white border-line text-navy'
                }`}
              >
                <span>💵 Pay at Pickup Counter</span>
                {paymentMethod === 'CASH' && <CheckCircle2 className="w-4 h-4 text-cream" />}
              </button>
            </div>
          </div>

          {/* Bill Summary Box */}
          <div className="p-5 bg-sand border border-line rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy">
              Bill Breakdown
            </h3>

            <div className="space-y-2 text-xs text-espresso">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-navy">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Preorder Fee</span>
                <span className="font-mono text-emerald-600 font-bold">FREE (₹0.00)</span>
              </div>

              <div className="pt-3 border-t border-line flex justify-between items-baseline text-base font-extrabold text-navy">
                <span>To Pay</span>
                <span className="text-xl font-mono text-navy">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handleSimulateCheckout}
              disabled={isPlacingOrder}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-navy to-slate hover:from-slate hover:to-navy text-cream font-extrabold text-base shadow-lg hover:shadow-glow transition transform active:scale-98 disabled:opacity-50"
            >
              {isPlacingOrder ? (
                <span>Dispatching Order to Kitchen...</span>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-cream" />
                  <span>Confirm Preorder • ₹{grandTotal.toFixed(2)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-espresso text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Safe 256-bit encrypted checkout</span>
            </div>
          </div>

        </div>
      </div>

      {/* Real Order Success Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-sand rounded-3xl max-w-md w-full p-6 sm:p-8 border border-line shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-navy uppercase tracking-wider">
                Order Received in Kitchen
              </span>
              <h3 className="text-2xl font-extrabold text-navy">
                Preorder #{placedOrder?.orderNumber || 'SC-1024'}
              </h3>
              <p className="text-xs text-espresso">
                Pickup Slot: <strong>{placedOrder?.pickupSlot || selectedSlot?.label || '—'}</strong>
              </p>
            </div>

            {/* Order Token */}
            <div className="p-4 bg-cream rounded-2xl border border-line flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-xl bg-navy text-cream flex items-center justify-center font-mono text-[11px] font-bold">
                {placedOrder?.orderNumber || 'SC-1024'}
              </div>
              <span className="text-[10px] font-mono text-espresso">
                Order ID: {placedOrder?.orderNumber || 'SC-1024'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOrderSuccessModal(false);
                  navigate('/student/dashboard');
                }}
                className="flex-1 py-3 rounded-xl bg-navy text-cream font-bold text-xs shadow-md hover:bg-slate transition"
              >
                Go to Student Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

const CartFoodImage: React.FC<{ imageUrl: string; name: string }> = ({ imageUrl, name }) => {
  const [showImage, setShowImage] = useState(() => hasUsableMenuImage(imageUrl));
  if (!showImage) return null;
  return (
    <FoodImage
      imageUrl={imageUrl}
      alt={name}
      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-cream"
      onError={() => setShowImage(false)}
    />
  );
};