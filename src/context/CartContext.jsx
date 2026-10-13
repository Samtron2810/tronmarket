/* eslint-disable react-refresh/only-export-components -- context and provider are intentionally co-located. */
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
  validateCartStock,
  mergeGuestCart,
} from "../services/cartService";
import { AuthContext } from "./AuthContext";
import { toast } from "react-toastify";

export const CartContext = createContext();

const CART_STORAGE_KEY = "tronmarket_cart";
const GUEST_CART_STORAGE_KEY = "tronmarket_guest_cart";

function readStoredCart(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

function loadLocalCart() {
  return readStoredCart(CART_STORAGE_KEY);
}

function loadGuestCart() {
  return readStoredCart(GUEST_CART_STORAGE_KEY) || { items: [] };
}

function saveLocalCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function saveGuestCart(cart) {
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

function clearGuestCartStorage() {
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {
    // silently ignore
  }
}

function lineMatches(item, productId, variantId) {
  const itemProduct = (item.product?._id ?? item.product)?.toString();
  const itemVariant = (item.variant?._id ?? item.variant ?? "").toString();
  return (
    itemProduct === productId?.toString() &&
    itemVariant === (variantId ?? "").toString()
  );
}

function snapshotProduct(product) {
  if (!product || typeof product !== "object") return null;
  return {
    _id: product._id,
    name: product.name || "Product",
    image: product.image || "",
    images: product.images || [],
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    seller: product.seller || null,
    hasVariants: Boolean(product.hasVariants),
  };
}

function snapshotVariant(variant) {
  if (!variant || typeof variant !== "object") return null;
  return {
    _id: variant._id,
    price: Number(variant.price || 0),
    stock: Number(variant.stock || 0),
    image: variant.image || "",
    attributes: variant.attributes || [],
    sku: variant.sku || "",
  };
}

export default function CartProvider({ children }) {
  const { token } = useContext(AuthContext);
  const [cart, setCart] = useState(() =>
    token ? loadLocalCart() : loadGuestCart(),
  );
  const [synced, setSynced] = useState(false);
  const mountedRef = useRef(true);
  const mergedForTokenRef = useRef(null);

  // Count of in-flight mutating operations (add / update / remove / clear).
  // fetchCart will not overwrite local state while this is > 0.
  const pendingOpsRef = useRef(0);

  // ── Global "Add to Cart" cooldown ───────────────────────────────────────
  // While true, every "Add to Cart" button across the app renders disabled.
  // Set for a flat 1.5s window whenever an add-to-cart is triggered,
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

  // ── Fetch from backend / load the guest cart ────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!token) {
      mergedForTokenRef.current = null;
      if (mountedRef.current) {
        setCart(loadGuestCart());
        setSynced(true);
      }
      return;
    }

    try {
      // The first authenticated fetch after login merges whatever the
      // visitor collected as a guest. The guest copy is only cleared after
      // the server confirms the merge, so a failed request cannot lose it.
      const guestCart = loadGuestCart();
      if (
        guestCart.items.length > 0 &&
        mergedForTokenRef.current !== token
      ) {
        mergedForTokenRef.current = token;
        try {
          const mergeRes = await mergeGuestCart(
            guestCart.items.map((item) => ({
              productId: (item.product?._id ?? item.product)?.toString(),
              variantId:
                (item.variant?._id ?? item.variant)?.toString() || null,
              quantity: item.quantity,
            })),
          );
          const mergedCart = mergeRes.data?.cart;
          if (mergedCart && mountedRef.current) {
            setCart(mergedCart);
            saveLocalCart(mergedCart);
            clearGuestCartStorage();
            setSynced(true);
            toast.success("Your guest cart was added to your account cart");
            return;
          }
        } catch (mergeError) {
          console.error("Guest cart merge failed", mergeError);
          if (mountedRef.current) {
            toast.warning(
              "We could not merge your guest cart yet. It is still saved in this browser.",
            );
          }
        }
      }

      const res = await getCart();
      if (!mountedRef.current) return;

      // Only apply server response if no mutation is currently in flight.
      if (pendingOpsRef.current === 0) {
        const serverCart = res.data;
        setCart(serverCart);
        saveLocalCart(serverCart);
      }
      setSynced(true);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.response?.status === 401) {
        // The API layer clears the expired session. Show the browser-held
        // guest cart rather than pretending every cart suddenly vanished.
        setCart(loadGuestCart());
      } else {
        console.log("fetchCart error", err);
      }
      setSynced(true);
    }
  }, [token]);

  // On mount or auth change: re-fetch cart
  useEffect(() => {
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCart();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCart]);

  // ── Add item ─────────────────────────────────────────────────────────────
  const addToCartLocal = useCallback(
    async (productId, quantity = 1, variantId = null, snapshot = null) => {
      // Disable every "Add to Cart" button for a flat 1.5s cooldown,
      // regardless of how long the request itself takes.
      setIsAddingToCart(true);
      if (addToCartCooldownRef.current) {
        clearTimeout(addToCartCooldownRef.current);
      }
      addToCartCooldownRef.current = setTimeout(() => {
        if (mountedRef.current) setIsAddingToCart(false);
      }, 2000);

      const qty = Number(quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        toast.error("Quantity must be a whole number of at least 1");
        return;
      }

      if (!token) {
        const product = snapshotProduct(snapshot?.product);
        const variant = snapshotVariant(snapshot?.variant);
        if (!product?._id) {
          toast.error("Could not add this item to your guest cart");
          return;
        }

        const available = Number(variant?.stock ?? product.stock ?? 0);
        const current = loadGuestCart();
        const existing = current.items.find((item) =>
          lineMatches(item, productId, variantId),
        );
        const desired = (existing?.quantity || 0) + qty;
        if (!available || desired > available) {
          toast.error(
            available
              ? `Only ${available} left in stock`
              : "Product is out of stock",
          );
          return;
        }

        const items = existing
          ? current.items.map((item) =>
              lineMatches(item, productId, variantId)
                ? { ...item, quantity: desired }
                : item,
            )
          : [
              ...current.items,
              {
                product,
                variant,
                variantLabel:
                  snapshot?.variantLabel ||
                  (variant?.attributes || [])
                    .map((attribute) => attribute.value)
                    .filter(Boolean)
                    .join(" / "),
                sku: variant?.sku || "",
                quantity: qty,
              },
            ];
        const updated = { ...current, items };
        setCart(updated);
        saveGuestCart(updated);
        toast.success("Added to cart");
        return;
      }

      pendingOpsRef.current += 1;

      try {
        // Make the API call FIRST — wait for real response
        await addToCart({ productId, variantId, quantity: qty });

        // Only if API succeeds, fetch updated cart from server
        if (mountedRef.current) {
          pendingOpsRef.current -= 1;
          await fetchCart();
          // Show success only after server confirms it was added
          toast.success("Added to cart");
        }
      } catch (err) {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);

        // Show the real error from the API
        const errorMessage =
          err.response?.data?.message || "Failed to add item to cart";
        toast.error(errorMessage);

        // Re-throw only for 401s so button handlers can open the auth modal
        if (err.response?.status === 401) {
          throw err;
        }
      }
    },
    [fetchCart, token],
  );

  // ── Update quantity ───────────────────────────────────────────────────────
  const updateQtyLocal = useCallback(
    async (productId, quantity, variantId = null) => {
      if (!token) {
        const current = cart || loadGuestCart();
        const updated = {
          ...current,
          items: (current.items || []).map((item) =>
            lineMatches(item, productId, variantId)
              ? { ...item, quantity: Number(quantity) }
              : item,
          ),
        };
        setCart(updated);
        saveGuestCart(updated);
        return;
      }

      setCart((prev) => {
        if (!prev) return prev;

        const newItems = prev.items.map((item) => {
          if (!lineMatches(item, productId, variantId)) return item;
          return { ...item, quantity: Number(quantity) };
        });

        const updated = { ...prev, items: newItems };
        saveLocalCart(updated);
        return updated;
      });

      pendingOpsRef.current += 1;

      try {
        await updateCartItem(
          productId,
          { quantity: Number(quantity) },
          variantId,
        );
        if (mountedRef.current) {
          pendingOpsRef.current -= 1;
          await fetchCart();
        }
      } catch (err) {
        pendingOpsRef.current = Math.max(0, pendingOpsRef.current - 1);
        if (mountedRef.current) {
          await fetchCart();
        }
        toast.error(err.response?.data?.message || "Failed to update quantity");
      }
    },
    [cart, fetchCart, token],
  );

  // ── Remove item ───────────────────────────────────────────────────────────
  const removeItemLocal = useCallback(
    async (productId, variantId = null) => {
      if (!token) {
        const current = cart || loadGuestCart();
        const updated = {
          ...current,
          items: (current.items || []).filter(
            (item) => !lineMatches(item, productId, variantId),
          ),
        };
        setCart(updated);
        saveGuestCart(updated);
        return;
      }

      let previousCart = null;
      setCart((prev) => {
        previousCart = prev;
        if (!prev) return prev;

        const updated = {
          ...prev,
          items: prev.items.filter(
            (item) => !lineMatches(item, productId, variantId),
          ),
        };
        saveLocalCart(updated);
        return updated;
      });

      pendingOpsRef.current += 1;

      try {
        await removeCartItem(productId, variantId);
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
    [cart, fetchCart, token],
  );

  // ── Clear cart ────────────────────────────────────────────────────────────
  const clearCartLocal = useCallback(async () => {
    if (!token) {
      const updated = { items: [] };
      setCart(updated);
      saveGuestCart(updated);
      return;
    }

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
  }, [fetchCart, token]);

  // ── Validate cart stock before checkout ──────────────────────────────────
  const validateCartBeforeCheckout = useCallback(async () => {
    if (!token) {
      const current = cart || loadGuestCart();
      const errors = [];
      for (const item of current.items || []) {
        const productId = (item.product?._id ?? item.product)?.toString();
        const variantId =
          (item.variant?._id ?? item.variant)?.toString() || null;
        const available =
          item.variant && typeof item.variant === "object"
            ? Number(item.variant.stock || 0)
            : Number(item.product?.stock || 0);
        if (available <= 0) {
          errors.push({
            productId,
            variantId,
            variantLabel: item.variantLabel || "",
            name: item.product?.name || "Item",
            reason: "out_of_stock",
            availableStock: 0,
            cartQuantity: item.quantity,
          });
        } else if (item.quantity > available) {
          errors.push({
            productId,
            variantId,
            variantLabel: item.variantLabel || "",
            name: item.product?.name || "Item",
            reason: "insufficient",
            availableStock: available,
            cartQuantity: item.quantity,
          });
        }
      }
      return { valid: errors.length === 0, errors };
    }

    const res = await validateCartStock();
    return res.data;
  }, [cart, token]);

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
        isGuestCart: !token,
        validateCartBeforeCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
