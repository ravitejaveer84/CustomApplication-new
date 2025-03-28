import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  FileText, 
  Loader2, 
  ArrowLeft, 
  Pencil, 
  Eye, 
  Trash2 
} from "lucide-react";
import type { Application, Form } from "@shared/schema";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function ApplicationDetail() {
  const { id } = useParams();
  const applicationId = id ? parseInt(id) : undefined;
  const { isAdmin } = useAuth();

  // Fetch application details
  const { 
    data: application, 
    isLoading: isLoadingApp,
    error: appError
  } = useQuery<Application>({
    queryKey: ['/api/applications', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application');
      }
      return response.json();
    },
    enabled: !!applicationId,
  });

  // Fetch application forms
  const { 
    data: forms = [], 
    isLoading: isLoadingForms,
    error: formsError
  } = useQuery<Form[]>({
    queryKey: ['/api/applications', applicationId, 'forms'],
    queryFn: async () => {
      if (!applicationId) return [];
      const response = await fetch(`/api/applications/${applicationId}/forms`);
      if (!response.ok) {
        throw new Error('Failed to fetch application forms');
      }
      return response.json();
    },
    enabled: !!applicationId,
  });

  // Handle form deletion
  const handleDeleteForm = async (formId: number) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete form');
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId, 'forms'] });
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  if (isLoadingApp || isLoadingForms) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">
          {appError instanceof Error ? appError.message : 'Failed to load application'}
        </p>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{application.name}</h1>
          <p className="text-gray-500">{application.description}</p>
        </div>
        {isAdmin && (
          <Link href={`/applications/${applicationId}/new-form`}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </Link>
        )}
      </div>

      {formsError ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-500">Error loading forms: {formsError instanceof Error ? formsError.message : 'Unknown error'}</p>
        </div>
      ) : forms.length === 0 ? (
        <Card className="bg-gray-50 border-dashed border-2 border-primary/30">
          <CardContent className="py-16 px-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl mb-3">No Forms Created Yet</CardTitle>
            <CardDescription className="text-base mb-6 max-w-md mx-auto">
              {isAdmin ? (
                <>
                  Start building your first form for <span className="font-semibold">{application.name}</span>. 
                  Forms allow you to collect and process information from your users.
                </>
              ) : (
                <>
                  There are no forms available for this application yet. 
                  Please check back later or contact an administrator.
                </>
              )}
            </CardDescription>
            {isAdmin && (
              <Link href={`/applications/${applicationId}/new-form`}>
                <Button className="bg-primary hover:bg-primary/90 transition-colors px-6 py-5 h-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Your First Form
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <Card 
              key={form.id} 
              className={cn(
                "hover:shadow-md transition-shadow border-t-4 overflow-hidden group",
                form.isPublished 
                  ? "border-t-green-500" 
                  : "border-t-amber-500"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold">{form.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {form.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  
                  <div className={cn(
                    "text-xs font-medium px-2.5 py-0.5 rounded-full w-fit",
                    form.isPublished 
                      ? "bg-green-100 text-green-800" 
                      : "bg-amber-100 text-amber-800"
                  )}>
                    {form.isPublished ? 'Published' : 'Draft'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  {isAdmin && (
                    <Link href={`/form-builder/${form.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full transition-colors group-hover:border-primary group-hover:text-primary"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  )}
                  <Link href={`/form/${form.id}`} className={isAdmin ? "flex-1" : "flex-grow"}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full transition-colors group-hover:border-primary group-hover:text-primary"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteForm(form.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {isAdmin && (
            <Link href={`/applications/${applicationId}/new-form`}>
              <Card className="border-dashed border-2 hover:bg-gray-50 cursor-pointer h-full flex flex-col items-center justify-center transition-colors hover:border-primary">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10">
                    <PlusCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <CardTitle className="text-gray-500">Create New Form</CardTitle>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}