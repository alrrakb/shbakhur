'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export type DiscountApplied = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
} | null;

export interface GiftOptions {
  isGift: boolean;
  recipientName: string;
  giftMessage: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  appliedDiscount: DiscountApplied;
  setAppliedDiscount: (discount: DiscountApplied) => void;
  giftOptions: GiftOptions;
  setGiftOptions: (options: GiftOptions | ((prev: GiftOptions) => GiftOptions)) => void;
  recentlyRemoved: CartItem | null;
  undoRemove: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountApplied>(null);
  const [recentlyRemoved, setRecentlyRemoved] = useState<CartItem | null>(null);
  const [giftOptions, setGiftOptions] = useState<GiftOptions>({
    isGift: false,
    recipientName: '',
    giftMessage: '',
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('sh-cart');
    const savedDiscount = localStorage.getItem('sh-discount');
    const savedGift = localStorage.getItem('sh-gift');
    
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart:', e);
      }
    }
    if (savedDiscount) {
      try {
        setAppliedDiscount(JSON.parse(savedDiscount));
      } catch (e) {
        console.error('Error parsing discount:', e);
      }
    }
    if (savedGift) {
      try {
        setGiftOptions(JSON.parse(savedGift));
      } catch (e) {
        console.error('Error parsing gift options:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sh-cart', JSON.stringify(items));
      
      if (appliedDiscount) {
        localStorage.setItem('sh-discount', JSON.stringify(appliedDiscount));
      } else {
        localStorage.removeItem('sh-discount');
      }

      if (giftOptions.isGift) {
        localStorage.setItem('sh-gift', JSON.stringify(giftOptions));
      } else {
        localStorage.removeItem('sh-gift');
      }
    }
  }, [items, isLoaded, appliedDiscount, giftOptions]);

  const addItem = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => String(i.id) === String(item.id));
      const qtyToAdd = item.quantity || 1;
      
      if (existing) {
        return prev.map((i) =>
          String(i.id) === String(item.id) ? { ...i, quantity: i.quantity + qtyToAdd } : i
        );
      }
      return [...prev, { ...item, quantity: qtyToAdd }];
    });
  };

  const removeItem = (id: number | string) => {
    const toRemove = items.find((i) => String(i.id) === String(id));
    if (toRemove) {
      setRecentlyRemoved(toRemove);
    }
    setItems((prev) => prev.filter((i) => String(i.id) !== String(id)));
  };

  const undoRemove = () => {
    if (recentlyRemoved) {
      addItem(recentlyRemoved);
      setRecentlyRemoved(null);
    }
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (String(i.id) === String(id) ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedDiscount(null);
    setRecentlyRemoved(null);
    setGiftOptions({ isGift: false, recipientName: '', giftMessage: '' });
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        appliedDiscount,
        setAppliedDiscount,
        giftOptions,
        setGiftOptions,
        recentlyRemoved,
        undoRemove,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
