import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import Login from "@/pages/login";
import Unauthorized from "@/pages/unauthorized";
import Users from "@/pages/users";
import Permissions from "@/pages/permissions";
import ApprovalRequests from "@/pages/approval-requests";
import FileUploadDemo from "@/pages/file-upload-demo";
import { AuthProvider, RequireAuth, RequireAdmin } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/unauthorized" component={Unauthorized} />
      
      {/* Protected routes - general users */}
      <Route path="/">
        {(params) => (
          <RequireAuth>
            <FormsList />
          </RequireAuth>
        )}
      </Route>
      
      {/* Form routes */}
      <Route path="/form-builder">
        {(params) => (
          <RequireAuth>
            <FormBuilder />
          </RequireAuth>
        )}
      </Route>
      <Route path="/form-builder/:id">
        {(params) => (
          <RequireAuth>
            <FormBuilder />
          </RequireAuth>
        )}
      </Route>
      <Route path="/form/:id">
        {(params) => (
          <RequireAuth>
            <FormBuilder />
          </RequireAuth>
        )}
      </Route>
      
      {/* Admin routes */}
      <Route path="/applications/new">
        {(params) => (
          <RequireAdmin>
            <NewApplication />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/applications/:id">
        {(params) => (
          <RequireAuth>
            <ApplicationDetail />
          </RequireAuth>
        )}
      </Route>
      <Route path="/applications/:appId/new-form">
        {(params) => (
          <RequireAdmin>
            <FormBuilder />
          </RequireAdmin>
        )}
      </Route>
      
      {/* Data sources routes - admin only */}
      <Route path="/data-sources">
        {(params) => (
          <RequireAdmin>
            <DataSources />
          </RequireAdmin>
        )}
      </Route>
      
      {/* Admin routes for user management */}
      <Route path="/users">
        {(params) => (
          <RequireAdmin>
            <Users />
          </RequireAdmin>
        )}
      </Route>
      
      <Route path="/permissions">
        {(params) => (
          <RequireAdmin>
            <Permissions />
          </RequireAdmin>
        )}
      </Route>
      
      {/* Approval workflow routes */}
      <Route path="/approval-requests">
        {(params) => (
          <RequireAuth>
            <ApprovalRequests />
          </RequireAuth>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Check if the current route is using a specialized layout
  const usesCustomLayout = 
    location.startsWith('/form-builder') || 
    (location.startsWith('/applications/') && location.includes('/new-form')) ||
    location === '/applications/new' ||
    location === '/login' ||
    location === '/unauthorized';
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {usesCustomLayout ? (
          // These pages use a custom layout without sidebar and header
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
