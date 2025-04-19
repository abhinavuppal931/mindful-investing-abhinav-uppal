
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Insights from "./pages/Insights";
import Earnings from "./pages/Earnings";
import Portfolios from "./pages/Portfolios";
import Badges from "./pages/Badges";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Insights />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/portfolios" element={<Portfolios />} />
          <Route path="/badges" element={<Badges />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
