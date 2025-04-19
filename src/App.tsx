
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Add proper typing for the props
interface AppProps {
  Component: React.ComponentType<any>;
  pageProps: any;
}

const App = ({ Component, pageProps }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Component {...pageProps} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
