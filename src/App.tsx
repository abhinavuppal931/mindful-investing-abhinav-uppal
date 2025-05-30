
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Insights from "./pages/Insights";
import Focus from "./pages/Focus";
import Portfolios from "./pages/Portfolios";
import Earnings from "./pages/Earnings";
import Dashboard from "./pages/Dashboard";
import Badges from "./pages/Badges";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/focus" element={
              <ProtectedRoute>
                <Focus />
              </ProtectedRoute>
            } />
            <Route path="/portfolios" element={
              <ProtectedRoute>
                <Portfolios />
              </ProtectedRoute>
            } />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
