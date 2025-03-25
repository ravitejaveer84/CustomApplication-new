import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import FormBuilder from "@/pages/form-builder";
import FormsList from "@/pages/forms-list";
import DataSources from "@/pages/data-sources";
import { Sidebar } from "@/components/sidebar";
import { AppHeader } from "@/components/app-header";
import ApplicationDetail from "@/pages/application-detail";
import NewApplication from "@/pages/new-application";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FormsList} />
      
      {/* Application routes */}
      <Route path="/applications/new" component={NewApplication} />
      <Route path="/applications/:id" component={ApplicationDetail} />
      <Route path="/applications/:appId/new-form" component={FormBuilder} />
      
      {/* Form routes */}
      <Route path="/form-builder" component={FormBuilder} />
      <Route path="/form-builder/:id" component={FormBuilder} />
      <Route path="/form/:id" component={FormBuilder} />
      
      {/* Data sources routes */}
      <Route path="/data-sources" component={DataSources} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useState(window.location.pathname);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Check if the current route is the form builder which has its own layout
  const isFormBuilderRoute = 
    location.startsWith('/form-builder') || 
    location.startsWith('/applications/') && location.includes('/new-form');
  
  return (
    <QueryClientProvider client={queryClient}>
      {isFormBuilderRoute ? (
        // Form builder has its own layout, so just render the router
        <div className="h-screen w-full">
          <Router />
          <Toaster />
        </div>
      ) : (
        // Regular layout with sidebar and header
        <div className="flex h-screen w-full overflow-hidden bg-gray-50">
          <Sidebar isOpen={sidebarOpen} />
          
          <div className="flex flex-col flex-1 overflow-hidden">
            <AppHeader toggleSidebar={toggleSidebar} />
            
            <main className="flex-1 overflow-y-auto p-4">
              <Router />
            </main>
          </div>
          <Toaster />
        </div>
      )}
    </QueryClientProvider>
  );
}

export default App;
