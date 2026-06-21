import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../services/cartService";
import { AuthContext } from "./AuthContext";
import { toast } from "react-toastify";

export const CartContext = createContext();

const CART_STORAGE_KEY = "tronmarket_cart";

function loadLocalCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLocalCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function clearLocalCart() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // silently ignore
  }
}

export default function CartProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [cart, setCart] = useState(() => loadLocalCart());
  const [synced, setSynced] = useState(false);
  const mountedRef = useRef(true);

  // ── Fetch from backend (used on mount & for reconciliation) ──
  const fetchCart = useCallback(async () => {
    try {
      const res = await getCart();
      if (!mountedRef.current) return;
      const serverCart = res.data;
      setCart(serverCart);
      saveLocalCart(serverCart);
      setSynced(true);
    } catch (err) {
      if (!mountedRef.current) return;
      // If not authenticated (401), set empty cart to avoid infinite loading
      if (err.response?.status === 401) {
        const empty = { items: [] };
        setCart(empty);
        saveLocalCart(empty);
      } else {
        console.log("fetchCart error", err);
      }
      setSynced(true);
    }
  }, []);

  // On mount or auth change: re-fetch cart so it stays in sync with login/logout
  useEffect(() => {
    mountedRef.current = true;
    // When token changes (login/logout), always re-fetch from backend
    fetchCart();
    return () => {
      mountedRef.current = false;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Optimistic helpers ──

  /** Add item locally first, then sync to backend */
  const addToCartLocal = useCallback(
    async (productId, quantity = 1, productData = null) => {
      // 1. Optimistic update
      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const existingIndex = prev.items.findIndex(
          (item) =>
            item.product?._id === productId || item.product === productId,
        );

        let newItems;
        if (existingIndex >= 0) {
          // Item exists — increment quantity
          newItems = prev.items.map((item, idx) => {
            if (idx !== existingIndex) return item;
            return { ...item, quantity: item.quantity + quantity };
          });
        } else {
          // New item — add it
          const newItem = productData
            ? {
                product: productData,
                quantity,
              }
            : {
                product: { _id: productId },
                quantity,
              };
          newItems = [...prev.items, newItem];
        }

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      // 2. Fire backend request silently
      try {
        await addToCart({ productId, quantity });
        // Re-fetch to get the authoritative server state
        if (mountedRef.current) fetchCart();
      } catch (err) {
        // 3. Revert on failure
        if (mountedRef.current) {
          setCart(previousCart);
          saveLocalCart(previousCart);
        }
        if (err.response?.status === 401) {
          // Let the caller handle auth redirect
          throw err;
        } else {
          toast.error(
            err.response?.data?.message || "Failed to sync cart with server",
          );
        }
      }
    },
    [fetchCart],
  );

  /** Update quantity locally first, then sync to backend */
  const updateQtyLocal = useCallback(
    async (productId, quantity) => {
      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const newItems = prev.items.map((item) => {
          if ((item.product?._id || item.product) !== productId) return item;
          return { ...item, quantity: Number(quantity) };
        });

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      try {
        await updateCartItem(productId, { quantity: Number(quantity) });
        if (mountedRef.current) fetchCart();
      } catch (err) {
        if (mountedRef.current) {
          setCart(previousCart);
          saveLocalCart(previousCart);
        }
        toast.error(err.response?.data?.message || "Failed to update quantity");
      }
    },
    [fetchCart],
  );

  /** Remove item locally first, then sync to backend */
  const removeItemLocal = useCallback(
    async (productId) => {
      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const newItems = prev.items.filter(
          (item) => (item.product?._id || item.product) !== productId,
        );

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      try {
        await removeCartItem(productId);
        if (mountedRef.current) fetchCart();
      } catch (err) {
        if (mountedRef.current) {
          setCart(previousCart);
          saveLocalCart(previousCart);
        }
        toast.error(err.response?.data?.message || "Failed to remove item");
      }
    },
    [fetchCart],
  );

  /** Clear cart locally first, then sync to backend */
  const clearCartLocal = useCallback(async () => {
    let previousCart = null;
    setCart((prev) => {
      previousCart = prev;
      const updated = { ...prev, items: [] };
      saveLocalCart(updated);
      return updated;
    });

    try {
      await clearCart();
      if (mountedRef.current) fetchCart();
    } catch (err) {
      if (mountedRef.current) {
        setCart(previousCart);
        saveLocalCart(previousCart);
      }
      toast.error(err.response?.data?.message || "Failed to clear cart");
    }
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        setCart,
        fetchCart,
        addToCartLocal,
        updateQtyLocal,
        removeItemLocal,
        clearCartLocal,
        synced,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
