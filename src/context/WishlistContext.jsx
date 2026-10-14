/* eslint-disable react-refresh/only-export-components -- context and provider are intentionally co-located. */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { getWishlist, toggleWishlistItem } from "../services/storefrontService";

export const WishlistContext = createContext({
  ids: [],
  toggle: async () => {},
  isSaved: () => false,
});

export default function WishlistProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [ids, setIds] = useState([]);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIds([]);
      return;
    }
    let cancelled = false;
    getWishlist()
      .then((res) => {
        if (!cancelled) setIds(res.data.productIds || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggle = useCallback(async (productId) => {
    const res = await toggleWishlistItem(productId);
    setIds(res.data.productIds || []);
    return res.data.saved;
  }, []);

  const isSaved = useCallback((productId) => ids.includes(String(productId)), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isSaved }}>
      {children}
    </WishlistContext.Provider>
  );
}
