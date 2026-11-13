import type { Recipe, RecipeOrder } from '../types/recipe';
import { INITIAL_RECIPES } from '../data/sampleRecipes';

export const RECIPES_STORAGE_KEY = 'cuanumkm_recipes_v1';
export const RECIPE_ORDERS_STORAGE_KEY = 'cuanumkm_recipe_orders_v1';
export const ADMIN_PIN_STORAGE_KEY = 'cuanumkm_admin_pin_v1';
export const DEFAULT_ADMIN_PIN = '1234';

export const INITIAL_RECIPE_ORDERS: RecipeOrder[] = [
  {
    id: 'ord_adm_1',
    recipeId: 'rcp_1',
    recipeTitle: 'Ayam Goreng Lengkuas Rempah Basah Renyah',
    recipePhoto:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80',
    sellerName: 'Bu Siti Rahayu',
    sellerWarung: 'Warung Berkah Nasi Ayam',
    sellerPhone: '0812-3456-7890',
    sellerCity: 'Jakarta Selatan',
    buyerName: 'Ibu Ratna Dewi',
    buyerPhone: '0857-4433-2211',
    buyerAddress: 'Jl. Tebet Barat Dalam No. 8, Tebet',
    buyerCity: 'Jakarta Selatan',
    distanceKm: 6.5,
    price: 250000,
    status: 'waiting_approval',
    paymentMethod: 'transfer',
    createdAt: '10 menit lalu',
  },
  {
    id: 'ord_adm_2',
    recipeId: 'rcp_1',
    recipeTitle: 'Ayam Goreng Lengkuas Rempah Basah Renyah',
    recipePhoto:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80',
    sellerName: 'Bu Siti Rahayu',
    sellerWarung: 'Warung Berkah Nasi Ayam',
    sellerPhone: '0812-3456-7890',
    sellerCity: 'Jakarta Selatan',
    buyerName: 'Mas Hendra Wijaya',
    buyerPhone: '0812-9090-1122',
    buyerAddress: 'Jl. Raya Pasar Minggu Gg. Melati No. 3',
    buyerCity: 'Jakarta Selatan',
    distanceKm: 0.85,
    price: 250000,
    status: 'waiting_approval',
    paymentMethod: 'qris',
    createdAt: '22 menit lalu',
  },
  {
    id: 'ord_adm_3',
    recipeId: 'rcp_1',
    recipeTitle: 'Ayam Goreng Lengkuas Rempah Basah Renyah',
    recipePhoto:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80',
    sellerName: 'Bu Siti Rahayu',
    sellerWarung: 'Warung Berkah Nasi Ayam',
    sellerPhone: '0812-3456-7890',
    sellerCity: 'Jakarta Selatan',
    buyerName: 'Pak Joko Santoso',
    buyerPhone: '0813-7766-5544',
    buyerAddress: 'Jl. Riau No. 18, Citarum',
    buyerCity: 'Bandung',
    distanceKm: 142,
    price: 250000,
    status: 'waiting_approval',
    paymentMethod: 'qris',
    createdAt: '1 jam lalu',
  },
  {
    id: 'ord_adm_4',
    recipeId: 'rcp_2',
    recipeTitle: 'Kuah Bakso Sapi Bening Gurih Kaldu Sumsum Asli',
    recipePhoto:
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80',
    sellerName: 'Cak Hadi Pranoto',
    sellerWarung: 'Bakso Sapi Asli Wonogiri Cak Hadi',
    sellerPhone: '0813-8899-7711',
    sellerCity: 'Malang',
    buyerName: 'Mbak Sari Lestari',
    buyerPhone: '0856-3322-8899',
    buyerAddress: 'Jl. Malioboro No. 40, Danurejan',
    buyerCity: 'Yogyakarta',
    distanceKm: 325,
    price: 350000,
    status: 'waiting_approval',
    paymentMethod: 'transfer',
    createdAt: '2 jam lalu',
  },
  {
    id: 'ord_adm_5',
    recipeId: 'rcp_1',
    recipeTitle: 'Ayam Goreng Lengkuas Rempah Basah Renyah',
    recipePhoto:
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80',
    sellerName: 'Bu Siti Rahayu',
    sellerWarung: 'Warung Berkah Nasi Ayam',
    sellerPhone: '0812-3456-7890',
    sellerCity: 'Jakarta Selatan',
    buyerName: 'Pak Ahmad Fauzi',
    buyerPhone: '0811-2233-4455',
    buyerAddress: 'Jl. Diponegoro No. 14, Tembalang',
    buyerCity: 'Semarang',
    distanceKm: 440,
    price: 250000,
    status: 'approved',
    paymentMethod: 'qris',
    createdAt: 'Kemarin',
  },
];

export function loadRecipesFromStorage(): Recipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load recipes:', e);
  }
  return INITIAL_RECIPES;
}

export function saveRecipesToStorage(recipes: Recipe[]): void {
  try {
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  } catch (e) {
    console.error('Failed to save recipes:', e);
  }
}

export function loadRecipeOrdersFromStorage(): RecipeOrder[] {
  try {
    const raw = localStorage.getItem(RECIPE_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load recipe orders:', e);
  }
  return INITIAL_RECIPE_ORDERS;
}

export function saveRecipeOrdersToStorage(orders: RecipeOrder[]): void {
  try {
    localStorage.setItem(RECIPE_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save recipe orders:', e);
  }
}

export function getAdminPin(): string {
  try {
    const saved = localStorage.getItem(ADMIN_PIN_STORAGE_KEY);
    return saved && saved.trim().length > 0 ? saved.trim() : DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
}

export function setAdminPin(newPin: string): void {
  const clean = newPin.trim();
  if (clean.length >= 4) {
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, clean);
  }
}

export function formatDistanceDetail(distanceKm: number): string {
  const meters = Math.round(distanceKm * 1000);
  if (distanceKm < 1) {
    return `${meters.toLocaleString('id-ID')} meter (${distanceKm.toFixed(2).replace('.', ',')} KM)`;
  }
  if (distanceKm < 15) {
    return `${distanceKm.toLocaleString('id-ID')} KM (${meters.toLocaleString('id-ID')} meter)`;
  }
  return `${distanceKm.toLocaleString('id-ID')} KM`;
}
