/* eslint-disable react-refresh/only-export-components -- context and provider are intentionally co-located. */
import { createContext, useState, useEffect, useCallback } from "react";
import {
  getToken,
  logout as doLogout,
  setToken,
  getUser,
  setUser,
} from "../utils/auth";
import api, {
  SESSION_EXPIRED_EVENT,
  TOKEN_REFRESHED_EVENT,
} from "../services/api";
import { getMe } from "../services/authService";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  const clearSession = useCallback(() => {
    doLogout();
    setTokenState(null);
    setUserState(null);
  }, []);

  const login = (t, u = null) => {
    setToken(t);
    setTokenState(t);
    if (u) {
      setUser(u);
      setUserState(u);
    }
  };

  // Re-read the account from the server (e.g. after a seller application
  // is approved, the stored role must catch up with the new one). A 401
  // clears the session; a transient network failure does not log the user
  // out or erase an otherwise usable stored profile.
  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data);
      setUserState(res.data);
      return res.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearSession();
      }
      return null;
    }
  }, [clearSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      setTokenState(null);
      setUserState(null);
    };
    // The API layer silently rotates access tokens; keep React state in
    // step so nothing re-renders with the stale (expired) token string.
    const onTokenRefreshed = (event) => {
      if (event.detail?.token) setTokenState(event.detail.token);
      if (event.detail?.user) setUserState(event.detail.user);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    window.addEventListener(TOKEN_REFRESHED_EVENT, onTokenRefreshed);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
      window.removeEventListener(TOKEN_REFRESHED_EVENT, onTokenRefreshed);
    };
  }, []);

  // Validate/refresh the profile whenever a session starts or the token
  // changes. This keeps role changes and deleted/suspended accounts from
  // lingering in localStorage after a refresh.
  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const me = await refreshUser();
      if (!cancelled && !me) {
        // refreshUser only clears state itself on a 401. For other errors,
        // retain the stored user rather than logging out on a flaky network.
        const stored = getUser();
        if (stored) setUserState(stored);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  const handleLogout = async () => {
    try {
      // try server-side logout (if endpoint exists)
      await api.post("/auth/logout");
    } catch {
      // ignore network errors
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        refreshUser,
        handleLogout,
        welcomeModalOpen,
        setWelcomeModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
