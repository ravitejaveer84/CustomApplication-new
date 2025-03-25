import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";
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
import { Edit, MoreHorizontal, Plus, Trash, Eye, Send } from "lucide-react";

export default function FormsList() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch forms
  const { data: forms, isLoading } = useQuery({
    queryKey: ['/api/forms']
  });
  
  // Delete form mutation
  const deleteMutation = useMutation({
    mutationFn: async (formId: number) => {
      return apiRequest('DELETE', `/api/forms/${formId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      toast({
        title: "Form deleted",
        description: "The form has been deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive"
      });
    }
  });
  
  // Publish form mutation
  const publishMutation = useMutation({
    mutationFn: async (formId: number) => {
      return apiRequest('POST', `/api/forms/${formId}/publish`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      toast({
        title: "Form published",
        description: "The form has been published successfully"
      });
    },
    onError: (error) => {
      console.error('Error publishing form:', error);
      toast({
        title: "Error",
        description: "Failed to publish form",
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = (formId: number) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      deleteMutation.mutate(formId);
    }
  };
  
  const handlePublish = (formId: number) => {
    publishMutation.mutate(formId);
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Forms</h1>
        <Link href="/form-builder">
          <Button className="bg-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create New Form
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Forms</CardTitle>
          <CardDescription>Manage your forms</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : forms?.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No forms found. Create your first form!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Source</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms?.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${form.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {form.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </TableCell>
                    <TableCell>{form.dataSourceId || "None"}</TableCell>
                    <TableCell>{new Date(form.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/form-builder/${form.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            <span>Preview</span>
                          </DropdownMenuItem>
                          {!form.isPublished && (
                            <DropdownMenuItem onClick={() => handlePublish(form.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              <span>Publish</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(form.id)}>
                            <Trash className="h-4 w-4 mr-2" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
