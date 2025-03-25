import { 
  Home, List, Database, FileText, Users, Shield, Settings, 
  BarChart, Clipboard, ChevronRight, Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Application, Form } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const [hoveredAppId, setHoveredAppId] = useState<number | null>(null);
  const { isAdmin, user } = useAuth();
  
  // Fetch applications
  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: true,
  });
  
  // Fetch forms for hovered application
  const { data: applicationForms = [], isLoading: isLoadingForms } = useQuery<Form[]>({
    queryKey: ['/api/applications', hoveredAppId, 'forms'],
    queryFn: async () => {
      if (!hoveredAppId) return [];
      const response = await fetch(`/api/applications/${hoveredAppId}/forms`);
      if (!response.ok) {
        throw new Error('Failed to fetch application forms');
      }
      return response.json();
    },
    enabled: !!hoveredAppId,
  });
  
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
      case "bar-chart": return <BarChart className="h-4 w-4" />;
      case "clipboard-check": return <Clipboard className="h-4 w-4" />;
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
        {/* Core Navigation Items */}
        {NAVIGATION_ITEMS.map((category, index) => (
          <div key={index} className="mb-4">
            <div className="p-2 text-sm font-semibold text-gray-500">
              {category.category}
            </div>
            
            {category.items.map((item, itemIndex) => (
              <Link 
                key={itemIndex} 
                href={item.path}
                className={cn(
                  "flex items-center p-2 space-x-2 rounded",
                  location === item.path 
                    ? "bg-gray-100 text-primary" 
                    : "hover:bg-gray-100"
                )}
              >
                <span className={cn(
                  location === item.path 
                    ? "text-primary" 
                    : "text-gray-500"
                )}>
                  {getIcon(item.icon)}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
        
        {/* Applications Section */}
        <div className="mb-4">
          <div className="p-2 text-sm font-semibold text-gray-500">
            Applications
          </div>
          
          {isLoadingApps ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Filter out default sample applications */}
              {applications?.filter(app => app.createdBy !== undefined || isAdmin)
                .map((app: Application) => (
                <div 
                  key={app.id}
                  className="relative"
                  onMouseEnter={() => setHoveredAppId(app.id)}
                  onMouseLeave={() => setHoveredAppId(null)}
                >
                  <Link 
                    href={`/applications/${app.id}`}
                    className={cn(
                      "flex items-center justify-between p-2 space-x-2 rounded",
                      (location === `/applications/${app.id}` || location.startsWith(`/applications/${app.id}/`))
                        ? "bg-gray-100 text-primary" 
                        : "hover:bg-gray-100"
                    )}
                  >
                    <span className="flex items-center space-x-2">
                      <span className={cn(
                        (location === `/applications/${app.id}` || location.startsWith(`/applications/${app.id}/`))
                          ? "text-primary" 
                          : "text-gray-500"
                      )}>
                        {getIcon(app.icon || "list")}
                      </span>
                      <span>{app.name}</span>
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </Link>
                  
                  {/* Display forms for hovered application */}
                  {hoveredAppId === app.id && (
                    <div className="absolute left-full top-0 w-48 bg-white shadow-lg rounded-md p-2 ml-2 z-50">
                      <div className="text-xs font-semibold text-gray-500 mb-2">
                        {app.name} Forms
                      </div>
                      
                      {isLoadingForms ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        </div>
                      ) : applicationForms && applicationForms.length > 0 ? (
                        <div className="space-y-1">
                          {applicationForms.map((form: Form) => (
                            <Link
                              key={form.id}
                              href={`/form/${form.id}`}
                              className="block p-2 text-sm hover:bg-gray-100 rounded"
                            >
                              {form.name}
                            </Link>
                          ))}
                          
                          {isAdmin && (
                            <div className="border-t border-gray-200 pt-2 mt-2">
                              <Link
                                href={`/applications/${app.id}/new-form`}
                                className="block p-2 text-sm hover:bg-gray-100 rounded text-primary font-medium"
                              >
                                + New Form
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          No forms yet
                          {isAdmin && (
                            <Link
                              href={`/applications/${app.id}/new-form`}
                              className="block mt-2 text-sm text-primary font-medium"
                            >
                              + Create Form
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Only show New Application link for admin users */}
          {isAdmin && (
            <Link 
              href="/applications/new"
              className="flex items-center mt-2 p-2 space-x-2 rounded text-primary hover:bg-gray-100"
            >
              <span className="text-primary">+</span>
              <span>New Application</span>
            </Link>
          )}
        </div>
      </nav>
    </aside>
  );
}
