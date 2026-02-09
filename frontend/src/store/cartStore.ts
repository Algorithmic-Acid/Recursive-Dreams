import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, PricingVariant } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, selectedVariant?: PricingVariant) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, selectedVariant?: PricingVariant) => {
        set((state) => {
          // Find existing item matching both product and variant
          const existingItem = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.selectedVariant?.id === selectedVariant?.id
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id &&
                item.selectedVariant?.id === selectedVariant?.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, quantity: 1, selectedVariant }],
          };
        });
      },

      removeItem: (productId: string, variantId?: string) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(item.product.id === productId && item.selectedVariant?.id === variantId)
          ),
        }));
      },

      updateQuantity: (productId: string, quantity: number, variantId?: string) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId && item.selectedVariant?.id === variantId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          // Use variant price if selected, otherwise use product price
          const price = item.selectedVariant?.price ?? item.product.price;
          return total + price * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
