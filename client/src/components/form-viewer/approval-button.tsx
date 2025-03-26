import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormElement } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ApprovalButtonProps {
  element: FormElement;
  formId: number;
  formData: Record<string, any>;
  disabled?: boolean;
  onSuccess?: () => void;
}

export function ApprovalButton({ 
  element, 
  formId, 
  formData, 
  disabled = false,
  onSuccess 
}: ApprovalButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  
  const buttonAction = element.buttonAction || {
    type: "submit-form",
    requireConfirmation: false,
    requireReason: false
  };
  
  // Get button classes based on variant
  const getButtonClasses = () => {
    const variant = element.buttonVariant || "primary";
    return variant;
  };

  // Evaluate validation rules
  const isValid = () => {
    if (!buttonAction.validationRules) return true;
    
    try {
      // Using Function constructor to evaluate the validation rules
      // The function gets access to formData
      const validateFn = new Function('formData', `
        try {
          ${buttonAction.validationRules}
        } catch (error) {
          console.error("Validation rule error:", error);
          return false;
        }
      `);
      
      return validateFn(formData);
    } catch (error) {
      console.error("Error evaluating validation rules:", error);
      return false;
    }
  };
  
  // Handle submit form request
  const submitFormMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/forms/${formId}/submissions`, {
        method: "POST",
        data: { formData }
      });
    },
    onSuccess: () => {
      toast({
        title: "Form submitted",
        description: "Your form has been submitted successfully."
      });
      if (onSuccess) onSuccess();
      handleSuccessAction();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive"
      });
      handleErrorAction(error);
    }
  });
  
  // Handle approval request
  const requestApprovalMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/approval-requests`, {
        method: "POST",
        data: {
          formId,
          formData,
          requesterId: user?.id
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Approval requested",
        description: "Your request has been submitted for approval."
      });
      if (onSuccess) onSuccess();
      handleSuccessAction();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to request approval. Please try again.",
        variant: "destructive"
      });
      handleErrorAction(error);
    }
  });
  
  // Handle approval response (approve or reject)
  const respondToApprovalMutation = useMutation({
    mutationFn: async ({ submissionId, action }: { submissionId: number, action: "approve" | "reject" }) => {
      const url = `/api/approval-requests/${submissionId}`;
      const data = {
        status: action === "approve" ? "approved" : "rejected",
        approvedById: user?.id,
        reason: buttonAction.requireReason ? reason : undefined
      };
      
      return apiRequest(url, {
        method: "PATCH",
        data
      });
    },
    onSuccess: () => {
      const action = buttonAction.type === "approve" ? "approved" : "rejected";
      toast({
        title: `Request ${action}`,
        description: `The request has been ${action} successfully.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-requests/pending"] });
      if (onSuccess) onSuccess();
      handleSuccessAction();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${buttonAction.type} request. Please try again.`,
        variant: "destructive"
      });
      handleErrorAction(error);
    }
  });
  
  // Handle custom success actions
  const handleSuccessAction = () => {
    if (!buttonAction.onSuccess) return;
    
    try {
      const successFn = new Function('formData', `
        try {
          ${buttonAction.onSuccess}
        } catch (error) {
          console.error("Success callback error:", error);
        }
      `);
      
      successFn(formData);
    } catch (error) {
      console.error("Error executing success callback:", error);
    }
    
    // Handle navigation if specified
    if (buttonAction.navigateTo) {
      if (buttonAction.navigateTo.startsWith('http')) {
        window.location.href = buttonAction.navigateTo;
      } else {
        window.location.pathname = buttonAction.navigateTo;
      }
    }
  };
  
  // Handle custom error actions
  const handleErrorAction = (error: any) => {
    if (!buttonAction.onError) return;
    
    try {
      const errorFn = new Function('error', 'formData', `
        try {
          ${buttonAction.onError}
        } catch (err) {
          console.error("Error callback error:", err);
        }
      `);
      
      errorFn(error, formData);
    } catch (err) {
      console.error("Error executing error callback:", err);
    }
  };
  
  // Main button click handler
  const handleButtonClick = () => {
    // Check validation rules
    if (!isValid()) {
      toast({
        title: "Validation Error",
        description: "Please check form data and try again.",
        variant: "destructive"
      });
      return;
    }
    
    // If confirmation is required, show dialog
    if (buttonAction.requireConfirmation) {
      setDialogOpen(true);
      return;
    }
    
    // Otherwise execute the action directly
    executeAction();
  };
  
  // Execute the button action
  const executeAction = () => {
    switch (buttonAction.type) {
      case "submit-form":
        submitFormMutation.mutate();
        break;
      case "request-approval":
        requestApprovalMutation.mutate();
        break;
      case "approve":
      case "reject":
        // This assumes we have a submissionId in the formData
        // A real implementation would need to get this from somewhere
        if (formData.submissionId) {
          respondToApprovalMutation.mutate({
            submissionId: formData.submissionId,
            action: buttonAction.type as "approve" | "reject"
          });
        } else {
          toast({
            title: "Error",
            description: "No submission ID found for approval action.",
            variant: "destructive"
          });
        }
        break;
      default:
        console.error("Unknown button action type:", buttonAction.type);
    }
  };
  
  // Confirmation dialog
  const renderConfirmationDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            {buttonAction.confirmationMessage || "Are you sure you want to proceed?"}
          </DialogDescription>
        </DialogHeader>
        
        {buttonAction.requireReason && (
          <div className="py-4">
            <Textarea
              placeholder="Please provide a reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            variant={buttonAction.type === "reject" ? "destructive" : "default"}
            onClick={() => {
              if (buttonAction.requireReason && !reason) {
                toast({
                  title: "Reason Required",
                  description: "Please provide a reason before proceeding.",
                  variant: "destructive"
                });
                return;
              }
              setDialogOpen(false);
              executeAction();
            }}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <>
      <Button
        type="button"
        variant={getButtonClasses()}
        disabled={disabled || 
          submitFormMutation.isPending || 
          requestApprovalMutation.isPending || 
          respondToApprovalMutation.isPending}
        onClick={handleButtonClick}
        className="w-full"
      >
        {element.label || "Submit"}
      </Button>
      
      {renderConfirmationDialog()}
    </>
  );
}