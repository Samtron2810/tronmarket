import { BrowserRouter, useLocation } from "react-router-dom";
import { useContext, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WelcomeModal from "./components/WelcomeModal";
import { AuthContext } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const { token, welcomeModalOpen, setWelcomeModalOpen } =
    useContext(AuthContext);
  const location = useLocation();

  // Show welcome modal after 10 seconds for non-logged-in users,
  // but only once ever (localStorage flag), and not on login/register pages
  useEffect(() => {
    if (token) return; // logged in — skip
    if (location.pathname === "/login" || location.pathname === "/register")
      return; // already on auth page — skip
    if (localStorage.getItem("welcomeDismissed")) return; // already dismissed — skip

    const timer = setTimeout(() => {
      setWelcomeModalOpen(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [token, setWelcomeModalOpen, location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7F4] text-[#101828] selection:bg-emerald-700 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <Footer />

      <WelcomeModal
        open={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
      />
    </div>
  );
}
