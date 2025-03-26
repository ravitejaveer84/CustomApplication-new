import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApprovalRequestDialog } from "@/components/approval-request-dialog";
import { FormRenderer } from "@/components/form-viewer";
import { FormElement } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface FormSubmitApprovalProps {
  formId: number;
  formData: Record<string, any>;
  onSuccess?: () => void;
}

export function FormSubmitApproval({ formId, formData, onSuccess }: FormSubmitApprovalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch form definition including any approval buttons
  const { data: formDefinition } = useQuery({
    queryKey: [`/api/forms/${formId}`],
    enabled: !!formId
  });
  
  // Check if form has any approval buttons defined
  const hasApprovalButtons = formDefinition && formDefinition.elements ? 
    formDefinition.elements.some((element: FormElement) => 
      element.type === "button" && 
      element.buttonAction?.type && 
      ["approve", "reject", "request-approval"].includes(element.buttonAction.type)
    ) : false;
  
  // Extract only the approval buttons for rendering
  const approvalButtons = formDefinition && formDefinition.elements ? 
    formDefinition.elements.filter((element: FormElement) => 
      element.type === "button" && 
      element.buttonAction?.type && 
      ["approve", "reject", "request-approval"].includes(element.buttonAction.type)
    ) : [];
  
  // Traditional form submission (without custom approval)
  const submitFormMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ id: number }>(`/api/forms/${formId}/submissions`, {
        method: "POST",
        data: formData,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/forms/${formId}/submissions`] });
      toast({
        title: "Form submitted",
        description: "Your form has been submitted successfully.",
      });
      
      setSubmitted(true);
      setSubmissionId(data.id);
      
      if (onSuccess && !isAuthenticated) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit the form. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = () => {
    submitFormMutation.mutate();
  };
  
  const handleApprovalSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };
  
  // If form has custom approval buttons, use those
  if (hasApprovalButtons) {
    // For submission with approval buttons
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-gray-500">
              Review your submission before proceeding.
            </p>
            
            {/* Render any approval buttons that were defined in the form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvalButtons.map((button: FormElement) => (
                <FormRenderer
                  key={button.id}
                  formId={formId}
                  formElements={[button]}
                  defaultValues={{ 
                    ...formData,
                    submissionId: submissionId // Pass the submission ID if available
                  }}
                  onSubmit={handleApprovalSuccess}
                />
              ))}
              
              {/* Default submit button if no request-approval buttons exist */}
              {!approvalButtons.some(b => b.buttonAction?.type === "request-approval") && (
                <Button
                  onClick={handleSubmit}
                  disabled={submitFormMutation.isPending}
                >
                  {submitFormMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Form
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Traditional submit/approval workflow (legacy support)
  if (!submitted) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-gray-500">
              Review your submission before proceeding.
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                onClick={handleSubmit}
                disabled={submitFormMutation.isPending}
              >
                {submitFormMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Form
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show options after submission (legacy support)
  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-green-700 font-medium">Form submitted successfully!</p>
            <p className="text-sm text-green-600 mt-1">Submission ID: {submissionId}</p>
          </div>
          
          {isAuthenticated && submissionId && (
            <div className="flex justify-end">
              <ApprovalRequestDialog
                formSubmissionId={submissionId}
                trigger={
                  <Button variant="outline">
                    Request Approval
                  </Button>
                }
                onSuccess={handleApprovalSuccess}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}