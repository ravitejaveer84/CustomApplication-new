import { Home, List, Database, FileText, Users, Shield, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS } from "@/lib/constants";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  
  // Helper function to get icon component by name
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "home": return <Home className="h-4 w-4" />;
      case "list": return <List className="h-4 w-4" />;
      case "database": return <Database className="h-4 w-4" />;
      case "file": return <FileText className="h-4 w-4" />;
      case "users": return <Users className="h-4 w-4" />;
      case "shield": return <Shield className="h-4 w-4" />;
      case "settings": return <Settings className="h-4 w-4" />;
      default: return <List className="h-4 w-4" />;
    }
  };
  
  return (
    <aside className={cn(
      "w-56 bg-white border-r border-gray-200 h-full flex-shrink-0 fixed md:static", 
      "z-40 transition-transform duration-200 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <nav className="p-2 space-y-1">
        {NAVIGATION_ITEMS.map((category, index) => (
          <div key={index}>
            <div className="p-2 text-sm font-semibold text-gray-500">
              {category.category}
            </div>
            
            {category.items.map((item, itemIndex) => (
              <Link 
                key={itemIndex} 
                href={item.path}
              >
                <a className={cn(
                  "flex items-center p-2 space-x-2 rounded",
                  location === item.path 
                    ? "bg-gray-100 text-primary" 
                    : "hover:bg-gray-100"
                )}>
                  <span className={cn(
                    location === item.path 
                      ? "text-primary" 
                      : "text-gray-500"
                  )}>
                    {getIcon(item.icon)}
                  </span>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
