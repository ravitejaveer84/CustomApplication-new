import { useState, useEffect } from "react";
import { Eye, Save, Send, Pencil, Loader2 } from "lucide-react";
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
  onSaveClick?: () => void;
}

export function Toolbar({ 
  formName, 
  formId, 
  onFormNameChange,
  onPreviewClick,
  onSaveClick
}: ToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  
  const form = useForm({
    defaultValues: {
      name: formName
    }
  });

  // Update form when formName changes
  useEffect(() => {
    form.setValue('name', formName);
  }, [formName, form]);

  const toggleEditMode = () => {
    if (isEditing) {
      // Save the form name
      const newName = form.getValues().name;
      onFormNameChange(newName);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (onSaveClick) {
      onSaveClick();
    } else {
      try {
        if (!formId) {
          toast({
            title: "Form not saved",
            description: "Please create the form first",
            variant: "destructive"
          });
          return;
        }
        
        await apiRequest<any>(`/api/forms/${formId}`, {
          method: 'PATCH',
          data: {}
        });
        
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
      
      setIsPublishing(true);
      
      await apiRequest<any>(`/api/forms/${formId}/publish`, {
        method: 'POST'
      });
      
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
    } finally {
      setIsPublishing(false);
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
          disabled={isPublishing || !formId}
        >
          {isPublishing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          <span>Publish</span>
        </Button>
      </div>
    </div>
  );
}
