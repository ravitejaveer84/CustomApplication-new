import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Edit, 
  MoreHorizontal, 
  Plus, 
  Trash, 
  Eye, 
  FileText 
} from "lucide-react";
import { Application } from "@shared/schema";

export default function ApplicationsList() {
  const { toast } = useToast();
  
  // Fetch applications
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ['/api/applications']
  });
  
  // Delete application mutation
  const deleteMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      return await apiRequest<void>(`/api/applications/${applicationId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      toast({
        title: "Application deleted",
        description: "The application has been deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = (applicationId: number) => {
    if (window.confirm("Are you sure you want to delete this application? All associated forms will also be deleted.")) {
      deleteMutation.mutate(applicationId);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <Link href="/applications/new">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create New Application
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>Manage your applications and create forms within them</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : applications?.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Get started by creating your first application. Applications help you organize related forms and processes.
              </p>
              <Link href="/applications/new">
                <Button className="bg-primary hover:bg-primary/90 transition-colors px-6 py-5 h-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Application
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications?.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow border-t-4 border-t-primary overflow-hidden group">
                  <CardHeader className="pb-3 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold">{application.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {application.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/applications/${application.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              <span>View</span>
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleDelete(application.id)}>
                            <Trash className="h-4 w-4 mr-2" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Link href={`/applications/${application.id}`} className="flex-1">
                        <Button variant="outline" className="w-full transition-colors group-hover:border-primary group-hover:text-primary">
                          <Eye className="h-4 w-4 mr-2" />
                          View Forms
                        </Button>
                      </Link>
                      <Link href={`/applications/${application.id}/new-form`} className="flex-1">
                        <Button variant="outline" className="w-full transition-colors group-hover:border-primary group-hover:text-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          New Form
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}