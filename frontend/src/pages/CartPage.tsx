import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { MOCK_COUPONS } from '../data/mockData';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  Award,
  Zap,
  CreditCard,
  QrCode,
  ShieldCheck,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
    pickupOption,
    setPickupOption,
    scheduledTime,
    specialInstructions,
    setSpecialInstructions,
    getSubtotal,
    getTax,
    getDiscount,
    getGrandTotal,
    getEstimatedPreparationTime,
    getLoyaltyPointsEarnable,
  } = useCartStore();

  const { addToast } = useToastStore();

  const [couponInput, setCouponInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'DEMO' | 'UPI' | 'CARD' | 'CASH'>('DEMO');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState<boolean>(false);

  const subtotal = getSubtotal();
  const tax = getTax();
  const discount = getDiscount();
  const grandTotal = getGrandTotal();
  const estimatedPrepTime = getEstimatedPreparationTime();
  const earnablePoints = getLoyaltyPointsEarnable();

  const handleApplyCustomCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const found = MOCK_COUPONS.find((c) => c.code.toUpperCase() === couponInput.trim().toUpperCase());
    if (found) {
      const success = applyCoupon(found);
      if (success) {
        addToast({
          type: 'success',
          title: 'Coupon Applied!',
          message: `Saved ₹${discount || found.discountValue} with ${found.code}`,
        });
      }
    } else {
      addToast({
        type: 'error',
        title: 'Invalid Coupon',
        message: 'This promo code does not exist or has expired.',
      });
    }
  };

  const handleQuickApply = (code: string) => {
    const found = MOCK_COUPONS.find((c) => c.code === code);
    if (found) {
      const success = applyCoupon(found);
      if (success) {
        setCouponInput(code);
        addToast({
          type: 'success',
          title: 'Coupon Applied!',
          message: `Discount code ${code} activated.`,
        });
      }
    }
  };

  const handleSimulateCheckout = () => {
    if (items.length === 0) return;
    setIsPlacingOrder(true);

    setTimeout(() => {
      setIsPlacingOrder(false);
      setOrderSuccessModal(true);
      addToast({
        type: 'success',
        title: 'Preorder Placed Successfully!',
        message: `Order #SC-1024 registered in kitchen queue.`,
      });
    }, 1200);
  };

  if (items.length === 0 && !orderSuccessModal) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-950/50 text-brand-500 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-12 h-12" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Your Preorder Cart is Empty
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Looks like you haven't added any dishes yet. Explore today's freshly prepared campus menu.
          </p>
        </div>

        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 text-white font-extrabold text-sm shadow-lg hover:shadow-glow transition transform hover:-translate-y-0.5"
        >
          <span>Explore Campus Menu</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Review Your Preorder
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {items.reduce((acc, i) => acc + i.quantity, 0)} items in your cart
          </p>
        </div>

        <button
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
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
                className="bg-white dark:bg-dark-surface p-4 rounded-2xl border border-gray-200/80 dark:border-dark-border shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100"
                  />
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
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                    </div>

                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.customizations.map((c) => c.selectedOption).join(', ')}
                      </p>
                    )}

                    <div className="text-xs font-bold text-brand-600 dark:text-brand-400 font-mono mt-1">
                      ₹{item.price} each
                    </div>
                  </div>
                </div>

                {/* Stepper & Total */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-gray-100 dark:bg-dark-card rounded-xl p-1 border border-gray-200 dark:border-dark-border">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-dark-surface flex items-center justify-center text-gray-700 dark:text-gray-200 text-xs shadow-sm hover:bg-brand-500 hover:text-white transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-dark-surface flex items-center justify-center text-gray-700 dark:text-gray-200 text-xs shadow-sm hover:bg-brand-500 hover:text-white transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right min-w-[60px]">
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white font-mono">
                      ₹{item.itemTotal}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 hover:text-red-500 p-1 transition"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pickup Slot Selection */}
          <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" />
              Pickup Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPickupOption('ASAP')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  pickupOption === 'ASAP'
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm">⚡ ASAP (Fastest Handover)</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Ready in ~{estimatedPrepTime} minutes
                  </div>
                </div>
                {pickupOption === 'ASAP' && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
              </button>

              <button
                type="button"
                onClick={() => setPickupOption('SCHEDULED', '12:45 PM (Lunch Recess)')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                  pickupOption === 'SCHEDULED'
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm">🕒 Scheduled Preorder</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    12:45 PM (Recess Time)
                  </div>
                </div>
                {pickupOption === 'SCHEDULED' && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
              </button>
            </div>
          </div>

          {/* Cooking Notes / Special Instructions */}
          <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              Kitchen Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Less spicy, pack chutney separately, extra hot coffee..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

        </div>

        {/* Right Column: Order Summary, Coupons, Payment & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Coupon Box */}
          <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-500" />
              Apply Campus Coupon
            </h3>

            {coupon ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                <div className="text-xs">
                  <span className="font-extrabold font-mono">{coupon.code}</span> applied!
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {coupon.description}
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCustomCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. WELCOME20)"
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-dark-border text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs shadow-sm hover:bg-gray-800"
                >
                  Apply
                </button>
              </form>
            )}

            {couponError && (
              <div className="flex items-center gap-1.5 text-xs text-red-500">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{couponError}</span>
              </div>
            )}

            {/* Quick Coupon Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {MOCK_COUPONS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleQuickApply(c.code)}
                  className="px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 text-[11px] font-mono font-bold hover:bg-brand-100"
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-500" />
              Payment Mode
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPaymentMethod('DEMO')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'DEMO'
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>⚡ Demo Instant Pay</span>
                {paymentMethod === 'DEMO' && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'UPI'
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>📱 UPI / QR</span>
                {paymentMethod === 'UPI' && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'CARD'
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>💳 Campus / Debit Card</span>
                {paymentMethod === 'CARD' && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                  paymentMethod === 'CASH'
                    ? 'bg-brand-50 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                    : 'bg-gray-50 dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>💵 Pay at Pickup Counter</span>
                {paymentMethod === 'CASH' && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
              </button>
            </div>
          </div>

          {/* Bill Summary Box */}
          <div className="p-5 bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Bill Breakdown
            </h3>

            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Taxes (5%)</span>
                <span className="font-mono">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Campus Preorder Fee</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">FREE (₹0.00)</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span className="font-mono">-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 dark:border-dark-border flex justify-between items-baseline text-base font-extrabold text-gray-900 dark:text-white">
                <span>To Pay</span>
                <span className="text-xl font-mono text-brand-600 dark:text-brand-400">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Smart Points Banner */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Loyalty Reward:
              </span>
              <span>+{earnablePoints} Smart Points</span>
            </div>

            {/* Place Order CTA Button */}
            <button
              onClick={handleSimulateCheckout}
              disabled={isPlacingOrder}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white font-extrabold text-base shadow-lg hover:shadow-glow transition transform active:scale-98 disabled:opacity-50"
            >
              {isPlacingOrder ? (
                <span>Dispatching Order to Kitchen...</span>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white" />
                  <span>Confirm Preorder • ₹{grandTotal.toFixed(2)}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Safe 256-bit encrypted checkout with instant QR receipt</span>
            </div>
          </div>

        </div>
      </div>

      {/* Simulated Order Success Modal */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-dark-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-gray-200 dark:border-dark-border shadow-2xl text-center space-y-5">
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-brand-600 uppercase tracking-wider">
                Order Received in Kitchen
              </span>
              <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Preorder #SC-1024
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pickup Slot: <strong>{scheduledTime}</strong>
              </p>
            </div>

            {/* Mock QR Pass */}
            <div className="p-4 bg-gray-50 dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border flex flex-col items-center gap-2">
              <QrCode className="w-32 h-32 text-gray-900 dark:text-white" />
              <span className="text-[10px] font-mono text-gray-400">
                TOKEN: 7F9E-4B2A-88C1
              </span>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              🍱 You are <strong>#3 in the kitchen queue</strong> (~{estimatedPrepTime} mins estimated)
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOrderSuccessModal(false);
                  clearCart();
                  navigate('/menu');
                }}
                className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-md hover:bg-brand-600 transition"
              >
                Back to Menu
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
