import { useState, useEffect } from "react";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";
import { Toolbar } from "@/components/form-builder/toolbar";
import { FormElementsList } from "@/components/form-builder/form-elements-list";
import { FormCanvas } from "@/components/form-builder/form-canvas";
import { PropertiesPanel } from "@/components/form-builder/properties-panel";
import { DataSourceModal } from "@/components/form-builder/data-source-modal";
import { Button } from "@/components/ui/button";
import { Database, ArrowLeft, Loader2 } from "lucide-react";
import { FormElement } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function FormBuilder() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formElements, setFormElements] = useState<FormElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [dataSourceModalOpen, setDataSourceModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [formName, setFormName] = useState("New Form");
  const [formDescription, setFormDescription] = useState("");
  const [savedFormId, setSavedFormId] = useState<number | undefined>(undefined);
  const { toast } = useToast();
  
  // Get route parameters
  const { id, appId } = useParams();
  const [_, setLocation] = useLocation();
  
  // Application context
  const applicationId = appId ? parseInt(appId) : undefined;
  
  // Fetch application details if we have an applicationId
  const { data: applicationData } = useQuery<Application>({
    queryKey: applicationId ? ['/api/applications', applicationId] : [],
    enabled: !!applicationId,
  });
  
  // If we have a form ID, fetch the form data
  const { data: formData, isLoading: isLoadingForm } = useQuery<Form>({
    queryKey: id ? [`/api/forms/${id}`] : [],
    enabled: !!id
  });

  // Initialize form data when loaded
  useEffect(() => {
    if (formData) {
      setFormName(formData.name);
      setFormDescription(formData.description || "");
      setFormElements(formData.elements);
      setSavedFormId(formData.id);
    }
  }, [formData]);

  // Create or update form mutation
  const mutation = useMutation({
    mutationFn: async (formData: { 
      name: string, 
      description: string,
      elements: FormElement[],
      applicationId?: number
    }) => {
      if (savedFormId) {
        // Update existing form
        return apiRequest(`/api/forms/${savedFormId}`, {
          method: 'PATCH',
          data: formData
        });
      } else {
        // Create new form
        return apiRequest('/api/forms', {
          method: 'POST',
          data: {
            ...formData,
            isPublished: false
          }
        });
      }
    },
    onSuccess: (data) => {
      if (!savedFormId) {
        setSavedFormId(data.id);
        // Update location to the form builder with ID
        setLocation(`/form-builder/${data.id}`);
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/forms'] });
      if (applicationId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/applications', applicationId, 'forms'] 
        });
      }
      
      toast({
        title: "Form saved",
        description: `Your form "${formName}" has been saved successfully`
      });
    },
    onError: (error) => {
      console.error('Error saving form:', error);
      toast({
        title: "Error",
        description: "Failed to save form",
        variant: "destructive"
      });
    }
  });

  const handleDragStart = (elementType: string) => {
    // The actual dataTransfer is set in the FormElementsList component
    console.log('Element dragged:', elementType);
  };

  const handleElementSelect = (element: FormElement) => {
    setSelectedElement(element);
  };
  
  const handleElementUpdate = (updatedElement: FormElement) => {
    const updatedElements = formElements.map(el => 
      el.id === updatedElement.id ? updatedElement : el
    );
    setFormElements(updatedElements);
  };
  
  const handleFormNameChange = (name: string) => {
    setFormName(name);
  };
  
  const handleSaveForm = async () => {
    mutation.mutate({ 
      name: formName, 
      description: formDescription,
      elements: formElements,
      applicationId: applicationId
    });
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const getBackLink = () => {
    if (applicationId) {
      return `/applications/${applicationId}`;
    } else if (savedFormId) {
      return `/form/${savedFormId}`;
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
  
  return (
    <div className="h-screen flex flex-col bg-[#f3f2f1]">
      <AppHeader toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Context information */}
          {applicationId && applicationData && (
            <div className="bg-white border-b border-gray-200 p-3 flex items-center">
              <Link href={getBackLink()}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {applicationData.name}
                </Button>
              </Link>
              <div className="ml-4 text-sm text-gray-500">
                Creating form for <span className="font-medium">{applicationData.name}</span> application
              </div>
            </div>
          )}
          
          <Toolbar 
            formName={formName} 
            formId={savedFormId}
            onFormNameChange={handleFormNameChange}
            onPreviewClick={() => setPreviewModalOpen(true)}
            onSaveClick={handleSaveForm}
          />
          
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Form Components */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-gray-200 font-semibold">Form Elements</div>
              <div className="p-3 overflow-y-auto flex-1">
                <FormElementsList onDragStart={handleDragStart} />
              </div>
              
              <div className="p-3 border-t border-gray-200">
                <Button 
                  className="w-full bg-primary text-white flex items-center justify-center space-x-2"
                  onClick={() => setDataSourceModalOpen(true)}
                >
                  <Database className="h-4 w-4" />
                  <span>Configure Data Source</span>
                </Button>
              </div>
            </div>
            
            {/* Middle Panel - Form Designer */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 bg-[#f3f2f1]">
                <FormCanvas 
                  formElements={formElements} 
                  onElementsChange={setFormElements}
                  onElementSelect={handleElementSelect}
                  selectedElementId={selectedElement?.id || null}
                />
              </div>
            </div>
            
            {/* Right Panel - Properties */}
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
              <PropertiesPanel 
                selectedElement={selectedElement} 
                onElementUpdate={handleElementUpdate}
              />
            </div>
          </div>
        </main>
      </div>
      
      {/* Data Source Modal */}
      <DataSourceModal 
        isOpen={dataSourceModalOpen}
        onClose={() => setDataSourceModalOpen(false)}
      />
      
      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-2xl font-semibold mb-4">{formName} - Preview</h2>
            
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              {formElements.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>This form has no elements yet. Add some elements to preview.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {formElements.map(element => {
                    // Render each element similar to FormCanvas but with actual input functionality
                    // This is a simplified version - a real implementation would need to handle
                    // all element types, validation, etc.
                    return (
                      <div key={element.id} className="mb-4">
                        {element.type === 'text' && (
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              {element.label} {element.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type="text"
                              className="w-full p-2 border border-gray-300 rounded"
                              placeholder={element.placeholder}
                            />
                            {element.helpText && <p className="text-xs text-gray-500 mt-1">{element.helpText}</p>}
                          </div>
                        )}
                        
                        {/* Include other element types as needed */}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
