import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StoreContext = createContext(null);
const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
};

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => read('ababil-cart'));
  const [favorites, setFavorites] = useState(() => read('ababil-favorites'));
  useEffect(
    () => localStorage.setItem('ababil-cart', JSON.stringify(cart)),
    [cart]
  );
  useEffect(
    () => localStorage.setItem('ababil-favorites', JSON.stringify(favorites)),
    [favorites]
  );
  const value = useMemo(
    () => ({
      cart,
      favorites,
      addToCart(product, quantity = 1) {
        const cartKey = `${product.id}::${product.selectedColor || ''}::${product.selectedSize || ''}`;
        setCart((items) => {
          const existing = items.find(
            (item) => (item.cartKey || item.id) === cartKey
          );
          return existing
            ? items.map((item) =>
                (item.cartKey || item.id) === cartKey
                  ? {
                      ...item,
                      quantity: Math.min(item.quantity + quantity, 99),
                    }
                  : item
              )
            : [...items, { ...product, cartKey, quantity }];
        });
      },
      updateQuantity(cartKey, quantity) {
        setCart((items) =>
          items.map((item) =>
            (item.cartKey || item.id) === cartKey
              ? { ...item, quantity: Math.max(1, Math.min(quantity, 99)) }
              : item
          )
        );
      },
      removeFromCart(cartKey) {
        setCart((items) =>
          items.filter((item) => (item.cartKey || item.id) !== cartKey)
        );
      },
      clearCart() {
        setCart([]);
      },
      toggleFavorite(id) {
        setFavorites((items) =>
          items.includes(id)
            ? items.filter((item) => item !== id)
            : [...items, id]
        );
      },
    }),
    [cart, favorites]
  );
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
export const useStore = () => useContext(StoreContext);
