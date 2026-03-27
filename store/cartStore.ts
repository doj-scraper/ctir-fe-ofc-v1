import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  moq: number;
  image: string;
}

export interface CartState {
  guestSessionId: string | null;
  items: CartItem[];
  initializeGuest: () => string;
  addItem: (item: CartItem) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const cartStorageState = (() => {
  const globalAny = globalThis as typeof globalThis & {
    __CELLTECH_CART_STORAGE__?: Record<string, string>;
  };

  if (!globalAny.__CELLTECH_CART_STORAGE__) {
    globalAny.__CELLTECH_CART_STORAGE__ = {};
  }

  return globalAny.__CELLTECH_CART_STORAGE__;
})();

const memoryStorage = {
  getItem: (name: string) => cartStorageState[name] ?? null,
  setItem: (name: string, value: string) => {
    cartStorageState[name] = value;
  },
  removeItem: (name: string) => {
    delete cartStorageState[name];
  },
};

const persistentStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') {
      return memoryStorage.getItem(name);
    }

    try {
      return window.localStorage.getItem(name);
    } catch {
      return memoryStorage.getItem(name);
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') {
      memoryStorage.setItem(name, value);
      return;
    }

    try {
      window.localStorage.setItem(name, value);
    } catch {
      memoryStorage.setItem(name, value);
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') {
      memoryStorage.removeItem(name);
      return;
    }

    try {
      window.localStorage.removeItem(name);
    } catch {
      memoryStorage.removeItem(name);
    }
  },
};

const createGuestSessionId = () => {
  const sequence = Math.floor(Math.random() * 90000) + 10000;
  return `userid-g${sequence}`;
};

const normalizeQuantity = (item: CartItem, quantity: number) => {
  if (quantity <= 0) {
    return 0;
  }

  return Math.max(quantity, Math.max(item.moq, 5));
};

const notifyCartAdded = () => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('ct-cart:item-added'));
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      guestSessionId: null,
      items: [],

      initializeGuest: () => {
        const existingId = get().guestSessionId;
        if (existingId) {
          return existingId;
        }

        const guestSessionId = createGuestSessionId();
        set({ guestSessionId });
        return guestSessionId;
      },

      addItem: (item: CartItem) =>
        set((state: CartState) => {
          const nextQuantity = normalizeQuantity(item, item.quantity);
          if (nextQuantity <= 0) {
            return state;
          }

          const guestSessionId = state.guestSessionId ?? createGuestSessionId();
          const existingItem = state.items.find((current) => current.sku === item.sku);

          notifyCartAdded();

          if (existingItem) {
            return {
              guestSessionId,
              items: state.items.map((current) =>
                current.sku === item.sku
                  ? {
                      ...current,
                      name: item.name,
                      price: item.price,
                      image: item.image,
                      moq: Math.max(current.moq, item.moq),
                      quantity: current.quantity + nextQuantity,
                    }
                  : current
              ),
            };
          }

          return {
            guestSessionId,
            items: [...state.items, { ...item, quantity: nextQuantity }],
          };
        }),

      removeItem: (sku: string) =>
        set((state: CartState) => ({
          guestSessionId: state.guestSessionId,
          items: state.items.filter((item) => item.sku !== sku),
        })),

      updateQuantity: (sku: string, quantity: number) =>
        set((state: CartState) => ({
          guestSessionId: state.guestSessionId,
          items: state.items
            .map((item) => {
              if (item.sku !== sku) {
                return item;
              }

              const nextQuantity = normalizeQuantity(item, quantity);
              return nextQuantity > 0 ? { ...item, quantity: nextQuantity } : null;
            })
            .filter((item): item is CartItem => item !== null),
        })),

      clearCart: () => set((state: CartState) => ({ guestSessionId: state.guestSessionId, items: [] })),

      getTotalPrice: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'celltech-cart-store',
      storage: createJSONStorage(() => persistentStorage),
      partialize: (state) => ({
        guestSessionId: state.guestSessionId,
        items: state.items,
      }),
    }
  )
);
