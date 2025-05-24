
import React from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  LineChart, 
  BrainCircuit, 
  Calendar, 
  Briefcase, 
  Award, 
  Home,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Insights", href: "/insights", icon: BarChart3 },
    { name: "Focus Mode", href: "/focus", icon: BrainCircuit },
    { name: "Portfolios", href: "/portfolios", icon: Briefcase },
    { name: "Earnings", href: "/earnings", icon: Calendar },
    { name: "Decision Dashboard", href: "/dashboard", icon: LineChart },
    { name: "Badges", href: "/badges", icon: Award },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-mindful-600" />
          <span className="font-bold text-xl text-foreground">Mindful Investing</span>
        </Link>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar (overlay) */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMenu}>
          <div className="w-64 bg-card h-full overflow-y-auto border-r border-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border">
              <Link to="/" className="flex items-center space-x-2" onClick={toggleMenu}>
                <BrainCircuit className="h-6 w-6 text-mindful-600" />
                <span className="font-bold text-xl text-foreground">Mindful Investing</span>
              </Link>
            </div>
            <nav className="mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center p-3 text-foreground hover:bg-accent space-x-3 transition-colors"
                  onClick={toggleMenu}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <BrainCircuit className="h-6 w-6 text-mindful-600" />
              <span className="font-bold text-xl text-foreground">Mindful Investing</span>
            </Link>
            <ThemeToggle />
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center p-3 rounded-md space-x-3 text-foreground",
                  "hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden bg-background">
          <div className="container py-6 px-4 md:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
