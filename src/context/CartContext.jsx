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

// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE OF THE DUPLICATE BUG
// ─────────────────────────────────────────────────────────────────────────────
// addToCartLocal does:
//   1. Optimistic setCart (increment quantity if item exists, else push new item)
//   2. await addToCart(...)  — POST to server
//   3. fetchCart()           — GET from server to reconcile
//
// The problem: fetchCart() is async and is called but NOT awaited inside
// addToCartLocal. If the user clicks "Add to Cart" a second time quickly,
// or navigates to the cart before fetchCart() resolves, the stale server
// state from the first fetchCart() call races with the second add.
//
// Specifically: if two addToCartLocal calls fire close together —
//   Call A: optimistic update → increments qty to 2 in local state ✓
//           → POST /cart (server receives qty=1, existing qty=1 → server sets qty=2)
//           → fetchCart() fires but hasn't resolved yet
//   Call B: optimistic update runs against the state from Call A (qty=2) → qty=3 ✓
//           → POST /cart (server receives qty=1, existing qty=2 → server sets qty=3)
//           → fetchCart() fires
//   Call A's fetchCart resolves first → overwrites local state with server data (qty=2) ← WRONG
//   Call B's fetchCart resolves → overwrites with correct qty=3 ✓ but only if it finishes last
//
// The real duplicate issue happens when fetchCart from a PREVIOUS operation resolves
// AFTER a new addToCartLocal has started and has already done its optimistic push.
// fetchCart() returns the server state which may still show qty=1 (before the new
// POST has been processed), and it replaces the optimistically-updated local state —
// making the optimistic item disappear. The user then sees the old item at qty=1
// AND a fresh optimistic push adds it again as a new entry.
//
// FIX: Track in-flight add requests per productId. Block fetchCart from
// overwriting local state while an add operation is still pending.
// Use a pending-ops counter: only let fetchCart update state when no add/update
// ops are in flight.
// ─────────────────────────────────────────────────────────────────────────────

export default function CartProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [cart, setCart] = useState(() => loadLocalCart());
  const [synced, setSynced] = useState(false);
  const mountedRef = useRef(true);

  // Count of in-flight mutating operations (add / update / remove / clear).
  // fetchCart will not overwrite local state while this is > 0.
  const pendingOpsRef = useRef(0);

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
      // 1. Optimistic update
      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const existingIndex = prev.items.findIndex(
          (item) =>
            // item.product may be a populated object or a plain string ID
            (item.product?._id ?? item.product)?.toString() ===
            productId.toString(),
        );

        let newItems;
        if (existingIndex >= 0) {
          // Item already in cart — increment quantity
          newItems = prev.items.map((item, idx) => {
            if (idx !== existingIndex) return item;
            return { ...item, quantity: item.quantity + quantity };
          });
        } else {
          // New item — append
          const newItem = productData
            ? { product: productData, quantity }
            : { product: { _id: productId }, quantity };
          newItems = [...prev.items, newItem];
        }

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      // 2. Track that a mutation is in flight so fetchCart won't stomp on it
      pendingOpsRef.current += 1;

      try {
        await addToCart({ productId, quantity });
        // 3. Reconcile with authoritative server state
        if (mountedRef.current) {
          pendingOpsRef.current -= 1;
          await fetchCart();
        }
      } catch (err) {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        // FIX: On failure, re-fetch the real server state instead of restoring
        // a locally-captured `previousCart` snapshot. If another mutation was
        // in flight at the same time, that snapshot may already be stale/wrong —
        // pulling from the server guarantees we land on the true current state.
        if (mountedRef.current) {
          if (err.response?.status === 401) {
            setCart(previousCart);
            saveLocalCart(previousCart);
          } else {
            await fetchCart();
          }
        }
        if (err.response?.status === 401) {
          throw err; // Let the caller handle auth redirect
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

  // ── Clear cart ────────────────────────────────────────────────────────────
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
