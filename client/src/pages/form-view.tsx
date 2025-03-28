import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FormRenderer } from "@/components/form-viewer/form-renderer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Form, FormElement, Application } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function FormView() {
  const { id, appId } = useParams();
  const { toast } = useToast();
  const formId = id ? parseInt(id) : undefined;
  const applicationId = appId ? parseInt(appId) : undefined;
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Fetch form data
  const { data: formData, isLoading: isLoadingForm } = useQuery<Form>({
    queryKey: formId ? [`/api/forms/${formId}`] : [],
    enabled: !!formId
  });
  
  // Fetch application details if we have an applicationId
  const { data: applicationData } = useQuery<Application>({
    queryKey: applicationId ? ['/api/applications', applicationId] : [],
    enabled: !!applicationId,
  });
  
  const handleFormSubmit = async (formData: Record<string, any>) => {
    try {
      if (!formId) return;
      
      await apiRequest(`/api/forms/${formId}/submissions`, {
        method: 'POST',
        data: {
          formId,
          data: formData,
          submittedBy: user?.id
        }
      });
      
      toast({
        title: "Form submitted",
        description: "Your form has been submitted successfully"
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to submit form",
        variant: "destructive"
      });
    }
  };
  
  const getBackLink = () => {
    if (applicationId) {
      return `/applications/${applicationId}`;
    } else {
      return '/';
    }
  };
  
  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!formData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-semibold mb-2">Form not found</h1>
        <p className="text-gray-500 mb-4">The form you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/">
          <Button>Go back to home</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link href={getBackLink()}>
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">{formData.name}</h1>
        </div>
        
        {isAdmin && (
          <Link href={`/form-builder/${formId}`}>
            <Button variant="outline">
              Edit Form
            </Button>
          </Link>
        )}
      </div>
      
      {formData.description && (
        <p className="text-gray-600 mb-6">{formData.description}</p>
      )}
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        {Array.isArray(formData.elements) && formData.elements.length > 0 ? (
          <FormRenderer 
            formId={formId || 0}
            formElements={formData.elements as FormElement[]}
            defaultValues={{}}
            onSubmit={handleFormSubmit}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>This form has no elements.</p>
          </div>
        )}
      </div>
    </div>
  );
}