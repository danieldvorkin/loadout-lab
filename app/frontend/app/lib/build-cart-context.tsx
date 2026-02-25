import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CartComponent {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  msrpCents: number | null;
  weightOz: number | null;
  manufacturer: {
    id: string;
    name: string;
  };
}

interface BuildCartContextType {
  cartItems: CartComponent[];
  addToCart: (component: CartComponent) => void;
  removeFromCart: (componentId: string) => void;
  clearCart: () => void;
  isInCart: (componentId: string) => boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const BuildCartContext = createContext<BuildCartContextType | null>(null);

const STORAGE_KEY = 'prs_build_cart';

export function BuildCartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartComponent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (component: CartComponent) => {
    setCartItems(prev => {
      if (prev.find(c => c.id === component.id)) return prev;
      return [...prev, component];
    });
  };

  const removeFromCart = (componentId: string) => {
    setCartItems(prev => prev.filter(c => c.id !== componentId));
  };

  const clearCart = () => setCartItems([]);

  const isInCart = (componentId: string) =>
    cartItems.some(c => c.id === componentId);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(o => !o);

  return (
    <BuildCartContext.Provider
      value={{
        cartItems, addToCart, removeFromCart, clearCart, isInCart,
        isOpen, openCart, closeCart, toggleCart,
      }}
    >
      {children}
    </BuildCartContext.Provider>
  );
}

export function useBuildCart() {
  const ctx = useContext(BuildCartContext);
  if (!ctx) throw new Error('useBuildCart must be used inside BuildCartProvider');
  return ctx;
}
