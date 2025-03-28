import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  List, 
  Database, 
  FileText,
  Users,
  Shield,
  Settings,
  BarChart,
  Clipboard,
  ChevronRight,
  Loader2 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Application, Form } from "@shared/schema";
import { NAVIGATION_ITEMS } from "@/lib/constants";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);
  const [hoveredAppId, setHoveredAppId] = useState<number | null>(null);
  const [hoverMenuOpen, setHoverMenuOpen] = useState<boolean>(false);
  const { isAdmin, user } = useAuth();
  
  // Fetch applications with a short refetch interval to keep sidebar in sync
  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: true,
    refetchOnWindowFocus: true,
    staleTime: 2000, // Data is considered fresh for 2 seconds
    refetchInterval: 5000, // Refetch every 5 seconds
  });
  
  // Handle hover on app items
  const handleAppHover = (appId: number) => {
    setHoveredAppId(appId);
    setHoverMenuOpen(true);
  };
  
  // Handle mouse leave
  const handleAppLeave = () => {
    // Small delay to check if we're moving to the hover menu
    setTimeout(() => {
      if (!hoverMenuOpen) {
        setHoveredAppId(null);
      }
    }, 100);
  };
  
  // Get the currently active app ID (either hovered or clicked)
  const activeAppId = hoveredAppId || expandedAppId;
  
  // Fetch forms for expanded/hovered application
  const { data: applicationForms = [], isLoading: isLoadingForms } = useQuery<Form[]>({
    queryKey: ['/api/applications', activeAppId, 'forms'],
    queryFn: async () => {
      if (!activeAppId) return [];
      const response = await fetch(`/api/applications/${activeAppId}/forms`);
      if (!response.ok) {
        throw new Error('Failed to fetch application forms');
      }
      return response.json();
    },
    enabled: !!activeAppId,
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
  
  // Handle form clicks to toggle application expansion
  const handleAppClick = (appId: number) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
    } else {
      setExpandedAppId(appId);
    }
  };

  // Go to application detail page
  const handleAppLinkClick = (appId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/applications/${appId}`;
  };
  
  return (
    <aside className={cn(
      "w-56 bg-white border-r border-gray-200 h-full flex-shrink-0 fixed md:static", 
      "z-40 transition-transform duration-200 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <nav className="p-2 space-y-1">
        {/* Core Navigation Items - Only show for admin users */}
        {isAdmin && NAVIGATION_ITEMS.map((category, index) => (
          <div key={index} className="mb-4">
            <div className="p-2 text-sm font-semibold text-gray-500">
              {category.category}
            </div>
            
            {category.items.filter(item => !item.adminOnly || isAdmin).map((item, itemIndex) => (
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
              {/* Show all applications to all authenticated users */}
              {applications.map((app: Application) => (
                <div 
                  key={app.id} 
                  className="flex flex-col relative"
                  onMouseEnter={() => handleAppHover(app.id)}
                  onMouseLeave={handleAppLeave}
                >
                  {/* Application header - clickable to expand */}
                  <div
                    className={cn(
                      "flex items-center justify-between p-2 space-x-2 rounded cursor-pointer",
                      (location === `/applications/${app.id}` || location.startsWith(`/applications/${app.id}/`))
                        ? "bg-gray-100 text-primary" 
                        : "hover:bg-gray-100"
                    )}
                    onClick={() => handleAppClick(app.id)}
                  >
                    <div 
                      className="flex items-center space-x-2 flex-1"
                      onClick={(e) => handleAppLinkClick(app.id, e)}
                    >
                      <span className={cn(
                        (location === `/applications/${app.id}` || location.startsWith(`/applications/${app.id}/`))
                          ? "text-primary" 
                          : "text-gray-500"
                      )}>
                        {getIcon(app.icon || "list")}
                      </span>
                      <span>{app.name}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-3 w-3 transition-transform", 
                        expandedAppId === app.id ? "rotate-90 text-primary" : "text-gray-400"
                      )} 
                    />
                  </div>
                  
                  {/* Forms list - displayed when application is expanded by click */}
                  {expandedAppId === app.id && (
                    <div className="pl-6 pr-2 py-1 border-l-2 ml-4 border-gray-200">
                      {isLoadingForms ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        </div>
                      ) : applicationForms && applicationForms.length > 0 ? (
                        <div className="space-y-1">
                          {applicationForms
                            .filter(form => isAdmin || form.isPublished)
                            .map((form: Form) => (
                              <Link
                                key={form.id}
                                href={`/form/${form.id}`}
                                className="block p-2 text-sm hover:bg-gray-100 rounded"
                              >
                                {form.name}
                                {!form.isPublished && isAdmin && 
                                  <span className="ml-2 text-xs text-gray-400">(Draft)</span>
                                }
                              </Link>
                            ))}
                          
                          {isAdmin && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
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
                  
                  {/* Hover dropdown for forms - shows when hovering over application */}
                  {hoveredAppId === app.id && expandedAppId !== app.id && (
                    <div 
                      className="absolute left-full top-0 w-48 bg-white shadow-lg rounded-md p-2 ml-2 z-50 before:content-[''] before:absolute before:top-3 before:-left-2 before:border-8 before:border-transparent before:border-r-white"
                      onMouseEnter={() => {
                        setHoveredAppId(app.id);
                        setHoverMenuOpen(true);
                      }}
                      onMouseLeave={() => {
                        setHoverMenuOpen(false);
                        setHoveredAppId(null);
                      }}
                    >
                      <div className="font-medium text-gray-700 border-b pb-1 mb-2">{app.name} Forms</div>
                      {isLoadingForms ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        </div>
                      ) : applicationForms && applicationForms.length > 0 ? (
                        <div className="space-y-1">
                          {applicationForms
                            .filter(form => isAdmin || form.isPublished)
                            .map((form: Form) => (
                              <Link
                                key={form.id}
                                href={`/form/${form.id}`}
                                className="block p-2 text-sm hover:bg-gray-100 rounded"
                              >
                                {form.name}
                                {!form.isPublished && isAdmin && 
                                  <span className="ml-2 text-xs text-gray-400">(Draft)</span>
                                }
                              </Link>
                            ))}
                          
                          {isAdmin && (
                            <div className="pt-1 mt-1 border-t border-gray-200">
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