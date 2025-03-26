import { useState, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Plus, RefreshCw, Code } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ActionEditor } from "./action-editor";
import { ButtonPropertiesEditor } from "./button-properties-editor";

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  onElementUpdate: (updatedElement: FormElement) => void;
}

interface DataSource {
  id: number;
  name: string;
  type: string;
  config: string;
  fields: Array<{ name: string; type: string; selected: boolean }>;
  selectedFields: string[];
}

export function PropertiesPanel({ selectedElement, onElementUpdate }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "validation" | "data" | "advanced" | "actions">("basic");
  
  // State for holding selected data source details with fields
  const [activeDataSource, setActiveDataSource] = useState<any>(null);
  const [activeSourceFields, setActiveSourceFields] = useState<any[]>([]);
  
  const form = useForm<FormElement>({
    defaultValues: selectedElement || {
      id: "",
      type: "text",
      label: "",
      name: "",
      placeholder: "",
      helpText: "",
      required: false,
      validation: {
        minLength: 0,
        maxLength: 100,
        errorMessage: ""
      },
      dataSource: {
        id: "",
        field: ""
      },
      cssClass: ""
    }
  });
  
  // Fetch data sources
  const { data: dataSources = [], isLoading: loadingDataSources } = useQuery<DataSource[]>({
    queryKey: ["/api/datasources"],
    enabled: activeTab === "data"
  });
  
  // Get the data source ID from the selected element
  const dataSourceId = selectedElement?.dataSource?.id;
  
  // Get all data sources
  const { 
    isLoading: loadingDataSource,
    refetch: refetchDataSources
  } = useQuery({
    queryKey: ["/api/datasources"],
    enabled: true,
    refetchOnMount: true
  });
  
  // This will directly fetch the full data source with its fields
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null);
  
  // Create a function to fetch the specific data source directly
  const fetchDataSource = useCallback(async (id: number) => {
    if (!id) return;
    
    try {
      console.log("Directly fetching data source with ID:", id);
      const response = await fetch(`/api/datasources/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data source: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched data source:", data);
      
      // Ensure fields is always an array and parse config if it's a string
      if (data) {
        // Initialize fields array if not present
        if (!data.fields) {
          data.fields = [];
        }
        
        // Parse config if it's a JSON string
        if (typeof data.config === 'string' && data.config) {
          try {
            data.parsedConfig = JSON.parse(data.config);
          } catch (e) {
            console.error("Error parsing config:", e);
          }
        }
        
        setSelectedDataSource(data);
        return data;
      }
    } catch (err) {
      console.error("Error fetching data source:", err);
    }
    
    return null;
  }, []);
  
  // Function to refresh the data source
  const refetchDataSource = useCallback(async () => {
    if (selectedElement?.dataSource?.id) {
      try {
        console.log("Manually refreshing data source with ID:", selectedElement.dataSource.id);
        const response = await fetch(`/api/datasources/${selectedElement.dataSource.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch data source");
        }
        
        const data = await response.json();
        console.log("Refreshed data source:", data);
        
        setActiveDataSource(data);
        // Ensure fields is an array
        const fields = Array.isArray(data.fields) ? data.fields : [];
        setActiveSourceFields(fields);
      } catch (error) {
        console.error("Error refreshing data source:", error);
      }
    }
  }, [selectedElement?.dataSource?.id]);
  
  // Fetch the data source when the ID changes
  useEffect(() => {
    if (dataSourceId) {
      fetchDataSource(dataSourceId);
    } else {
      setSelectedDataSource(null);
    }
  }, [dataSourceId, fetchDataSource]);
  
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (!selectedElement) return;
    
    form.setValue(fieldName as any, value);
    
    // Only update parent component when we have a complete change
    // This could be throttled or debounced in a real implementation
    const updatedValues = form.getValues();
    onElementUpdate({ ...selectedElement, ...updatedValues });
  }, [selectedElement, form, onElementUpdate]);
  
  // Force refresh when changing tab to data
  useEffect(() => {
    if (activeTab === "data" && dataSourceId) {
      console.log("Refreshing data source fields for ID:", dataSourceId);
      refetchDataSource();
    }
  }, [activeTab, dataSourceId, refetchDataSource]);
  
  // Add debugging to check if we're getting data source fields
  useEffect(() => {
    if (dataSourceId && selectedDataSource && selectedElement) {
      console.log("Selected data source:", selectedDataSource);
      console.log("Fields:", selectedDataSource.fields);
      
      // If we have fields and the current field mapping is empty, suggest the first selected field
      if (selectedDataSource.fields?.length > 0 && !selectedElement.dataSource?.field) {
        const selectedFields = selectedDataSource.fields.filter((f: any) => f.selected);
        if (selectedFields.length > 0) {
          // Suggest the first selected field
          const suggestedField = selectedFields[0].name;
          handleFieldChange("dataSource", {
            ...selectedElement.dataSource,
            field: suggestedField
          });
          console.log("Auto-selected field:", suggestedField);
        }
      }
    }
  }, [dataSourceId, selectedDataSource, selectedElement, handleFieldChange]);
  
  useEffect(() => {
    if (selectedElement) {
      form.reset(selectedElement);
    }
  }, [selectedElement, form]);
  
  // Direct API call to get data source with fields when id changes
  useEffect(() => {
    if (selectedElement?.dataSource?.id) {
      const fetchSourceData = async () => {
        try {
          const response = await fetch(`/api/datasources/${selectedElement.dataSource.id}`);
          if (!response.ok) throw new Error('Failed to fetch data source');
          
          const data = await response.json();
          console.log("Fetched data source data:", data);
          
          setActiveDataSource(data);
          // Ensure fields is an array
          const fields = Array.isArray(data.fields) ? data.fields : [];
          setActiveSourceFields(fields);
        } catch (error) {
          console.error("Error fetching data source:", error);
          setActiveDataSource(null);
          setActiveSourceFields([]);
        }
      };
      
      fetchSourceData();
    } else {
      setActiveDataSource(null);
      setActiveSourceFields([]);
    }
  }, [selectedElement?.dataSource?.id]);
  
  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Select a form element to view and edit its properties</p>
      </div>
    );
  }
  
  const getElementIcon = (type: string) => {
    switch (type) {
      case "text": return "font";
      case "number": return "hashtag";
      case "date": return "calendar";
      case "textarea": return "align-left";
      case "dropdown": return "chevron-down-square";
      case "radio": return "circle-dot";
      case "checkbox": return "check-square";
      case "toggle": return "toggle-left";
      case "section": return "square";
      case "column": return "columns";
      case "divider": return "minus";
      default: return "square";
    }
  };
  
  const renderBasicProperties = () => (
    <div className="space-y-4">
      {/* Label Field */}
      <FormField
        control={form.control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
            <FormControl>
              <Input 
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange("label", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Field Name */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Field Name</FormLabel>
            <FormControl>
              <Input 
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange("name", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Placeholder Field */}
      {(selectedElement.type === "text" || 
        selectedElement.type === "number" || 
        selectedElement.type === "textarea") && (
        <FormField
          control={form.control}
          name="placeholder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placeholder</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("placeholder", e.target.value);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      
      {/* Help Text Field */}
      <FormField
        control={form.control}
        name="helpText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Help Text</FormLabel>
            <FormControl>
              <Input 
                {...field}
                placeholder="Add help text here (optional)"
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange("helpText", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Required Field */}
      <FormField
        control={form.control}
        name="required"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox 
                checked={field.value} 
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  handleFieldChange("required", checked);
                }}
              />
            </FormControl>
            <FormLabel className="text-sm font-medium cursor-pointer">
              Required
            </FormLabel>
          </FormItem>
        )}
      />
      
      {/* Options for dropdown, radio, or checkbox */}
      {(selectedElement.type === "dropdown" || 
       selectedElement.type === "radio" || 
       selectedElement.type === "checkbox") && (
        <div className="mt-4">
          <FormLabel>Options</FormLabel>
          <div className="space-y-2 mt-2">
            {selectedElement.options?.map((option: { label: string; value: string }, index: number) => (
              <div key={index} className="flex gap-2">
                <Input 
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...(selectedElement.options || [])];
                    newOptions[index] = { ...newOptions[index], label: e.target.value };
                    handleFieldChange("options", newOptions);
                  }}
                  placeholder="Option label"
                  className="flex-1"
                />
                <Input 
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...(selectedElement.options || [])];
                    newOptions[index] = { ...newOptions[index], value: e.target.value };
                    handleFieldChange("options", newOptions);
                  }}
                  placeholder="Value"
                  className="flex-1"
                />
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => {
                const newOptions = [...(selectedElement.options || []), { label: "New Option", value: `option${selectedElement.options?.length || 0 + 1}` }];
                handleFieldChange("options", newOptions);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderValidationProperties = () => (
    <div className="space-y-4">
      {/* Min Length Field */}
      {(selectedElement.type === "text" || selectedElement.type === "textarea") && (
        <FormField
          control={form.control}
          name="validation.minLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Length</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("validation.minLength", parseInt(e.target.value));
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      
      {/* Max Length Field */}
      {(selectedElement.type === "text" || selectedElement.type === "textarea") && (
        <FormField
          control={form.control}
          name="validation.maxLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Length</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("validation.maxLength", parseInt(e.target.value));
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      
      {/* Pattern Field */}
      {selectedElement.type === "text" && (
        <FormField
          control={form.control}
          name="validation.pattern"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pattern</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Regular expression" 
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("validation.pattern", e.target.value);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      
      {/* Error Message Field */}
      <FormField
        control={form.control}
        name="validation.errorMessage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Error Message</FormLabel>
            <FormControl>
              <Input 
                {...field}
                placeholder="Error message for invalid input" 
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange("validation.errorMessage", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
  
  const renderDataMappingProperties = () => {
    // Debug data source and fields
    console.log('Rendering data mapping properties:');
    console.log('Selected element dataSource:', selectedElement?.dataSource);
    console.log('Data sources:', dataSources);
    console.log('Active data source:', activeDataSource);
    console.log('Active source fields:', activeSourceFields);
    
    // Direct field display for debugging with improved error logging
    const handleDataSourceSelect = async (sourceId: string) => {
      console.log("Data source selected - raw value:", sourceId);
      
      // Handle empty selection
      if (!sourceId) {
        setActiveDataSource(null);
        setActiveSourceFields([]);
        handleFieldChange("dataSource", null);
        return;
      }
      
      const numericValue = parseInt(sourceId);
      console.log("Parsed numeric value:", numericValue);
      
      if (isNaN(numericValue)) {
        console.error("Invalid data source ID:", sourceId);
        return;
      }
      
      try {
        // Fetch the data source directly
        console.log("Directly fetching data for selected source ID:", numericValue);
        const response = await fetch(`/api/datasources/${numericValue}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch data source. Status:", response.status, "Response:", errorText);
          throw new Error(`Failed to fetch data source. Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Successfully fetched data source data:", data);
        
        // Update active data source and fields
        setActiveDataSource(data);
        const fields = Array.isArray(data.fields) ? data.fields : [];
        console.log("Setting active source fields:", fields);
        setActiveSourceFields(fields);
        
        // Create proper structure for dataSource
        const dataSource = {
          id: numericValue,
          field: ""
        };
        
        // Update the form with the selected data source
        handleFieldChange("dataSource", dataSource);
        
      } catch (error) {
        console.error("Error fetching data source:", error);
        // Show error in UI
        setActiveDataSource(null);
        setActiveSourceFields([]);
      }
    };
    
    const handleFieldSelect = (fieldName: string) => {
      console.log("Selected field value:", fieldName);
      
      if (!selectedElement.dataSource) {
        console.error("Cannot select field without data source");
        return;
      }
      
      // Create a copy of the current data source settings
      const dataSource = {
        ...selectedElement.dataSource,
        field: fieldName
      };
      
      console.log("Updating data source with field:", dataSource);
      
      // Update the form with the selected field
      handleFieldChange("dataSource", dataSource);
    };
    
    return (
      <div className="space-y-4">
        {/* Data Source Field - Simplified for debugging */}
        <div>
          <label className="text-sm font-medium">Data Source</label>
          <div className="mt-1">
            <select
              className="w-full p-2 border rounded bg-white"
              value={selectedElement?.dataSource?.id || ""}
              onChange={(e) => handleDataSourceSelect(e.target.value)}
            >
              <option value="">Select data source</option>
              {loadingDataSources ? (
                <option value="" disabled>Loading data sources...</option>
              ) : !dataSources || dataSources.length === 0 ? (
                <option value="" disabled>No data sources available</option>
              ) : (
                dataSources.map((source: DataSource) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        
        {/* Field List Display */}
        <div>
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Map to Field</label>
            {selectedElement?.dataSource?.id && (
              <button 
                className="text-xs text-blue-500"
                onClick={() => refetchDataSource()}
              >
                Refresh Fields
              </button>
            )}
          </div>
          
          {/* Debug Information */}
          <div className="bg-gray-100 p-2 rounded my-2 text-xs">
            <p>Selected data source: {selectedElement?.dataSource?.id || "None"}</p>
            <p>Number of fields available: {activeSourceFields.length}</p>
            <p>Selected field: {selectedElement?.dataSource?.field || "None"}</p>
          </div>
          
          {selectedElement?.dataSource?.id ? (
            <div className="mt-2">
              <select
                className="w-full p-2 border rounded bg-white"
                value={selectedElement?.dataSource?.field || ""}
                onChange={(e) => handleFieldSelect(e.target.value)}
              >
                <option value="">Select field</option>
                {activeSourceFields.length === 0 ? (
                  <option value="" disabled>Loading fields...</option>
                ) : (
                  activeSourceFields.map((field: { name: string; type: string }) => (
                    <option key={field.name} value={field.name}>
                      {field.name} ({field.type})
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">
              Please select a data source first
            </div>
          )}
        </div>
        
        {/* Default Value Field */}
        <FormField
          control={form.control}
          name="defaultValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Value</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  placeholder="Default value (optional)" 
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange("defaultValue", e.target.value);
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    );
  };
  
  const renderAdvancedProperties = () => (
    <div className="space-y-4">
      {/* CSS Class Field */}
      <FormField
        control={form.control}
        name="cssClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CSS Class</FormLabel>
            <FormControl>
              <Input 
                {...field}
                placeholder="Additional CSS classes" 
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange("cssClass", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      {/* Visibility Condition */}
      <div>
        <FormLabel>Visibility Condition</FormLabel>
        <div className="flex items-center space-x-2 mt-1">
          <Select 
            value={selectedElement.visibilityCondition?.field || "none"} 
            onValueChange={(value) => {
              const condition = selectedElement.visibilityCondition || { field: "", operator: "equals", value: "" };
              const newCondition = { ...condition, field: value };
              handleFieldChange("visibilityCondition", newCondition);
            }}
          >
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="position">Position</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedElement.visibilityCondition?.operator || "equals"} 
            onValueChange={(value) => {
              const condition = selectedElement.visibilityCondition || { field: "", operator: "equals", value: "" };
              const newCondition = { ...condition, operator: value };
              handleFieldChange("visibilityCondition", newCondition);
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">not equals</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            value={selectedElement.visibilityCondition?.value || ""}
            placeholder="Value" 
            className="flex-grow"
            onChange={(e) => {
              const condition = selectedElement.visibilityCondition || { field: "", operator: "equals", value: "" };
              const newCondition = { ...condition, value: e.target.value };
              handleFieldChange("visibilityCondition", newCondition);
            }}
          />
        </div>
        <Button 
          type="button" 
          variant="link" 
          className="text-primary text-sm px-0 py-1 mt-2"
          onClick={() => {
            const newCondition = { field: "", operator: "equals", value: "" };
            handleFieldChange("visibilityCondition", newCondition);
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          <span>Add condition</span>
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 font-semibold flex justify-between items-center">
        <span>Properties</span>
      </div>
      
      <div className="p-4 pb-0">
        {/* Selected Element Info */}
        <div className="mb-4 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-primary">
              {getElementIcon(selectedElement.type)}
            </span>
            <span className="font-medium capitalize">
              {selectedElement.type} Field
            </span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button 
            className={`px-3 py-2 text-sm font-medium ${activeTab === "basic" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("basic")}
          >
            Basic
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium ${activeTab === "validation" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("validation")}
          >
            Validation
          </button>
          <button 
            className={`px-3 py-2 text-sm font-medium ${activeTab === "data" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("data")}
          >
            Data
          </button>
          {selectedElement.type === "button" && (
            <button 
              className={`px-3 py-2 text-sm font-medium ${activeTab === "actions" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("actions")}
            >
              Actions
            </button>
          )}
          <button 
            className={`px-3 py-2 text-sm font-medium ${activeTab === "advanced" ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("advanced")}
          >
            Advanced
          </button>
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1">
        <Form {...form}>
          <form>
            {activeTab === "basic" && selectedElement.type !== "button" && renderBasicProperties()}
            {activeTab === "basic" && selectedElement.type === "button" && (
              <ButtonPropertiesEditor 
                element={selectedElement}
                onUpdate={onElementUpdate}
              />
            )}
            {activeTab === "validation" && renderValidationProperties()}
            {activeTab === "data" && renderDataMappingProperties()}
            {activeTab === "actions" && selectedElement.type === "button" && (
              <ActionEditor 
                element={selectedElement} 
                onUpdate={onElementUpdate} 
                formElements={form.getValues().elements || []}
              />
            )}
            {activeTab === "advanced" && renderAdvancedProperties()}
          </form>
        </Form>
      </div>
    </div>
  );
}