import { FormElement } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUTTON_TYPES, BUTTON_VARIANTS } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, ClipboardCheck, User, Settings, Code } from "lucide-react";

// Form schema for button properties
const buttonPropertiesSchema = z.object({
  label: z.string().min(1, "Button text is required"),
  name: z.string().min(1, "Name is required"),
  buttonType: z.string().optional(),
  buttonVariant: z.string().optional(),
  buttonAction: z.object({
    type: z.string().optional(),
    confirmationMessage: z.string().optional(),
    requireConfirmation: z.boolean().optional(),
    requireReason: z.boolean().optional(),
    navigateTo: z.string().optional(),
    customCode: z.string().optional(),
    notifyUsers: z.array(z.string()).optional(),
    validationRules: z.string().optional(),
    onSuccess: z.string().optional(),
    onError: z.string().optional()
  }).optional()
});

type ButtonPropertiesFormValues = z.infer<typeof buttonPropertiesSchema>;

interface ButtonPropertiesEditorProps {
  element: FormElement;
  onUpdate: (element: FormElement) => void;
}

export function ButtonPropertiesEditor({ element, onUpdate }: ButtonPropertiesEditorProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "approval" | "validation" | "advanced">("basic");
  
  // Initialize form with current element values
  const form = useForm<ButtonPropertiesFormValues>({
    resolver: zodResolver(buttonPropertiesSchema),
    defaultValues: {
      label: element.label || "Button",
      name: element.name || "",
      buttonType: element.buttonType || "submit",
      buttonVariant: element.buttonVariant || "primary",
      buttonAction: element.buttonAction || {
        type: "submit-form",
        requireConfirmation: false,
        requireReason: false
      }
    }
  });
  
  // Handle form submission
  const onSubmit = (data: ButtonPropertiesFormValues) => {
    onUpdate({
      ...element,
      ...data
    });
  };
  
  // Update element when form values change
  const handleFormChange = () => {
    const values = form.getValues();
    onUpdate({
      ...element,
      ...values
    });
  };
  
  return (
    <Form {...form}>
      <form onChange={handleFormChange} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="approval">Approval</TabsTrigger>
            <TabsTrigger value="validation">Rules</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Text</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Element Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buttonType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Type</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a button type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUTTON_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buttonVariant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Button Style</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUTTON_VARIANTS.map(variant => (
                        <SelectItem key={variant.value} value={variant.value}>
                          {variant.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Approval Tab */}
          <TabsContent value="approval" className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md text-sm mb-4 flex items-start">
              <ShieldCheck className="text-blue-500 mr-2 h-5 w-5 mt-0.5 shrink-0" />
              <p>Configure how this button will handle form approvals and rejections.</p>
            </div>
            
            <FormField
              control={form.control}
              name="buttonAction.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Approval Action</FormLabel>
                  <Select 
                    value={field.value || "submit-form"} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="submit-form">Submit Form</SelectItem>
                      <SelectItem value="approve">Approve Submission</SelectItem>
                      <SelectItem value="reject">Reject Submission</SelectItem>
                      <SelectItem value="request-approval">Request Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buttonAction.requireConfirmation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Require Confirmation</FormLabel>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Show a confirmation dialog before performing the action
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch("buttonAction.requireConfirmation") && (
              <FormField
                control={form.control}
                name="buttonAction.confirmationMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmation Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Are you sure you want to proceed with this action?"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {(form.watch("buttonAction.type") === "approve" || form.watch("buttonAction.type") === "reject") && (
              <FormField
                control={form.control}
                name="buttonAction.requireReason"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Require Reason</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Prompt the user to provide a reason for approval/rejection
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </TabsContent>
          
          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-md text-sm mb-4 flex items-start">
              <AlertTriangle className="text-amber-500 mr-2 h-5 w-5 mt-0.5 shrink-0" />
              <p>Define rules that must be satisfied before the button action can be executed.</p>
            </div>
            
            <FormField
              control={form.control}
              name="buttonAction.validationRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Code className="h-4 w-4 mr-1" />
                    Validation Rules
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="// Return true if validation passes, false otherwise
// Example: return formData.status === 'complete';"
                      className="font-mono text-sm"
                      rows={5}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Write JavaScript code that returns true if the form should be submitted, or false otherwise.
                  </p>
                </FormItem>
              )}
            />
          </TabsContent>
          
          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <FormField
              control={form.control}
              name="buttonAction.notifyUsers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Notify Users (Comma-separated emails)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="user1@example.com, user2@example.com"
                      {...field} 
                      value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                      onChange={(e) => {
                        const emails = e.target.value.split(",").map(email => email.trim());
                        field.onChange(emails.filter(email => email !== ""));
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buttonAction.navigateTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navigate After Action</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="/success-page or https://example.com"
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buttonAction.onSuccess"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <ClipboardCheck className="h-4 w-4 mr-1" />
                    On Success Callback
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="// Code to run after successful action
// Example: showNotification('Action completed successfully');"
                      className="font-mono text-sm"
                      rows={3}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buttonAction.onError"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Code className="h-4 w-4 mr-1" />
                    On Error Callback
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="// Code to run if action fails
// Example: showError('Action failed: ' + error.message);"
                      className="font-mono text-sm"
                      rows={3}
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}