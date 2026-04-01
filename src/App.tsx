import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import { getActiveSession } from "@/lib/supabase-storage";
import MorningPlanning from "./pages/MorningPlanning";
import FocusSessionPage from "./pages/FocusSessionPage";
import SessionReviewPage from "./pages/SessionReviewPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionActive, setSessionActive] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const check = async () => {
      const active = await getActiveSession();
      setSessionActive(!!active);
      setChecked(true);
      if (active && location.pathname !== '/focus') {
        navigate('/focus');
      }
    };
    check();
  }, [location.pathname, navigate]);

  // Re-check session status on route change
  useEffect(() => {
    const check = async () => {
      const active = await getActiveSession();
      setSessionActive(!!active);
    };
    check();
  }, [location.pathname]);

  if (!checked) return null;

  return (
    <div className="flex">
      <AppSidebar hidden={sessionActive} />
      <main className={sessionActive ? 'w-full' : 'ml-16 flex-1'}>
        <Routes>
          <Route path="/" element={<MorningPlanning />} />
          <Route path="/focus" element={<FocusSessionPage />} />
          <Route path="/review" element={<SessionReviewPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
