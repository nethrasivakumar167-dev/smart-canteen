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
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Zap,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { PixelIcon } from '../components/pixel/PixelIcon';

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6 theme-secondary-surface">
        <div className="w-24 h-24 rounded-full theme-secondary-surface theme-primary-text flex items-center justify-center mx-auto shadow-inner">
          <PixelIcon name="cart" size={48} />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold theme-primary-text">
            Your Preorder Cart is Empty
          </h2>
          <p className="text-sm theme-secondary-text">
            Looks like you haven't added any dishes yet. Explore today's freshly prepared campus menu.
          </p>
        </div>

        <Link to="/menu" className="px-btn">
          <span>Explore Campus Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 theme-secondary-surface">

      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b theme-border">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight theme-primary-text sm:text-3xl">
            Review Your Preorder
          </h1>
          <p className="text-xs sm:text-sm theme-secondary-text mt-0.5">
            {items.reduce((acc, i) => acc + i.quantity, 0)} items in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="px-btn px-btn--cream min-h-0 text-xs"
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
                className="px-card flex items-center justify-between gap-4 rounded-2xl p-4"
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
                      <h4 className="font-bold text-sm theme-primary-text truncate">
                        {item.name}
                      </h4>
                    </div>

                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[11px] theme-secondary-text truncate mt-0.5">
                        {item.customizations.map((c) => c.selectedOption).join(', ')}
                      </p>
                    )}

                    <div className="text-xs font-bold theme-primary-text font-mono mt-1">
                      ₹{item.price} each
                    </div>
                  </div>
                </div>

                {/* Stepper & Total */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center theme-surface border theme-border rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg theme-surface theme-primary-text flex items-center justify-center text-xs shadow-sm hover:theme-inverse-surface hover:theme-nav-text transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono theme-primary-text">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg theme-surface theme-primary-text flex items-center justify-center text-xs shadow-sm hover:theme-inverse-surface hover:theme-nav-text transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[60px]">
                    <span className="text-sm font-extrabold theme-primary-text font-mono">
                      ₹{item.itemTotal}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="theme-secondary-text hover:theme-danger-text p-1 transition"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pickup Slot Selection */}
          <div className="px-card space-y-3 rounded-2xl p-5">
            <h3 className="text-sm font-bold theme-primary-text flex items-center gap-2">
              <PixelIcon name="clock" size={16} />
              Pickup Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {slotsLoading ? (
                <p className="col-span-full text-xs theme-secondary-text">Loading available pickup slots...</p>
              ) : pickupSlots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  disabled={!slot.bookable}
                  onClick={() => setSelectedSlotStart(slot.start)}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between disabled:cursor-not-allowed disabled:opacity-100 ${
                    selectedSlotStart === slot.start
                      ? 'theme-inverse-surface theme-nav-text theme-strong-border shadow-sm'
                      : 'theme-surface theme-border theme-primary-text'
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
                    <PixelIcon name="check" size={16} />
                  ) : null}
                </button>
              ))}
            </div>
            {unavailableAtSlot.length > 0 && (
              <p role="alert" className="text-xs font-semibold theme-primary-text">
                Not available at this slot: {unavailableAtSlot.map((item) => item.name).join(', ')}.
              </p>
            )}
            {!selectedSlotStart && !slotsLoading && (
              <p role="alert" className="text-xs font-semibold theme-danger-text">No pickup slot is currently bookable. Please try again later.</p>
            )}
          </div>

          {/* Cooking Notes / Special Instructions */}
          <div className="p-5 theme-secondary-surface border theme-border rounded-2xl shadow-sm space-y-2">
            <label className="text-xs font-bold theme-secondary-text block">
              Kitchen Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              maxLength={500}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, pack chutney separately, extra hot coffee..."
              className="w-full px-3.5 py-2.5 rounded-xl theme-raised border theme-border text-xs sm:text-sm theme-primary-text placeholder:theme-secondary-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </div>

        </div>

        {/* Right Column: Order Summary, Payment & Checkout */}
        <div className="lg:col-span-5 space-y-6">

          {/* Payment Method Selector */}
          <div className="px-card space-y-3 rounded-2xl p-5">
            <h3 className="text-sm font-bold theme-primary-text flex items-center gap-2">
              <CreditCard className="w-4 h-4 theme-primary-text" />
              Payment Mode
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod('DEMO')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'DEMO'
                    ? 'theme-inverse-surface theme-nav-text theme-strong-border font-bold'
                    : 'theme-raised theme-border theme-primary-text'
                }`}
              >
                <span>⚡ Demo Instant Pay</span>
                {paymentMethod === 'DEMO' && <PixelIcon name="check" size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'UPI'
                    ? 'theme-inverse-surface theme-nav-text theme-strong-border font-bold'
                    : 'theme-raised theme-border theme-primary-text'
                }`}
              >
                <span>📱 UPI / QR</span>
                {paymentMethod === 'UPI' && <PixelIcon name="check" size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'CARD'
                    ? 'theme-inverse-surface theme-nav-text theme-strong-border font-bold'
                    : 'theme-raised theme-border theme-primary-text'
                }`}
              >
                <span>💳 Campus / Debit Card</span>
                {paymentMethod === 'CARD' && <PixelIcon name="check" size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'CASH'
                    ? 'theme-inverse-surface theme-nav-text theme-strong-border font-bold'
                    : 'theme-raised theme-border theme-primary-text'
                }`}
              >
                <span>💵 Pay at Pickup Counter</span>
                {paymentMethod === 'CASH' && <PixelIcon name="check" size={16} />}
              </button>
            </div>
          </div>

          {/* Bill Summary Box */}
          <div className="px-card space-y-4 rounded-2xl p-5">
            <h3 className="text-sm font-bold theme-primary-text">
              Bill Breakdown
            </h3>

            <div className="space-y-2 text-xs theme-secondary-text">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold theme-primary-text">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Preorder Fee</span>
                <span className="font-mono font-bold theme-primary-text">FREE (₹0.00)</span>
              </div>

              <div className="pt-3 border-t theme-border flex justify-between items-baseline text-base font-extrabold theme-primary-text">
                <span>To Pay</span>
                <span className="text-xl font-mono theme-primary-text">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handleSimulateCheckout}
              disabled={isPlacingOrder}
              className="px-btn w-full disabled:cursor-not-allowed disabled:opacity-100"
            >
              {isPlacingOrder ? (
                <span>Dispatching Order to Kitchen...</span>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  <span>Confirm Preorder • ₹{grandTotal.toFixed(2)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] theme-secondary-text text-center">
              <ShieldCheck className="w-3.5 h-3.5 theme-primary-text" />
              <span>Safe 256-bit encrypted checkout</span>
            </div>
          </div>

        </div>
      </div>

      {/* Real Order Success Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 theme-scrim backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="px-card max-w-md w-full space-y-5 rounded-2xl p-6 text-center animate-in zoom-in-95 sm:p-8">

            <div className="w-16 h-16 rounded-full theme-sky-surface theme-primary-text flex items-center justify-center mx-auto">
              <PixelIcon name="check" size={40} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold theme-primary-text uppercase tracking-wider">
                Order Received in Kitchen
              </span>
              <h3 className="text-2xl font-extrabold theme-primary-text">
                Preorder #{placedOrder?.orderNumber || 'SC-1024'}
              </h3>
              <p className="text-xs theme-secondary-text">
                Pickup Slot: <strong>{placedOrder?.pickupSlot || selectedSlot?.label || '—'}</strong>
              </p>
            </div>

            {/* Order Token */}
            <div className="p-4 theme-surface rounded-2xl border theme-border flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-xl theme-inverse-surface theme-nav-text flex items-center justify-center font-mono text-[11px] font-bold">
                {placedOrder?.orderNumber || 'SC-1024'}
              </div>
              <span className="text-[10px] font-mono theme-secondary-text">
                Order ID: {placedOrder?.orderNumber || 'SC-1024'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOrderSuccessModal(false);
                  navigate('/student/dashboard');
                }}
                className="px-btn flex-1"
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
  const [showImage, setShowImage] = useState(() => hasUsableMenuImage(imageUrl, name));
  if (!showImage) return null;
  return (
    <FoodImage
      imageUrl={imageUrl}
      alt={name}
      className="w-16 h-16 rounded-xl object-cover shrink-0 theme-surface"
      onError={() => setShowImage(false)}
    />
  );
};