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
import { Plus, RefreshCw, Code, Info, HelpCircle } from "lucide-react";
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
    "basic" | "validation" | "data" | "advanced" | "actions"
  >("basic");

  const [activeDataSource, setActiveDataSource] = useState<any>(null);
  const [activeSourceFields, setActiveSourceFields] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null);

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
        id: "",
        field: "",
      },
      cssClass: "",
    },
  });

  const { data: dataSources = [] } = useQuery<DataSource[]>({
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
      setSelectedDataSource(data);
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
      setSelectedDataSource(null);
    }
  }, [dataSourceId, fetchDataSource]);

  useEffect(() => {
    if (selectedElement?.dataSource?.id) {
      fetch(`/api/datasources/${selectedElement.dataSource.id}`)
        .then((res) => res.json())
        .then((data) => {
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
  }, [selectedElement?.dataSource?.id]);

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
        dataSource: { id: 0, field: "" },
      };
      setLocalElement(updated);
      onElementUpdate(updated);
      return;
    }

    try {
      const response = await fetch(`/api/datasources/${sourceId}`);
      const data = await response.json();
      setActiveDataSource(data);
      setActiveSourceFields(data.fields || []);
      const updated = {
        ...localElement,
        dataSource: { id: sourceId, field: "" },
      };
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
        id: localElement?.dataSource?.id || 0,
        field: fieldValue,
      },
    };
    setLocalElement(updated);
    onElementUpdate(updated);
  };

  const renderDataMappingProperties = () => (
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
            !localElement?.dataSource?.id || localElement.dataSource.id === 0
              ? "none"
              : localElement.dataSource.id.toString()
          }
          onValueChange={handleDataSourceChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {dataSources.map((source) => (
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
        {dataSources.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            No data sources available. Add data sources from the Data Sources page.
          </p>
        )}
      </div>

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
    </div>
  );

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
                  handleElementPropertyChange("label", e.target.value);
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
                  handleElementPropertyChange("name", e.target.value);
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
                    handleElementPropertyChange("placeholder", e.target.value);
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
                  handleElementPropertyChange("helpText", e.target.value);
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
                  handleElementPropertyChange("required", checked);
                }}
              />
            </FormControl>
            <div className="flex items-center space-x-2">
              <FormLabel className="text-sm font-medium cursor-pointer">
                Required
              </FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Make this field mandatory. Form submission will be prevented if this field is empty.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
            {selectedElement.options?.map(
              (option: { label: string; value: string }, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => {
                      const newOptions = [...(selectedElement.options || [])];
                      newOptions[index] = {
                        ...newOptions[index],
                        label: e.target.value,
                      };
                      handleElementPropertyChange("options", newOptions);
                    }}
                    placeholder="Option label"
                    className="flex-1"
                  />
                  <Input
                    value={option.value}
                    onChange={(e) => {
                      const newOptions = [...(selectedElement.options || [])];
                      newOptions[index] = {
                        ...newOptions[index],
                        value: e.target.value,
                      };
                      handleElementPropertyChange("options", newOptions);
                    }}
                    placeholder="Value"
                    className="flex-1"
                  />
                </div>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                const newOptions = [
                  ...(selectedElement.options || []),
                  {
                    label: "New Option",
                    value: `option${selectedElement.options?.length || 0 + 1}`,
                  },
                ];
                handleElementPropertyChange("options", newOptions);
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
      {(selectedElement.type === "text" ||
        selectedElement.type === "textarea") && (
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
                    handleNestedFieldChange(
                      "validation.minLength",
                      parseInt(e.target.value),
                    );
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* Max Length Field */}
      {(selectedElement.type === "text" ||
        selectedElement.type === "textarea") && (
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
                    handleNestedFieldChange(
                      "validation.maxLength",
                      parseInt(e.target.value),
                    );
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
                    handleNestedFieldChange("validation.pattern", e.target.value);
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
                  handleNestedFieldChange("validation.errorMessage", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );

  const renderAdvancedProperties = () => (
    <div className="space-y-4">
      {/* CSS Class Field */}
      <FormField
        control={form.control}
        name="cssClass"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormLabel>CSS Class</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Add custom CSS classes to style this element. Multiple classes can be separated by spaces.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Input
                {...field}
                placeholder="Additional CSS classes"
                onChange={(e) => {
                  field.onChange(e);
                  handleFormFieldChange("cssClass", e.target.value);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Visibility Condition */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <FormLabel>Visibility Condition</FormLabel>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Control when this field should be shown based on the value of another field.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <Select
            value={selectedElement.visibilityCondition?.field || ""}
            onValueChange={(value) => {
              // Handle "none" selection by clearing the visibility condition
              if (value === "none") {
                handleFormFieldChange("visibilityCondition", undefined);
                return;
              }

              const condition = selectedElement.visibilityCondition || {
                field: "",
                operator: "equals",
                value: "",
              };
              const newCondition = { ...condition, field: value };
              handleFormFieldChange("visibilityCondition", newCondition);
            }}
          >
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="position">Position</SelectItem>
              {/* Dynamically show all form fields as potential conditions */}
              {form
                .getValues()
                .elements?.filter((e: any) => e.id !== selectedElement.id)
                .map((e: any) => (
                  <SelectItem key={e.id} value={e.name || `field_${e.id}`}>
                    {e.label || e.name || `Field ${e.id}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedElement.visibilityCondition?.operator || "equals"}
            onValueChange={(value) => {
              const condition = selectedElement.visibilityCondition || {
                field: "",
                operator: "equals",
                value: "",
              };
              const newCondition = { ...condition, operator: value };
              handleFormFieldChange("visibilityCondition", newCondition);
            }}
            disabled={!selectedElement.visibilityCondition?.field}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">not equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="starts_with">starts with</SelectItem>
              <SelectItem value="ends_with">ends with</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={selectedElement.visibilityCondition?.value || ""}
            placeholder="Value"
            className="flex-grow"
            disabled={!selectedElement.visibilityCondition?.field}
            onChange={(e) => {
              const condition = selectedElement.visibilityCondition || {
                field: "",
                operator: "equals",
                value: "",
              };
              const newCondition = { ...condition, value: e.target.value };
              handleFormFieldChange("visibilityCondition", newCondition);
            }}
          />
        </div>
        {selectedElement.visibilityCondition?.field && (
          <Button
            type="button"
            variant="link"
            className="text-primary text-sm px-0 py-1 mt-2"
            onClick={() => {
              handleFormFieldChange("visibilityCondition", undefined);
            }}
          >
            <span>Clear condition</span>
          </Button>
        )}
      </div>
    </div>
  );

  const getElementIcon = (type: string) => {
    switch (type) {
      case "text":
        return "📝";
      case "number":
        return "🔢";
      case "date":
        return "📅";
      case "textarea":
        return "📄";
      case "dropdown":
        return "🔽";
      case "radio":
        return "🔘";
      case "checkbox":
        return "☑️";
      case "toggle":
        return "🎚️";
      case "section":
        return "📦";
      case "column":
        return "📊";
      case "divider":
        return "➖";
      case "button":
        return "🔲";
      default:
        return "📁";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 font-semibold flex justify-between items-center">
        <span>Properties</span>
      </div>

      <div className="p-4 pb-0">
        {/* Selected Element Info */}
        {selectedElement && (
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
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
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
          </form>
        </Form>
      </div>
    </div>
  );
}
