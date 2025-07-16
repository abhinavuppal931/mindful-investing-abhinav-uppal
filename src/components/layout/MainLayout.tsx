
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import AnimatedSidebar from "./AnimatedSidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-background">
      {/* Animated Sidebar */}
      <AnimatedSidebar />

      {/* Main Content Area - Always offset by collapsed sidebar width */}
      <main className="flex-1 ml-16 min-h-screen bg-background">
        <div className="container py-6 px-4 md:px-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
