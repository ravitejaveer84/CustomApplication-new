import { useState, useEffect } from "react";
import { FormElement } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalButton } from "./approval-button";
import { DataTable } from "./data-table";
import { Gallery } from "./gallery";
import { apiRequest } from "@/lib/queryClient";

interface FormRendererProps {
  formId: number;
  formElements: FormElement[];
  defaultValues?: Record<string, any>;
  onSubmit?: (formData: Record<string, any>) => void;
}

export function FormRenderer({ 
  formId, 
  formElements, 
  defaultValues = {}, 
  onSubmit 
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, any> = {};
    
    formElements.forEach(element => {
      if (element.name && element.type !== "section" && element.type !== "column" && element.type !== "divider" && element.type !== "datatable") {
        // Use default values from props if available, otherwise use element default
        initialData[element.name] = defaultValues[element.name] !== undefined 
          ? defaultValues[element.name] 
          : element.defaultValue !== undefined 
          ? element.defaultValue 
          : "";
      }
    });
    
    setFormData({ ...initialData, ...defaultValues });
  }, [formElements, defaultValues]);
  
  // Handle field changes
  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate a single field
  const validateField = (element: FormElement, value: any): string => {
    if (!element.validation) return "";
    
    // Check required
    if (element.required && (value === undefined || value === "" || value === null)) {
      return element.validation.errorMessage || "This field is required";
    }
    
    // Skip other validations if the field is empty and not required
    if (value === undefined || value === "" || value === null) {
      return "";
    }
    
    // String validations
    if (typeof value === "string") {
      if (element.validation.minLength && value.length < element.validation.minLength) {
        return element.validation.errorMessage || `Minimum length is ${element.validation.minLength}`;
      }
      
      if (element.validation.maxLength && value.length > element.validation.maxLength) {
        return element.validation.errorMessage || `Maximum length is ${element.validation.maxLength}`;
      }
      
      if (element.validation.pattern && !new RegExp(element.validation.pattern).test(value)) {
        return element.validation.errorMessage || "Invalid format";
      }
    }
    
    // Number validations
    if (typeof value === "number" || (typeof value === "string" && !isNaN(Number(value)))) {
      const numValue = typeof value === "number" ? value : Number(value);
      
      if (element.validation.min !== undefined && numValue < element.validation.min) {
        return element.validation.errorMessage || `Minimum value is ${element.validation.min}`;
      }
      
      if (element.validation.max !== undefined && numValue > element.validation.max) {
        return element.validation.errorMessage || `Maximum value is ${element.validation.max}`;
      }
    }
    
    return "";
  };
  
  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    for (const element of formElements) {
      if (element.type !== "button" && element.type !== "section" && element.type !== "column" && element.type !== "divider" && element.name) {
        const error = validateField(element, formData[element.name]);
        if (error) {
          newErrors[element.name] = error;
          isValid = false;
        }
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      onSubmit(formData);
    }
  };
  
  // Render form elements
  const renderFormElement = (element: FormElement) => {
    const { type, name = "", label = "", required = false, helpText } = element;
    
    // Prepare common props for form fields
    const commonProps = {
      id: name,
      name: name,
      value: formData[name] !== undefined ? formData[name] : "",
      onChange: (e: any) => handleChange(name, e.target.value),
      placeholder: element.placeholder || ""
    };
    
    // Show error message if there is one for this field
    const errorMessage = errors[name];
    const showError = Boolean(errorMessage);
    
    switch (type) {
      case "text":
      case "email":
      case "password":
      case "url":
      case "number":
      case "phone":
      case "date":
      case "time":
      case "datetime":
      case "currency":
      case "percentage":
        return (
          <div className="space-y-2">
            <Label htmlFor={name} className="font-medium">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input 
              type={type === "number" || type === "currency" || type === "percentage" ? "number" : type === "password" ? "password" : "text"}
              {...commonProps}
              className={showError ? "border-red-500" : ""}
            />
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        );
        
      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={name} className="font-medium">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea 
              {...commonProps}
              className={showError ? "border-red-500" : ""}
              rows={element.rows || 3}
            />
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        );
        
      case "dropdown":
      case "combobox":
        // Add state for dropdown options from data source
        const [dropdownOptions, setDropdownOptions] = useState<{value: string, label: string}[]>([]);
        const [isLoadingOptions, setIsLoadingOptions] = useState(false);
        
        // Fetch dropdown options from data source if configured
        useEffect(() => {
          // Get data source ID from the appropriate property based on optionsSource
          let dataSourceId = null;
          let displayField = null;
          let valueField = null;
          
          // Clear dropdownOptions if we're changing back to static
          if (element.optionsSource !== "dataSource" && dropdownOptions.length > 0) {
            setDropdownOptions([]);
          }
          
          // If element uses new format with optionsSource
          if (element.optionsSource === "dataSource") {
            dataSourceId = element.dataSourceId;
            displayField = element.displayField;
            valueField = element.valueField || element.displayField; // If valueField not set, use displayField
          } else {
            // Using old format
            dataSourceId = element.dataSource?.id;
            displayField = element.dataSource?.field;
            valueField = element.dataSource?.field; // Use same field as value field for backwards compatibility
          }
          
          console.log("Dropdown config:", {
            element: element.name,
            dataSourceId,
            displayField,
            valueField,
            optionsSource: element.optionsSource,
            options: element.options || []
          });
          
          if (dataSourceId && (displayField || valueField)) {
            setIsLoadingOptions(true);
            
            const fetchDropdownData = async () => {
              try {
                console.log(`Fetching dropdown data from source ID: ${dataSourceId}, display field: ${displayField}, value field: ${valueField}`);
                
                const response = await apiRequest<any[]>(
                  `/api/datasources/${dataSourceId}/data`
                );
                
                if (response && Array.isArray(response)) {
                  // Use displayField if available, otherwise use valueField
                  const fieldToUse = displayField || valueField;
                  
                  // Extract unique values from the specified field
                  const fieldValues = response
                    .map(item => item[fieldToUse])
                    .filter(value => value !== null && value !== undefined);
                  
                  // Get unique values without using Set directly
                  const uniqueValuesMap: Record<string, any> = {};
                  fieldValues.forEach(value => {
                    const valueKey = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    uniqueValuesMap[valueKey] = value;
                  });
                  const uniqueValues = Object.values(uniqueValuesMap);
                  
                  // Sort values if they are strings or numbers
                  if (uniqueValues.length > 0 && 
                      (typeof uniqueValues[0] === 'string' || 
                       typeof uniqueValues[0] === 'number')) {
                    uniqueValues.sort((a, b) => {
                      if (typeof a === 'number' && typeof b === 'number') {
                        return a - b;
                      }
                      return String(a).localeCompare(String(b));
                    });
                  }
                  
                  // If both displayField and valueField are provided, create options with both
                  let options;
                  if (displayField && valueField && displayField !== valueField) {
                    // Create mapping of unique display/value pairs
                    const optionsMap = new Map();
                    for (const item of response) {
                      const display = item[displayField];
                      const value = item[valueField];
                      if (display !== undefined && value !== undefined) {
                        optionsMap.set(String(value), {
                          value: String(value),
                          label: String(display)
                        });
                      }
                    }
                    options = Array.from(optionsMap.values());
                  } else {
                    // Use same field for both value and label
                    options = uniqueValues.map(value => ({
                      value: String(value),
                      label: String(value)
                    }));
                  }
                  
                  setDropdownOptions(options);
                  console.log(`Loaded ${options.length} unique options for dropdown from ${fieldToUse}`);
                }
              } catch (err) {
                console.error("Error fetching dropdown options:", err);
              } finally {
                setIsLoadingOptions(false);
              }
            };
            
            fetchDropdownData();
          }
        }, [element.dataSourceId, element.dataSource?.id, element.displayField, element.dataSource?.field, element.valueField, element.optionsSource]);
        
        // Determine which options to display based on the configuration approach
        let dataSourceId = null;
        
        // Check which approach is being used
        if (element.optionsSource === "dataSource") {
          dataSourceId = element.dataSourceId;
        } else {
          dataSourceId = element.dataSource?.id;
        }
        
        // If we have data source options and they've loaded, use them
        // Otherwise fall back to manually defined options
        const displayOptions = (dataSourceId && dropdownOptions.length > 0)
          ? dropdownOptions 
          : element.options || [];
        
        return (
          <div className="space-y-2">
            <Label htmlFor={name} className="font-medium">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={String(formData[name] || "")}
              onValueChange={(value) => handleChange(name, value)}
              disabled={isLoadingOptions}
            >
              <SelectTrigger className={showError ? "border-red-500" : ""}>
                <SelectValue placeholder={isLoadingOptions 
                  ? "Loading options..." 
                  : element.placeholder || "Select..."} 
                />
              </SelectTrigger>
              <SelectContent>
                {displayOptions.map((option: any, index: number) => (
                  <SelectItem key={index} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                {displayOptions.length === 0 && !isLoadingOptions && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No options available
                  </div>
                )}
              </SelectContent>
            </Select>
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        );
        
      case "radio":
        return (
          <div className="space-y-2">
            <Label className="font-medium">
              {label} {required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup 
              value={String(formData[name] || "")}
              onValueChange={(value) => handleChange(name, value)}
              className={`${element.layout === "horizontal" ? "flex space-x-4" : "space-y-2"} ${showError ? "text-red-500" : ""}`}
            >
              {element.options?.map((option: any, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${name}-${index}`} />
                  <Label htmlFor={`${name}-${index}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        );
        
      case "checkbox":
        if (element.options && element.options.length > 0) {
          // Multi-checkbox
          return (
            <div className="space-y-2">
              <Label className="font-medium">
                {label} {required && <span className="text-red-500">*</span>}
              </Label>
              <div className="space-y-2">
                {element.options.map((option: any, index: number) => {
                  const values = Array.isArray(formData[name]) ? formData[name] : [];
                  const isChecked = values.includes(option.value);
                  
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`${name}-${index}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const newValues = [...values];
                          if (checked) {
                            newValues.push(option.value);
                          } else {
                            const idx = newValues.indexOf(option.value);
                            if (idx !== -1) newValues.splice(idx, 1);
                          }
                          handleChange(name, newValues);
                        }}
                        className={showError ? "border-red-500" : ""}
                      />
                      <Label htmlFor={`${name}-${index}`} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
              {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
              {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
            </div>
          );
        } else {
          // Single checkbox
          return (
            <div className="flex items-start space-x-2 py-2">
              <Checkbox 
                id={name}
                checked={Boolean(formData[name])}
                onCheckedChange={(checked) => handleChange(name, Boolean(checked))}
                className={`mt-1 ${showError ? "border-red-500" : ""}`}
              />
              <div>
                <Label htmlFor={name} className="cursor-pointer">
                  {label} {required && <span className="text-red-500">*</span>}
                </Label>
                {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
                {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
              </div>
            </div>
          );
        }
        
      case "toggle":
        return (
          <div className="flex justify-between items-center py-2">
            <div>
              <Label htmlFor={name} className="font-medium">
                {label} {required && <span className="text-red-500">*</span>}
              </Label>
              {helpText && <p className="text-sm text-gray-500">{helpText}</p>}
            </div>
            <Switch 
              id={name}
              checked={Boolean(formData[name])}
              onCheckedChange={(checked) => handleChange(name, checked)}
            />
            {showError && <p className="text-sm text-red-500">{errorMessage}</p>}
          </div>
        );
        
      case "section":
        return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              {element.description && (
                <CardDescription>{element.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {element.elements?.map((childElement: FormElement) => (
                <div key={childElement.id} className="mb-4">
                  {renderFormElement(childElement)}
                </div>
              ))}
            </CardContent>
          </Card>
        );
        
      case "column":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {element.columns?.map((column: any, index: number) => (
              <div key={index} className="space-y-4">
                {column.elements.map((childElement: FormElement) => (
                  <div key={childElement.id} className="mb-4">
                    {renderFormElement(childElement)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
        
      case "divider":
        return <Separator className="my-4" />;
        
      case "button":
        // Use our ApprovalButton component
        return (
          <div className="my-4">
            <ApprovalButton 
              element={element}
              formId={formId}
              formData={formData}
              onSuccess={() => onSubmit?.(formData)}
            />
            {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
          </div>
        );

      case "datatable":
        // Use our DataTable component
        return (
          <div className="my-6 w-full">
            <DataTable
              element={element}
              formId={formId}
              formData={formData}
            />
            {helpText && <p className="text-sm text-gray-500 mt-1">{helpText}</p>}
          </div>
        );
        
      case "gallery":
        // Use our Gallery component
        return (
          <div className="my-6 w-full">
            <h3 className="text-lg font-medium mb-2">{label}</h3>
            {helpText && <p className="text-sm text-gray-500 mb-3">{helpText}</p>}
            <Gallery
              element={element}
              formId={formId}
              formData={formData}
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formElements.map((element) => (
        <div key={element.id}>
          {renderFormElement(element)}
        </div>
      ))}
    </form>
  );
}