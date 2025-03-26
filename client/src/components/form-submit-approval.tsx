import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApprovalRequestDialog } from "@/components/approval-request-dialog";
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
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
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
  
  // Show options after submission
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