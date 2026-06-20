import { BrowserRouter } from "react-router-dom";
import { useContext, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WelcomeModal from "./components/WelcomeModal";
import { AuthContext } from "./context/AuthContext";

export default function App() {
  const { token, welcomeModalOpen, setWelcomeModalOpen } =
    useContext(AuthContext);

  // Show welcome modal after 5 seconds for non-logged-in users
  useEffect(() => {
    if (token) return; // logged in — skip

    const timer = setTimeout(() => {
      setWelcomeModalOpen(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [token, setWelcomeModalOpen]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-transparent text-slate-100 selection:bg-cyan-500 selection:text-slate-900">
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
    </BrowserRouter>
  );
}
