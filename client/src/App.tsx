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

// We'll create these pages next
// import ApplicationDetail from "@/pages/application-detail";
// import NewApplication from "@/pages/new-application";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FormsList} />
      
      {/* Application routes - temporarily using NotFound as placeholder */}
      <Route path="/applications/new" component={NotFound} />
      <Route path="/applications/:id" component={NotFound} />
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
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        <Sidebar isOpen={sidebarOpen} />
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader toggleSidebar={toggleSidebar} />
          
          <main className="flex-1 overflow-y-auto p-4">
            <Router />
          </main>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
