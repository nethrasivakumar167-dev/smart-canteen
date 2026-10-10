import { formatPickupSlotLabel, minutesUntilPickupSlot } from '../config/pickupSlots';

export interface FormattedOrder {
  id: string;
  orderNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveredAt: Date | null;
  deliveredById: string | null;
  createdAt: Date;
  updatedAt: Date;
  pickupSlotStart: Date | null;
  pickupSlot: string | null;
  estimatedMinutes: number | null;
  items: Array<{
    id: string;
    menuItemId: string;
    name: string;
    quantity: number;
    priceAtPurchase: number;
    price: number;
    itemTotal: number;
    imageUrl: string;
    categoryName: string;
    cookingTip: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    transactionRef: string | null;
    createdAt: Date;
  }>;
  feedback: null | {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    items: Array<{ menuItemId: string; tags: string[] }>;
  };
}

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatOrder(order: any): FormattedOrder {
  const totalNum = typeof order.totalAmount === 'number' ? order.totalAmount : Number(order.totalAmount);
  const pickupSlotStart: Date | null = order.pickupSlotStart || null;
  const delivered = order.orderStatus === 'DELIVERED';
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    studentId: order.studentId,
    studentName: order.student?.name || '',
    studentEmail: order.student?.email || '',
    totalAmount: totalNum,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    deliveredAt: order.deliveredAt,
    deliveredById: order.deliveredById,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    pickupSlotStart,
    pickupSlot: pickupSlotStart ? formatPickupSlotLabel(pickupSlotStart) : null,
    estimatedMinutes: delivered ? null : minutesUntilPickupSlot(pickupSlotStart),
    items: order.items
      ? order.items.map((i: any) => {
          const priceNum = typeof i.priceAtPurchase === 'number' ? i.priceAtPurchase : Number(i.priceAtPurchase);
          return {
            id: i.id,
            menuItemId: i.menuItemId,
            name: i.menuItem?.name || 'Menu Item',
            quantity: i.quantity,
            priceAtPurchase: priceNum,
            price: priceNum,
            itemTotal: priceNum * i.quantity,
            imageUrl: i.menuItem?.imageUrl || '',
            categoryName: i.menuItem?.category?.name || '',
            cookingTip: i.menuItem?.cookingTip || null,
          };
        })
      : [],
    payments: order.payments
      ? order.payments.map((p: any) => ({
          id: p.id,
          amount: typeof p.amount === 'number' ? p.amount : Number(p.amount),
          method: p.method,
          status: p.status,
          transactionRef: p.transactionRef,
          createdAt: p.createdAt,
        }))
      : [],
    feedback: order.feedback
      ? {
          id: order.feedback.id,
          rating: order.feedback.rating,
          comment: order.feedback.comment,
          createdAt: order.feedback.createdAt,
          items: (order.feedback.items || []).map((item: any) => ({
            menuItemId: item.menuItemId,
            tags: item.tags || [],
          })),
        }
      : null,
  };
}
