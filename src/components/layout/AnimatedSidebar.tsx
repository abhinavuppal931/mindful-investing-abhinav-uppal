
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  LineChart, 
  BrainCircuit, 
  Calendar, 
  Briefcase, 
  Award, 
  Home,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/auth/UserMenu";
import { Button } from "@/components/ui/button";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  protected?: boolean;
}

const AnimatedSidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const navItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Focus Mode", href: "/focus", icon: BrainCircuit, protected: true },
    { name: "Portfolios", href: "/portfolios", icon: Briefcase, protected: true },
    { name: "Earnings", href: "/earnings", icon: Calendar },
    { name: "Decision Dashboard", href: "/dashboard", icon: LineChart },
    { name: "Badges", href: "/badges", icon: Award },
  ];

  // Filter nav items based on auth status
  const visibleNavItems = navItems.filter(item => !item.protected || user);

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50",
        "transition-all duration-500 ease-out",
        isHovered ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo/Brand Section */}
      <div className="relative h-16 flex items-center border-b border-sidebar-border overflow-hidden">
        <div className="fixed left-4 flex items-center">
          <BrainCircuit className="h-6 w-6 text-sidebar-primary flex-shrink-0" />
          <span 
            className={cn(
              "ml-3 font-bold text-lg text-sidebar-foreground whitespace-nowrap",
              "transition-all duration-500 ease-out",
              isHovered 
                ? "opacity-100 translate-x-0" 
                : "opacity-0 translate-x-4 pointer-events-none"
            )}
            style={{
              transitionDelay: isHovered ? '200ms' : '0ms'
            }}
          >
            Mindful Investing
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4">
        <div className="space-y-1 px-2">
          {visibleNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "relative flex items-center h-12 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent group overflow-hidden",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                )}
              >
                {/* Fixed icon container */}
                <div className="fixed left-6 flex items-center justify-center">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                </div>
                
                {/* Progressive text label */}
                <span 
                  className={cn(
                    "ml-14 whitespace-nowrap transition-all duration-500 ease-out",
                    isHovered 
                      ? "opacity-100 translate-x-0" 
                      : "opacity-0 translate-x-8 pointer-events-none"
                  )}
                  style={{
                    transitionDelay: isHovered ? `${150 + (index * 50)}ms` : '0ms'
                  }}
                >
                  {item.name}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-2 w-2 h-2 bg-sidebar-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Menu Section */}
      <div className="border-t border-sidebar-border p-2">
        {user ? (
          <div className="relative overflow-hidden">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-12 flex justify-center">
                <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-sidebar-primary-foreground">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div 
                className={cn(
                  "ml-2 transition-all duration-500 ease-out overflow-hidden",
                  isHovered 
                    ? "opacity-100 translate-x-0 w-full" 
                    : "opacity-0 translate-x-4 w-0 pointer-events-none"
                )}
                style={{
                  transitionDelay: isHovered ? '300ms' : '0ms'
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden">
            <Link to="/auth" className="block">
              <Button 
                size="sm" 
                className={cn(
                  "transition-all duration-500 ease-out",
                  isHovered ? "w-full opacity-100" : "w-12 opacity-80"
                )}
              >
                <span className={cn(
                  isHovered ? "block" : "hidden"
                )}>
                  Sign In
                </span>
                <span className={cn(
                  isHovered ? "hidden" : "block"
                )}>
                  →
                </span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AnimatedSidebar;
