import { createContext, useState, useEffect } from "react";
import { getCart } from "../services/cartService";

export const CartContext = createContext();

export default function CartProvider({ children }) {
  const [cart, setCart] = useState(null);

  const fetchCart = async () => {
    try {
      const res = await getCart();
      setCart(res.data);
    } catch (err) {
      console.log("fetchCart error", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider value={{ cart, setCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}
