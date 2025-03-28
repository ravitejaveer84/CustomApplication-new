import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Form } from "@shared/schema";

export default function UserDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch all forms
  const { data: forms = [], isLoading } = useQuery<Form[]>({
    queryKey: ["/api/forms"],
    refetchInterval: 5000,
    staleTime: 2000,
    refetchOnWindowFocus: true,
  });

  // Filter forms: only show published forms
  const publishedForms = forms.filter((form) => form.isPublished);
  
  // Search functionality
  const filteredForms = publishedForms.filter((form) => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show the application name with each form
  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/applications"],
    refetchInterval: 5000,
    staleTime: 2000,
  });

  const getApplicationName = (applicationId: number) => {
    const app = applications.find((app: any) => app.id === applicationId);
    return app ? app.name : "Unknown Application";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <div className="w-[250px]">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <div className="w-[250px]">
          <Input
            placeholder="Search forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredForms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-gray-500 mb-4">
            {searchTerm ? "No forms match your search" : "No published forms available"}
          </div>
          {searchTerm && (
            <Button 
              variant="outline" 
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form: Form) => (
            <Card 
              key={form.id} 
              className="hover:shadow-md transition-shadow border-t-4 border-t-green-500 overflow-hidden"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{form.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {getApplicationName(form.applicationId || 0)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {form.description || 'No description provided'}
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/form/${form.id}`} className="w-full">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full transition-colors hover:border-primary hover:text-primary"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Open Form
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}