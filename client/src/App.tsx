import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import FormBuilder from "@/pages/form-builder";
import FormsList from "@/pages/forms-list";
import DataSources from "@/pages/data-sources";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FormsList} />
      <Route path="/form-builder" component={FormBuilder} />
      <Route path="/form-builder/:id" component={FormBuilder} />
      <Route path="/data-sources" component={DataSources} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
