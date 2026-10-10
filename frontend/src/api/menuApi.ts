import axios from 'axios';
import { Category, MenuItem } from '../types';

export interface GetMenuParams {
  q?: string;
  category?: string;
  cuisine?: string;
  diet?: string;
  spice?: string;
  availableNow?: boolean;
  availableAt?: string;
  excludeAllergens?: string[];
}

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const res = await axios.get('/categories');
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
};

export const fetchMenuItems = async (params?: GetMenuParams): Promise<MenuItem[]> => {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.q) queryParams.q = params.q;
    if (params?.category) queryParams.category = params.category;
    if (params?.cuisine) queryParams.cuisine = params.cuisine;
    if (params?.diet) queryParams.diet = params.diet;
    if (params?.spice) queryParams.spice = params.spice;
    if (params?.availableNow !== undefined) queryParams.availableNow = String(params.availableNow);
    if (params?.availableAt) queryParams.availableAt = params.availableAt;
    if (params?.excludeAllergens?.length) queryParams.excludeAllergens = params.excludeAllergens.join(',');

    const res = await axios.get('/menu/items', { params: queryParams });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return [];
  }
};

export const fetchMenuItemById = async (id: string): Promise<MenuItem | null> => {
  try {
    const res = await axios.get(`/menu/${id}`);
    if (res.data && res.data.success && res.data.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch menu item with id ${id}:`, error);
    return null;
  }
};
