import axios from 'axios';
import { MenuItem } from '../types';

export interface KitchenStatus {
  activeOrdersCount: number;
  averageRating: number | null;
  feedbackCount: number;
}

export const KITCHEN_LOAD_THRESHOLDS = {
  busyAt: 4,
  rushAt: 8,
} as const;

export const getKitchenActivity = (activeOrdersCount: number) => ({
  label: activeOrdersCount >= KITCHEN_LOAD_THRESHOLDS.rushAt
    ? 'Rush'
    : activeOrdersCount >= KITCHEN_LOAD_THRESHOLDS.busyAt
      ? 'Busy'
      : 'Quiet',
  loadPercent: Math.min(
    100,
    Math.round((activeOrdersCount / KITCHEN_LOAD_THRESHOLDS.rushAt) * 100)
  ),
});

export const fetchAvailableMenuItems = async (): Promise<MenuItem[]> => {
  const response = await axios.get<{ success: boolean; data: MenuItem[] }>('/menu');
  if (!response.data?.success || !Array.isArray(response.data.data)) {
    throw new Error('The menu API returned an invalid response.');
  }
  return response.data.data;
};

export const fetchKitchenStatus = async (): Promise<KitchenStatus> => {
  const response = await axios.get<{ success: boolean; data: KitchenStatus }>(
    '/public/kitchen-status'
  );
  if (!response.data?.success || !response.data.data) {
    throw new Error('The kitchen status API returned an invalid response.');
  }
  return response.data.data;
};
