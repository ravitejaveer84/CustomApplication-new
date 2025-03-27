import { useState, useEffect, useCallback } from "react";
import { FormElement } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { Plus, RefreshCw, Code, Info, HelpCircle, Trash2, Table, Settings, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ActionEditor } from "./action-editor";
import { ButtonPropertiesEditor } from "./button-properties-editor";

// Define a type for data source fields
interface DataSourceField {
  name: string;
  type: string;
  selected: boolean;
}

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

export function PropertiesPanel({
  selectedElement,
  onElementUpdate,
}: PropertiesPanelProps) {
  if (!selectedElement) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Select a form element to view and edit its properties</p>
      </div>
    );
  }
  
  const [localElement, setLocalElement] = useState<FormElement | null>(
    selectedElement,
  );

  useEffect(() => {
    setLocalElement(selectedElement);
  }, [selectedElement]);

  const [activeTab, setActiveTab] = useState<
    "basic" | "validation" | "data" | "advanced" | "actions" | "formulas"
  >("basic");

  const [activeDataSource, setActiveDataSource] = useState<any>(null);
  const [activeSourceFields, setActiveSourceFields] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  // Renamed to avoid conflict with other state variables
  const [dataSourceState, setDataSourceState] = useState<any>(null);
  
  // Fetch all available data sources when component mounts
  useEffect(() => {
    fetch('/api/datasources')
      .then(res => res.json())
      .then(data => {
        setDataSources(data);
      })
      .catch(error => {
        console.error('Error fetching data sources:', error);
      });
  }, []);

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
        errorMessage: "",
      },
      dataSource: {
        id: null,
        field: "",
      },
      cssClass: "",
    },
  });
  
  // Fetch all data sources - at component top level
  const { data: availableDataSources = [] } = useQuery<DataSource[]>({
    queryKey: ["/api/datasources"],
    enabled: activeTab === "data",
  });

  const dataSourceId = selectedElement?.dataSource?.id;

  const fetchDataSource = useCallback(async (id: number) => {
    if (!id) return;
    try {
      const response = await fetch(`/api/datasources/${id}`);
      const data = await response.json();
      if (!data.fields) data.fields = [];
      if (typeof data.config === "string") {
        try {
          data.parsedConfig = JSON.parse(data.config);
        } catch (e) {
          console.error("Error parsing config:", e);
        }
      }
      setDataSourceState(data);
      return data;
    } catch (err) {
      console.error("Error fetching data source:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    if (dataSourceId) {
      fetchDataSource(dataSourceId);
    } else {
      setDataSourceState(null);
    }
  }, [dataSourceId, fetchDataSource]);
  
  // Handle data source selection from dropdown form elements
  useEffect(() => {
    // Track data source ID from either format
    const elementDataSourceId = localElement?.dataSourceId || localElement?.dataSource?.id;
    
    if (elementDataSourceId && elementDataSourceId !== dataSourceId) {
      // When the element's data source changes, fetch the new data source
      fetchDataSource(elementDataSourceId);
    }
  }, [localElement?.dataSourceId, localElement?.dataSource?.id, dataSourceId, fetchDataSource]);

  useEffect(() => {
    // Check for dataSourceId in either format (new or old)
    const dataSourceId = selectedElement?.dataSourceId || selectedElement?.dataSource?.id;
    
    if (dataSourceId) {
      // Set loading state
      setActiveSourceFields([]);
      
      fetch(`/api/datasources/${dataSourceId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch data source: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Loaded data source:", data);
          setActiveDataSource(data);
          setActiveSourceFields(Array.isArray(data.fields) ? data.fields : []);
        })
        .catch((err) => {
          console.error("Error loading data source:", err);
          setActiveDataSource(null);
          setActiveSourceFields([]);
        });
    } else {
      setActiveDataSource(null);
      setActiveSourceFields([]);
    }
  }, [selectedElement?.dataSource?.id, selectedElement?.dataSourceId]);

  // General utility to update any property in the form element
  const handleFormFieldChange = (fieldName: string, value: any) => {
    const updated = {
      ...localElement,
      [fieldName]: value,
    };
    setLocalElement(updated);
    onElementUpdate(updated);
  };

  // Utility to update any simple field within the form element
  const handleElementPropertyChange = (fieldName: string, value: any) => {
    const updated = { ...localElement };
    updated[fieldName] = value;
    setLocalElement(updated);
    onElementUpdate(updated);
  };
  
  // Update nested properties using dot notation (e.g., "validation.minLength")
  const handleNestedFieldChange = (path: string, value: any) => {
    const parts = path.split('.');
    let updated = { ...localElement };
    let current: any = updated;
    
    // Navigate through the object structure until the second-to-last part
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // Create the nested object if it doesn't exist
      if (!current[part]) current[part] = {};
      // Clone the nested object to avoid direct mutation
      current[part] = { ...current[part] };
      current = current[part];
    }
    
    // Set the value on the last part
    current[parts[parts.length - 1]] = value;
    
    setLocalElement(updated);
    onElementUpdate(updated);
  };

  // Specifically handles changes to the data source ID
  const handleDataSourceChange = async (sourceIdStr: string) => {
    const sourceId = sourceIdStr === "none" ? 0 : parseInt(sourceIdStr);
    if (!sourceId || isNaN(sourceId)) {
      setActiveDataSource(null);
      setActiveSourceFields([]);
      const updated = {
        ...localElement,
        dataSource: { id: null, field: "" },
        // Also update dataSourceId to keep both formats in sync
        dataSourceId: null,
        // Clear value and display fields
        valueField: "",
        displayField: "",
      };
      setLocalElement(updated);
      onElementUpdate(updated);
      return;
    }

    try {
      const response = await fetch(`/api/datasources/${sourceId}`);
      const data = await response.json();
      
      // Make sure we have fields available
      const sourceFields = Array.isArray(data.fields) ? data.fields : [];
      
      setActiveDataSource(data);
      setActiveSourceFields(sourceFields);
      
      // Update element with new data source info
      const updated = {
        ...localElement,
        dataSource: { id: sourceId, field: "" },
        // Also update dataSourceId to keep both formats in sync
        dataSourceId: sourceId,
      };
      
      // Auto-select value and display fields if they're available and element uses them
      if (sourceFields.length > 0 && 
          (localElement.type === 'dropdown' || 
           localElement.type === 'radio' || 
           localElement.type === 'checkbox')) {
        // Default to using first field for both value and display
        if (!updated.valueField) {
          updated.valueField = sourceFields[0].name;
        }
        if (!updated.displayField) {
          updated.displayField = sourceFields[0].name;
        }
      }
      
      setLocalElement(updated);
      onElementUpdate(updated);
      
    } catch (error) {
      console.error("Error loading data source:", error);
    }
  };

  // Specifically handles changes to the data source field mapping
  const handleDataSourceFieldChange = (fieldName: string) => {
    const fieldValue = fieldName === "none" ? "" : fieldName;
    const updated = {
      ...localElement,
      dataSource: {
        id: localElement?.dataSource?.id || null,
        field: fieldValue,
      },
    };
    setLocalElement(updated);
    onElementUpdate(updated);
  };

  // Column management functions
  const addColumn = () => {
    const columns = [...(localElement?.columns || [])];
    columns.push({
      field: "",
      header: "New Column",
      visible: true,
      sortable: false,
      editable: false,
      width: 120
    });
    handleElementPropertyChange("columns", columns);
  };

  const removeColumn = (index: number) => {
    const columns = [...(localElement?.columns || [])];
    columns.splice(index, 1);
    handleElementPropertyChange("columns", columns);
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const columns = [...(localElement?.columns || [])];
    columns[index] = { ...columns[index], [field]: value };
    handleElementPropertyChange("columns", columns);
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    if (!localElement?.columns) return;
    
    const columns = [...localElement.columns];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= columns.length) return;
    
    [columns[index], columns[newIndex]] = [columns[newIndex], columns[index]];
    handleElementPropertyChange("columns", columns);
  };

  // Helper function to initialize columns from data source
  useEffect(() => {
    if (
      (localElement?.type === "datatable" || localElement?.type === "gallery") && 
      localElement.dataSource?.id && 
      activeSourceFields.length > 0 && 
      (!localElement.columns || localElement.columns.length === 0)
    ) {
      // Create default columns from data source fields
      const initialColumns = activeSourceFields
        .filter(f => f.selected !== false)
        .map(field => ({
          field: field.name,
          header: field.name,
          visible: true,
          sortable: field.type === "number" || field.type === "date",
          editable: false,
          width: 120
        }));
      handleElementPropertyChange("columns", initialColumns);
    }
  }, [localElement?.dataSource?.id, activeSourceFields]);

  const renderBasicProperties = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="label"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Label</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleFormFieldChange("label", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleFormFieldChange("name", e.target.value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              This is the field name that will be used when submitting the form
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="placeholder"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Placeholder</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleFormFieldChange("placeholder", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="helpText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Help Text</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleFormFieldChange("helpText", e.target.value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              This text will be displayed below the field to provide additional
              information
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="required"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  handleFormFieldChange("required", checked);
                }}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Required</FormLabel>
              <FormDescription className="text-xs">
                If checked, this field must be filled before the form can be
                submitted
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );

  const renderValidationProperties = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="validation.minLength"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Minimum Length</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                {...field}
                value={
                  field.value !== undefined && field.value !== null
                    ? field.value
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  field.onChange(value);
                  handleNestedFieldChange("validation.minLength", value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Minimum number of characters required (0 = no minimum)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validation.maxLength"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maximum Length</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={0}
                {...field}
                value={
                  field.value !== undefined && field.value !== null
                    ? field.value
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value
                    ? parseInt(e.target.value)
                    : null;
                  field.onChange(value);
                  handleNestedFieldChange("validation.maxLength", value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Maximum number of characters allowed (0 = no maximum)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validation.pattern"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Validation Pattern</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleNestedFieldChange(
                    "validation.pattern",
                    e.target.value,
                  );
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Regular expression pattern for validation (leave empty if not
              needed)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="validation.errorMessage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Error Message</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleNestedFieldChange(
                    "validation.errorMessage",
                    e.target.value,
                  );
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Custom error message to display when validation fails
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );

  const renderAdvancedProperties = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="cssClass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CSS Class</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  handleFormFieldChange("cssClass", e.target.value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Custom CSS classes to apply to this element (space-separated)
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="width"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Width</FormLabel>
            <Select
              value={field.value || ""}
              onValueChange={(value) => {
                field.onChange(value);
                handleFormFieldChange("width", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select width" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default</SelectItem>
                <SelectItem value="full">Full width</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="small">Small</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              Control the width of this element
            </FormDescription>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Visibility</FormLabel>
            <Select
              value={field.value || ""}
              onValueChange={(value) => {
                field.onChange(value);
                handleFormFieldChange("visibility", value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Always visible</SelectItem>
                <SelectItem value="admin">Admin only</SelectItem>
                <SelectItem value="dynamicCondition">
                  Based on conditions
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              Control when this element is visible
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
  
  // Get selected data source for field options - must be at component top level
  const selectedDataSourceId = selectedElement.dataSourceId || selectedElement.dataSource?.id || null;
  const { data: dataSourceDetails } = useQuery<DataSource>({
    queryKey: ["/api/datasources", selectedDataSourceId],
    enabled: !!selectedDataSourceId,
    staleTime: 10 * 60 * 1000,
  });
  
  // Handle change of data source - must be at component top level
  const handleOptionsDataSourceChange = (value: string) => {
    if (value === "none") {
      // Clear the data source
      handleNestedFieldChange("dataSource.id", null);
      handleNestedFieldChange("dataSource.field", "");
      handleElementPropertyChange("dataSourceId", null);
      handleElementPropertyChange("displayField", "");
      handleElementPropertyChange("valueField", "");
      return;
    }

    // Set the data source ID and clear the field as it needs to be reselected
    const sourceId = parseInt(value);
    handleNestedFieldChange("dataSource.id", sourceId);
    handleNestedFieldChange("dataSource.field", "");
    
    // Also set new style property
    handleElementPropertyChange("dataSourceId", sourceId);
  };
  
  const renderDataMappingProperties = () => {
    
    // For elements that support options (dropdown, radio, checkbox)
    const isOptionsElement = selectedElement.type === "dropdown" || 
                             selectedElement.type === "radio" || 
                             selectedElement.type === "checkbox";
    
    return (
      <div className="space-y-4">
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-1">
            <FormLabel>Data Source</FormLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Connect this field to a data source to populate it with external data.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={
              // Check both formats for data source ID to ensure consistent selection
              (localElement?.dataSourceId || localElement?.dataSource?.id) 
                ? (localElement?.dataSourceId || localElement?.dataSource?.id).toString()
                : "none"
            }
            onValueChange={handleDataSourceChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {availableDataSources.map((source) => (
                <SelectItem key={source.id} value={source.id.toString()}>
                  <div className="flex items-center">
                    <span>{source.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {source.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableDataSources.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No data sources available. Add data sources from the Data Sources page.
            </p>
          )}
        </div>

        {/* For dropdown, radio buttons, and checkboxes - options settings */}
        {isOptionsElement && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Options Source</h3>
              <div className="flex items-center space-x-2">
                <FormLabel className="text-xs">Source Type:</FormLabel>
                <Select
                  value={localElement?.optionsSourceType || "static"}
                  onValueChange={(value) => {
                    console.log("Changing source type to:", value);
                    
                    // Create a complete updated element to avoid partial updates
                    const updatedElement = { ...localElement, optionsSourceType: value };
                    
                    if (value === "static") {
                      // When switching to static, remove data source properties
                      delete updatedElement.dataSourceId;
                      delete updatedElement.valueField;
                      delete updatedElement.displayField;
                      
                      // Make sure we have options
                      if (!updatedElement.options || !Array.isArray(updatedElement.options)) {
                        updatedElement.options = [
                          { label: "Option 1", value: "option1" },
                          { label: "Option 2", value: "option2" }
                        ];
                      }
                    } 
                    else if (value === "dataSource") {
                      // When switching to data source, initialize data source properties
                      updatedElement.dataSourceId = updatedElement.dataSourceId || null;
                      updatedElement.valueField = updatedElement.valueField || "";
                      updatedElement.displayField = updatedElement.displayField || "";
                    }
                    
                    // Update the entire element at once
                    setLocalElement(updatedElement);
                    onElementUpdate(updatedElement);
                  }}
                >
                  <SelectTrigger className="h-8 w-28">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dataSource">Data Source</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Static Options Editor */}
            {(!localElement?.optionsSourceType || localElement.optionsSourceType === "static") && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Static Options</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const options = [...(localElement?.options || [])];
                      options.push({ label: "New Option", value: `option${options.length + 1}` });
                      handleFormFieldChange("options", options);
                    }}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Option
                  </Button>
                </div>
                
                {(!localElement?.options || localElement.options.length === 0) && (
                  <div className="text-center py-4 border border-dashed rounded-md border-gray-300">
                    <p className="text-sm text-muted-foreground">
                      No options added yet. Click "Add Option" to create options.
                    </p>
                  </div>
                )}
                
                {localElement?.options && localElement.options.length > 0 && (
                  <div className="space-y-2">
                    {localElement.options.map((option: { label: string; value: string }, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option.label || ""}
                          onChange={(e) => {
                            const options = [...(localElement?.options || [])];
                            options[index] = { ...options[index], label: e.target.value };
                            handleFormFieldChange("options", options);
                          }}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <Input
                          value={option.value || ""}
                          onChange={(e) => {
                            const options = [...(localElement?.options || [])];
                            options[index] = { ...options[index], value: e.target.value };
                            handleFormFieldChange("options", options);
                          }}
                          placeholder="Value"
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => {
                            const options = [...(localElement?.options || [])];
                            options.splice(index, 1);
                            handleFormFieldChange("options", options);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Data Source Options Configuration */}
            {localElement?.optionsSourceType === "dataSource" && (
              <div className="space-y-4">
                {/* Note about data source */}
                <div className="mb-4 p-3 border rounded-md bg-blue-50 text-blue-800">
                  <p className="text-sm">
                    <Info className="h-4 w-4 inline-block mr-1" />
                    Use the Data Source selector at the top of this panel to connect to a data source.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FormLabel className="text-xs">Value Field</FormLabel>
                    <Select
                      value={localElement.valueField || ""}
                      onValueChange={(value) => {
                        handleFormFieldChange("valueField", value);
                      }}
                      disabled={!(localElement?.dataSourceId || localElement?.dataSource?.id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSourceFields.map((field) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Field to use as the option value
                    </p>
                  </div>
                  <div>
                    <FormLabel className="text-xs">Display Field</FormLabel>
                    <Select
                      value={localElement.displayField || ""}
                      onValueChange={(value) => {
                        handleFormFieldChange("displayField", value);
                      }}
                      disabled={!(localElement?.dataSourceId || localElement?.dataSource?.id)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSourceFields.map((field) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Field to display to the user
                    </p>
                  </div>
                </div>
                
                {activeSourceFields.length === 0 && localElement?.dataSourceId && (
                  <div className="text-center py-4 border border-dashed rounded-md border-gray-300">
                    <p className="text-sm text-muted-foreground">
                      No fields available in the selected data source.
                    </p>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="filterQuery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filter Query</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            field.onChange(e);
                            handleFormFieldChange("filterQuery", e.target.value);
                          }}
                          placeholder="e.g. Country = 'USA'"
                          className="font-mono text-sm"
                          rows={2}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Optional filter to apply when loading options (SQL WHERE clause format)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* For regular form elements - show field mapping */}
        {!isOptionsElement && localElement?.type !== "datatable" && localElement?.type !== "gallery" && (
          <>
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-1">
                <FormLabel>Map to Field</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Select a field from the data source to map to this form field. The data will be loaded when the form is viewed.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={localElement?.dataSource?.field || ""}
                onValueChange={handleDataSourceFieldChange}
                disabled={!localElement?.dataSource?.id}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {activeSourceFields.map((field) => (
                    <SelectItem key={field.name} value={field.name}>
                      <div className="flex items-center">
                        <span>{field.name}</span>
                        {field.type && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {field.type}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeSourceFields.length === 0 && localElement?.dataSource?.id && (
                <p className="text-xs text-muted-foreground mt-1">
                  No fields available in the selected data source.
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="defaultValue"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormLabel>Default Value</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Default value to show when no data is available. This will be overridden by data source values when available.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Default value (optional)"
                      onChange={(e) => {
                        field.onChange(e);
                        handleFormFieldChange("defaultValue", e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    This value will be used if no data is provided from the data source.
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        )}

        {/* For data tables and galleries - show column configuration */}
        {(localElement?.type === "datatable" || localElement?.type === "gallery") && localElement?.dataSource?.id && (
          <div className="mt-6 space-y-6">
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Column Configuration</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addColumn}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Column
                </Button>
              </div>

              {(!localElement?.columns || localElement.columns.length === 0) && (
                <div className="text-center py-4 border border-dashed rounded-md border-gray-300">
                  <p className="text-sm text-muted-foreground">
                    No columns configured yet. Add columns or connect to a data source.
                  </p>
                </div>
              )}

              {localElement?.columns && localElement.columns.length > 0 && (
                <div>
                  {localElement.columns.map((column: { field: string; header: string; visible?: boolean; width?: number; sortable?: boolean; editable?: boolean }, index: number) => (
                    <div 
                      key={index} 
                      className="mb-4 p-3 border rounded-md bg-gray-50 relative group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Column {index + 1}</h4>
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => moveColumn(index, "up")}
                            disabled={index === 0}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="m18 15-6-6-6 6" />
                            </svg>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => moveColumn(index, "down")}
                            disabled={index === localElement.columns.length - 1}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeColumn(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <FormLabel className="text-xs">Field</FormLabel>
                          <Select
                            value={column.field || ""}
                            onValueChange={(value) => updateColumn(index, "field", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeSourceFields.map((field) => (
                                <SelectItem key={field.name} value={field.name}>
                                  {field.name}
                                </SelectItem>
                              ))}
                              {activeSourceFields.length === 0 && (
                                <SelectItem value="" disabled>
                                  No fields available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FormLabel className="text-xs">Header Text</FormLabel>
                          <Input
                            value={column.header || ""}
                            onChange={(e) => updateColumn(index, "header", e.target.value)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FormLabel className="text-xs">Width (px)</FormLabel>
                          <Input
                            type="number"
                            value={column.width || 120}
                            onChange={(e) => updateColumn(index, "width", parseInt(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div className="flex flex-col justify-end">
                          <div className="flex items-center space-x-4 flex-wrap">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`visible-${index}`}
                                checked={column.visible !== false}
                                onCheckedChange={(checked) => updateColumn(index, "visible", !!checked)}
                              />
                              <label htmlFor={`visible-${index}`} className="text-xs cursor-pointer">
                                Visible
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`sortable-${index}`}
                                checked={column.sortable === true}
                                onCheckedChange={(checked) => updateColumn(index, "sortable", !!checked)}
                              />
                              <label htmlFor={`sortable-${index}`} className="text-xs cursor-pointer">
                                Sortable
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <Checkbox
                                id={`editable-${index}`}
                                checked={column.editable === true}
                                onCheckedChange={(checked) => updateColumn(index, "editable", !!checked)}
                              />
                              <label htmlFor={`editable-${index}`} className="text-xs cursor-pointer">
                                Editable
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Table Settings */}
              <div className="border-t pt-4 mt-6">
                <h3 className="text-sm font-medium mb-3">Table Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pagination"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              handleFormFieldChange("pagination", checked);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Pagination</FormLabel>
                          <FormDescription className="text-xs">
                            Show data in pages
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pageSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Size</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            {...field}
                            value={field.value || 10}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 10;
                              field.onChange(value);
                              handleFormFieldChange("pageSize", value);
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Number of items per page
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col border-l">
      <div className="py-2 px-4 border-b flex items-center justify-between bg-muted/40">
        <h2 className="text-sm font-medium">Properties: {selectedElement.type}</h2>
      </div>

      <div className="border-b">
        <div className="flex">
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "basic"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("basic")}
          >
            Basic
          </button>

          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "validation"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("validation")}
          >
            Validation
          </button>

          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "data"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("data")}
          >
            Data
          </button>

          {selectedElement.type === "button" && (
            <button
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === "actions"
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("actions")}
            >
              Actions
            </button>
          )}

          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "advanced"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("advanced")}
          >
            Advanced
          </button>
          
          <button
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === "formulas"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("formulas")}
          >
            Formulas
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <Form {...form}>
          <form>
            {activeTab === "basic" &&
              selectedElement.type !== "button" &&
              renderBasicProperties()}
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
            {activeTab === "formulas" && renderFormulaProperties()}
          </form>
        </Form>
      </div>
    </div>
  );
}