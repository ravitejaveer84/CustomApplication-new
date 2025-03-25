import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Unauthorized() {
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <h2 className="text-3xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
        <div className="flex justify-center gap-4 mt-4">
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}