
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Insights from "./pages/Insights";
import Focus from "./pages/Focus";
import Portfolios from "./pages/Portfolios";
import Earnings from "./pages/Earnings";
import Dashboard from "./pages/Dashboard";
import Badges from "./pages/Badges";
import NotFound from "./pages/NotFound";

// Import Firebase to ensure it's initialized
import "@/lib/firebase";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/portfolios" element={<Portfolios />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
