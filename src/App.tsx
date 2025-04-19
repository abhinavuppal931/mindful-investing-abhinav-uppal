
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProps } from "next/app";

const queryClient = new QueryClient();

// Define proper interface for the App component props
interface AppComponentProps {
  Component?: React.ComponentType<any>;
  pageProps?: any;
}

const App = ({ Component, pageProps }: AppComponentProps) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {Component ? <Component {...pageProps} /> : null}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
