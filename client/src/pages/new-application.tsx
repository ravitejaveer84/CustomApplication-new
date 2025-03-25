import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

// Available icons for applications
const APP_ICONS = [
  { value: "bar-chart", label: "Chart" },
  { value: "file-text", label: "Document" },
  { value: "clipboard-check", label: "Clipboard" },
  { value: "database", label: "Database" },
  { value: "settings", label: "Settings" },
  { value: "users", label: "Users" },
  { value: "home", label: "Home" },
  { value: "shield", label: "Shield" }
];

// Application form schema
const applicationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional()
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function NewApplication() {
  const [isPending, setIsPending] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Initialize the form
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "bar-chart"
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: ApplicationFormValues) => {
    setIsPending(true);
    
    try {
      const response = await apiRequest<{ id: number }>("/api/applications", {
        method: "POST",
        data
      });
      
      toast({
        title: "Application created",
        description: `${data.name} has been created successfully.`,
      });
      
      // Navigate to the new application's page
      navigate(`/applications/${response.id}`);
    } catch (error) {
      console.error("Error creating application:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create application",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Link href="/">
        <Button variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Application</CardTitle>
          <CardDescription>
            Applications contain forms and can be organized by department or function
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. HR Forms, Compliance Reports" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose of this application" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {APP_ICONS.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="px-0 pb-0">
                <Button type="submit" className="ml-auto" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Application
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}