import { useState } from "react";
import { Eye, Save, Send, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ToolbarProps {
  formName: string;
  formId?: number;
  onFormNameChange: (name: string) => void;
  onPreviewClick: () => void;
}

export function Toolbar({ 
  formName, 
  formId, 
  onFormNameChange,
  onPreviewClick 
}: ToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      name: formName
    }
  });

  const toggleEditMode = () => {
    if (isEditing) {
      // Save the form name
      const newName = form.getValues().name;
      onFormNameChange(newName);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      if (!formId) {
        toast({
          title: "Form not saved",
          description: "Please create the form first",
          variant: "destructive"
        });
        return;
      }
      
      await apiRequest('PATCH', `/api/forms/${formId}`, {});
      
      toast({
        title: "Form saved",
        description: "Your form has been saved successfully"
      });
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Error",
        description: "Failed to save form",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async () => {
    try {
      if (!formId) {
        toast({
          title: "Form not published",
          description: "Please save the form first",
          variant: "destructive"
        });
        return;
      }
      
      await apiRequest('POST', `/api/forms/${formId}/publish`, {});
      
      toast({
        title: "Form published",
        description: "Your form has been published successfully"
      });
    } catch (error) {
      console.error('Error publishing form:', error);
      toast({
        title: "Error",
        description: "Failed to publish form",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {isEditing ? (
          <Form {...form}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      className="text-xl font-semibold" 
                      {...field} 
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          toggleEditMode();
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        ) : (
          <h1 className="text-xl font-semibold">{formName}</h1>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleEditMode}
        >
          <Pencil className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          className="space-x-1" 
          onClick={onPreviewClick}
        >
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </Button>
        <Button 
          variant="outline" 
          className="space-x-1"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          <span>Save</span>
        </Button>
        <Button 
          className="space-x-1 bg-[#107c10] hover:bg-[#0b5d0b]"
          onClick={handlePublish}
        >
          <Send className="h-4 w-4" />
          <span>Publish</span>
        </Button>
      </div>
    </div>
  );
}
