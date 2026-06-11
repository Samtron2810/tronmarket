import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-transparent text-slate-100 selection:bg-cyan-500 selection:text-slate-900">
        <Navbar />
        <main className="flex-1">
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}
