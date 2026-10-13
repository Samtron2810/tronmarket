import { createContext, useState, useEffect } from "react";
import {
  getToken,
  logout as doLogout,
  setToken,
  getUser,
  setUser,
} from "../utils/auth";
import api from "../services/api";
import { getMe } from "../services/authService";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  const login = (t, u = null) => {
    setToken(t);
    setTokenState(t);
    if (u) {
      setUser(u);
      setUserState(u);
    }
  };

  useEffect(() => {
    // On page refresh: token is in localStorage but React state needs hydrating.
    // getUser() reads the full user object (including role) that login() stored.
    // If it's missing (user logged in before role was stored), force a logout
    // so they re-authenticate and get a fresh user object with role.
    if (token && !user) {
      const stored = getUser();
      if (stored?.role) {
        setUserState(stored);
      } else {
        // Stale session — no role info available, force clean re-login
        doLogout();
        setTokenState(null);
        setUserState(null);
      }
    }
  }, [token]);

  // Re-read the account from the server (e.g. after a seller application
  // is approved, the stored role must catch up with the new one).
  const refreshUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data);
      setUserState(res.data);
      return res.data;
    } catch {
      return null;
    }
  };

  const handleLogout = async () => {
    try {
      // try server-side logout (if endpoint exists)
      await api.post("/auth/logout");
    } catch (err) {
      // ignore network errors
    }
    doLogout();
    setTokenState(null);
    setUserState(null);
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
