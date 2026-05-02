"use client";

import { createContext, useContext, useEffect, useState ,useRef } from "react";

const CartContext = createContext();
const STORAGE_KEY = "zoya_cart";

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const cartIconRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (e) {
      console.warn("Failed to load cart from storage", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn("Failed to save cart", e);
    }
  }, [cart, hydrated]);

  const addToCart = (product, selectedColor, selectedSize, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1);
  
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.id === product.id &&
          item.color.name === selectedColor.name &&
          item.size === selectedSize
      );
  
      if (existing) {
        return prev.map((item) =>
          item === existing
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
  
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: selectedColor.image,
          color: selectedColor,
          size: selectedSize,
          quantity: qty,
          availableColors: product.colors ?? [],
          availableSizes: product.sizes ?? [],
        },
      ];
    });
      setIsCartOpen(true);
  };
  const clearCart = () => setCart([]);

  const removeFromCart = (id, colorName, size) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.id === id &&
            item.color.name === colorName &&
            item.size === size
          )
      )
    );
  };

  const updateVariant = (id, oldColorName, oldSize, { newColor, newSize }) => {
    setCart((prev) => {
      const target = prev.find(
        (item) =>
          item.id === id &&
          item.color.name === oldColorName &&
          item.size === oldSize
      );
      if (!target) return prev;

      const finalColor = newColor ?? target.color;
      const finalSize = newSize ?? target.size;

      if (
        finalColor.name === target.color.name &&
        finalSize === target.size
      ) {
        return prev;
      }

      const duplicate = prev.find(
        (item) =>
          item !== target &&
          item.id === id &&
          item.color.name === finalColor.name &&
          item.size === finalSize
      );

      if (duplicate) {
        return prev
          .filter((item) => item !== target)
          .map((item) =>
            item === duplicate
              ? { ...item, quantity: item.quantity + target.quantity }
              : item
          );
      }

      return prev.map((item) =>
        item === target
          ? {
              ...item,
              color: finalColor,
              size: finalSize,
              image: finalColor?.image ?? item.image,
            }
          : item
      );
    });
  };

  const updateQuantity = (id, colorName, size, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, colorName, size);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id &&
        item.color.name === colorName &&
        item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const value = {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateVariant,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    hydrated,
  };

  return (
    <CartContext.Provider value={{...value, cartIconRef}}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
