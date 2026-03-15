import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/AppSidebar";
import MorningPlanning from "./pages/MorningPlanning";
import FocusSessionPage from "./pages/FocusSessionPage";
import SessionReviewPage from "./pages/SessionReviewPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex">
          <AppSidebar />
          <main className="ml-16 flex-1">
            <Routes>
              <Route path="/" element={<MorningPlanning />} />
              <Route path="/focus" element={<FocusSessionPage />} />
              <Route path="/review" element={<SessionReviewPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
