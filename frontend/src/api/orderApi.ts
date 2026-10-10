import axios from 'axios';

export interface CreateOrderPayload {
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: Array<{
      groupName: string;
      selectedOption: string;
      additionalPrice: number;
    }>;
  }>;
  paymentMethod: 'CASH' | 'DEMO' | 'UPI' | 'CARD' | 'ONLINE_MOCK';
  specialInstructions?: string;
  scheduledTime?: string;
  pickupSlotStart?: string;
}

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await axios.post('/student/orders', payload);
  return response.data;
};

export const fetchStudentOrders = async () => {
  const response = await axios.get('/student/orders');
  return response.data;
};

export const fetchStudentOrderById = async (id: string) => {
  const response = await axios.get(`/student/orders/${id}`);
  return response.data;
};
