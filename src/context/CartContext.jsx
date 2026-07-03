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

  const pendingOpsRef = useRef(0);

  // ── Global "Add to Cart" cooldown ───────────────────────────────────────
  // While true, every "Add to Cart" button across the app should render
  // disabled. Set for a flat 1.5s window whenever an add-to-cart is triggered,
  // independent of how long the underlying request actually takes.
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const addToCartCooldownRef = useRef(null);

  useEffect(() => {
    return () => {
      if (addToCartCooldownRef.current) {
        clearTimeout(addToCartCooldownRef.current);
      }
    };
  }, []);

  // ── Fetch from backend ──────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    try {
      const res = await getCart();
      if (!mountedRef.current) return;

      // FIX: Only apply server response if no mutation is currently in flight.
      // If a mutation is pending, its own fetchCart call (fired after the mutation
      // resolves) will reconcile — we don't want a stale fetch to stomp on the
      // freshly-optimised local state.
      if (pendingOpsRef.current === 0) {
        const serverCart = res.data;
        setCart(serverCart);
        saveLocalCart(serverCart);
      }
      setSynced(true);
    } catch (err) {
      if (!mountedRef.current) return;
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

  // On mount or auth change: re-fetch cart
  useEffect(() => {
    mountedRef.current = true;
    fetchCart();
    return () => {
      mountedRef.current = false;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add item ─────────────────────────────────────────────────────────────
  const addToCartLocal = useCallback(
    async (productId, quantity = 1, productData = null) => {
      // 0. Disable every "Add to Cart" button for a flat 1.5s cooldown,
      // regardless of how long the request itself takes.
      setIsAddingToCart(true);
      if (addToCartCooldownRef.current) {
        clearTimeout(addToCartCooldownRef.current);
      }
      addToCartCooldownRef.current = setTimeout(() => {
        if (mountedRef.current) setIsAddingToCart(false);
      }, 1500);

      // 1. Optimistic update
      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const existingIndex = prev.items.findIndex(
          (item) =>
            (item.product?._id ?? item.product)?.toString() ===
            productId.toString(),
        );

        let newItems;
        if (existingIndex >= 0) {
          newItems = prev.items.map((item, idx) => {
            if (idx !== existingIndex) return item;
            return { ...item, quantity: item.quantity + quantity };
          });
        } else {
          const newItem = productData
            ? { product: productData, quantity }
            : { product: { _id: productId }, quantity };
          newItems = [...prev.items, newItem];
        }

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      pendingOpsRef.current += 1;

      try {
        await addToCart({ productId, quantity });
        if (mountedRef.current) {
          pendingOpsRef.current -= 1;
          await fetchCart();
        }
      } catch (err) {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (mountedRef.current) {
          if (err.response?.status === 401) {
            setCart(previousCart);
            saveLocalCart(previousCart);
          } else {
            await fetchCart();
          }
        }
        if (err.response?.status === 401) {
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

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateQtyLocal = useCallback(
    async (productId, quantity) => {
      setCart((prev) => {
        if (!prev) return prev;

        const newItems = prev.items.map((item) => {
          if (
            (item.product?._id ?? item.product)?.toString() !==
            productId.toString()
          )
            return item;
          return { ...item, quantity: Number(quantity) };
        });

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      pendingOpsRef.current += 1;

      try {
        await updateCartItem(productId, { quantity: Number(quantity) });
        if (mountedRef.current) {
          pendingOpsRef.current -= 1;
          await fetchCart();
        }
      } catch (err) {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        // FIX: re-fetch authoritative server state on failure instead of
        // restoring a locally-captured `previousCart`. This is what was
        // causing the "only reverts by 1" bug — overlapping rapid updates
        // each captured their own (already wrong) previousCart, so the
        // revert chain only ever undid the most recent step. Pulling fresh
        // from the server always lands on the true, correct quantity.
        if (mountedRef.current) {
          await fetchCart();
        }
        toast.error(err.response?.data?.message || "Failed to update quantity");
      }
    },
    [fetchCart],
  );

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItemLocal = useCallback(
    async (productId) => {
      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const newItems = prev.items.filter(
          (item) =>
            (item.product?._id ?? item.product)?.toString() !==
            productId.toString(),
        );

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      pendingOpsRef.current += 1;

      try {
        await removeCartItem(productId);
        if (mountedRef.current) {
          pendingOpsRef.current -= 1;
          await fetchCart();
        }
      } catch (err) {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (mountedRef.current) {
          setCart(previousCart);
          saveLocalCart(previousCart);
        }
        toast.error(err.response?.data?.message || "Failed to remove item");
      }
    },
    [fetchCart],
  );

  // ── Clear cart
  const clearCartLocal = useCallback(async () => {
    let previousCart = null;
    setCart((prev) => {
      previousCart = prev;
      const updated = { ...prev, items: [] };
      saveLocalCart(updated);
      return updated;
    });

    pendingOpsRef.current += 1;

    try {
      await clearCart();
      if (mountedRef.current) {
        pendingOpsRef.current -= 1;
        await fetchCart();
      }
    } catch (err) {
      pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
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
        isAddingToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
