import React, { createContext, useContext, useEffect, useState } from 'react';
import { cartService, Cart, CartItem, Product } from '@/services/cartService';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addToCart: (product: Product, quantity?: number, selectedVariant?: string) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemCount: () => number;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Subscribe to cart updates
      const unsubscribe = cartService.subscribeToCart(user.uid, (updatedCart) => {
        setCart(updatedCart);
        setLoading(false);
      });

      return unsubscribe;
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [user]);

  const addToCart = async (product: Product, quantity: number = 1, selectedVariant?: string) => {
    if (!user) {
      throw new Error('User must be authenticated to add items to cart');
    }

    try {
      await cartService.addToCart(user.uid, product, quantity, selectedVariant);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to remove items from cart');
    }

    try {
      await cartService.removeFromCart(user.uid, itemId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    if (!user) {
      throw new Error('User must be authenticated to update cart');
    }

    try {
      await cartService.updateCartItemQuantity(user.uid, itemId, quantity);
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!user) {
      throw new Error('User must be authenticated to clear cart');
    }

    try {
      await cartService.clearCart(user.uid);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const getCartItemCount = (): number => {
    return cart?.totalItems || 0;
  };

  const getCartTotal = (): number => {
    return cart?.totalPrice || 0;
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}