import type { Recipe, RecipeOrder } from '../types/recipe';

export const RECIPES_STORAGE_KEY = 'cuanumkm_recipes_v1';
export const RECIPE_ORDERS_STORAGE_KEY = 'cuanumkm_recipe_orders_v1';
export const ADMIN_PIN_STORAGE_KEY = 'cuanumkm_admin_pin_v1';
export const DEFAULT_ADMIN_PIN = '1234';

const LEGACY_DEMO_RECIPE_IDS = new Set(['rcp_1', 'rcp_2', 'rcp_3', 'rcp_4', 'rcp_5']);

export const INITIAL_RECIPE_ORDERS: RecipeOrder[] = [];

export function loadRecipesFromStorage(): Recipe[] {
  try {
    const raw = localStorage.getItem(RECIPES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (r: Recipe) => r && typeof r.id === 'string' && !LEGACY_DEMO_RECIPE_IDS.has(r.id)
        );
        if (cleaned.length !== parsed.length) {
          saveRecipesToStorage(cleaned);
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Failed to load recipes:', e);
  }
  return [];
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
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (o: RecipeOrder) =>
            o &&
            typeof o.id === 'string' &&
            !o.id.startsWith('ord_adm_') &&
            !o.id.startsWith('ord_demo_')
        );
        if (cleaned.length !== parsed.length) {
          saveRecipeOrdersToStorage(cleaned);
        }
        return cleaned;
      }
    }
  } catch (e) {
    console.error('Failed to load recipe orders:', e);
  }
  return [];
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
