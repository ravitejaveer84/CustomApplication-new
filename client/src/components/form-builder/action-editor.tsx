import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormElement } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Info, Code, Database, Filter, RefreshCw } from "lucide-react";

interface ActionEditorProps {
  element: FormElement;
  onUpdate: (element: FormElement) => void;
  formElements: FormElement[];
}

export function ActionEditor({ element, onUpdate, formElements }: ActionEditorProps) {
  const [selectedTab, setSelectedTab] = useState("basic");
  
  // Get all the possible form fields to reference in filters/actions
  const formFields = formElements.filter(el => el.id !== element.id).map(el => ({
    id: el.id,
    name: el.name,
    label: el.label,
    type: el.type
  }));
  
  // Handle change of action type
  const handleActionTypeChange = (value: string) => {
    onUpdate({
      ...element,
      actionType: value,
    });
  };
  
  // Handle change of action configuration
  const handleActionConfigChange = (key: string, value: any) => {
    onUpdate({
      ...element,
      actionConfig: {
        ...(element.actionConfig || {}),
        [key]: value,
      },
    });
  };
  
  // Get the current action configuration
  const actionConfig = element.actionConfig || {};
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-md text-sm mb-4 flex items-start">
        <Info className="text-blue-500 mr-2 h-5 w-5 mt-0.5 shrink-0" />
        <p>Configure what happens when this button is clicked. You can perform database operations, navigate to other pages, or execute custom logic.</p>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="data">Data Operations</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        {/* Basic Tab - simple actions like navigation */}
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label>Action Type</Label>
            <Select 
              value={element.actionType || "submit"} 
              onValueChange={handleActionTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submit">Submit Form</SelectItem>
                <SelectItem value="reset">Reset Form</SelectItem>
                <SelectItem value="navigate">Navigate to URL</SelectItem>
                <SelectItem value="custom">Custom Function</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {element.actionType === "navigate" && (
            <div>
              <Label>Destination URL</Label>
              <Input 
                type="text" 
                placeholder="https://example.com or /page" 
                value={actionConfig.url || ""} 
                onChange={(e) => handleActionConfigChange("url", e.target.value)} 
              />
            </div>
          )}
          
          {element.actionType === "custom" && (
            <div>
              <Label>Function Name</Label>
              <Input 
                type="text" 
                placeholder="handleButtonClick" 
                value={actionConfig.functionName || ""} 
                onChange={(e) => handleActionConfigChange("functionName", e.target.value)} 
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Switch 
              checked={actionConfig.confirmAction || false} 
              onCheckedChange={(checked) => handleActionConfigChange("confirmAction", checked)} 
            />
            <Label>Show confirmation dialog</Label>
          </div>
          
          {actionConfig.confirmAction && (
            <div>
              <Label>Confirmation Message</Label>
              <Input 
                type="text" 
                placeholder="Are you sure you want to proceed?" 
                value={actionConfig.confirmMessage || ""} 
                onChange={(e) => handleActionConfigChange("confirmMessage", e.target.value)} 
              />
            </div>
          )}
        </TabsContent>
        
        {/* Data Operations Tab - database queries and operations */}
        <TabsContent value="data" className="space-y-4">
          <div>
            <Label>Data Operation</Label>
            <Select 
              value={actionConfig.dataOperation || "query"} 
              onValueChange={(value) => handleActionConfigChange("dataOperation", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="query">Query Data</SelectItem>
                <SelectItem value="insert">Insert Record</SelectItem>
                <SelectItem value="update">Update Record</SelectItem>
                <SelectItem value="delete">Delete Record</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Data Source</Label>
            <Select 
              value={actionConfig.dataSource || ""} 
              onValueChange={(value) => handleActionConfigChange("dataSource", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="sharepoint">SharePoint</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="api">External API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {actionConfig.dataOperation === "query" && (
            <>
              <div>
                <Label className="flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  Table/Collection Name
                </Label>
                <Input 
                  type="text" 
                  placeholder="users, products, etc." 
                  value={actionConfig.tableName || ""} 
                  onChange={(e) => handleActionConfigChange("tableName", e.target.value)} 
                />
              </div>
              
              <div>
                <Label className="flex items-center">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter Conditions
                </Label>
                <div className="space-y-2">
                  {formFields.length > 0 ? (
                    <div className="space-y-2 mb-2">
                      <p className="text-xs text-gray-500">Select form fields to use in filter conditions:</p>
                      {formFields.map(field => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Switch 
                            checked={actionConfig.filterFields?.includes(field.id) || false} 
                            onCheckedChange={(checked) => {
                              const currentFields = actionConfig.filterFields || [];
                              const newFields = checked 
                                ? [...currentFields, field.id]
                                : currentFields.filter((currentId: string) => currentId !== field.id);
                              handleActionConfigChange("filterFields", newFields);
                            }} 
                          />
                          <span className="text-sm">{field.label} <span className="text-xs text-gray-500">({field.type})</span></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Add form fields first to create filter conditions.</p>
                  )}
                  
                  <Label>SQL WHERE Clause</Label>
                  <Textarea 
                    placeholder="WHERE column = :value AND another_column > :another_value" 
                    value={actionConfig.filterSql || ""} 
                    onChange={(e) => handleActionConfigChange("filterSql", e.target.value)}
                    className="font-mono text-sm"
                    rows={3}
                  />
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Use <code>:fieldName</code> to reference form field values.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={actionConfig.populateFormFields || false} 
                  onCheckedChange={(checked) => handleActionConfigChange("populateFormFields", checked)} 
                />
                <Label>Populate form fields with query results</Label>
              </div>
            </>
          )}
          
          {(actionConfig.dataOperation === "insert" || actionConfig.dataOperation === "update") && (
            <div>
              <Label className="flex items-center">Field Mapping</Label>
              <p className="text-xs text-gray-500 mb-2">Map form fields to database columns</p>
              
              {formFields.length > 0 ? (
                <div className="space-y-2">
                  {formFields.map(field => (
                    <div key={field.id} className="grid grid-cols-2 gap-2">
                      <div className="text-sm">{field.label}</div>
                      <Input 
                        type="text" 
                        placeholder="column_name"
                        value={actionConfig.fieldMapping?.[field.id] || ""}
                        onChange={(e) => {
                          const currentMapping = actionConfig.fieldMapping || {};
                          handleActionConfigChange("fieldMapping", {
                            ...currentMapping,
                            [field.id]: e.target.value
                          });
                        }}
                        className="h-8"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Add form fields first to map to database columns.</p>
              )}
            </div>
          )}
          
          {actionConfig.dataOperation === "delete" && (
            <div>
              <Label>Primary Key Field</Label>
              <Select 
                value={actionConfig.primaryKeyField || ""} 
                onValueChange={(value) => handleActionConfigChange("primaryKeyField", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field for deletion" />
                </SelectTrigger>
                <SelectContent>
                  {formFields.map(field => (
                    <SelectItem key={field.id} value={field.id}>{field.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="mt-4 flex items-center space-x-2">
                <Switch 
                  checked={actionConfig.confirmDelete || true} 
                  onCheckedChange={(checked) => handleActionConfigChange("confirmDelete", checked)} 
                />
                <Label>Require confirmation for deletion</Label>
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <Label className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              After Operation
            </Label>
            <Select 
              value={actionConfig.afterOperation || "stay"} 
              onValueChange={(value) => handleActionConfigChange("afterOperation", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action after operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stay">Stay on current form</SelectItem>
                <SelectItem value="clear">Clear form</SelectItem>
                <SelectItem value="navigate">Navigate to page</SelectItem>
                <SelectItem value="refresh">Refresh data</SelectItem>
              </SelectContent>
            </Select>
            
            {actionConfig.afterOperation === "navigate" && (
              <Input 
                type="text" 
                placeholder="/success-page"
                value={actionConfig.navigationUrl || ""}
                onChange={(e) => handleActionConfigChange("navigationUrl", e.target.value)}
                className="mt-2"
              />
            )}
          </div>
        </TabsContent>
        
        {/* Advanced Tab - custom code and advanced configurations */}
        <TabsContent value="advanced" className="space-y-4">
          <div>
            <Label className="flex items-center">
              <Code className="h-4 w-4 mr-1" />
              Custom JavaScript Code
            </Label>
            <Textarea 
              placeholder="// Write custom code to execute when the button is clicked
function handleButtonClick() {
  // Access form values with getFieldValue(fieldName)
  const name = getFieldValue('name');
  
  // Example: Perform validation
  if (!name) {
    showError('Name is required');
    return;
  }
  
  // Example: Call an API
  fetch('/api/data', {
    method: 'POST',
    body: JSON.stringify({ name })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showSuccess('Operation completed');
      navigateTo('/success');
    }
  });
}"
              value={actionConfig.customCode || ""} 
              onChange={(e) => handleActionConfigChange("customCode", e.target.value)}
              className="font-mono text-sm"
              rows={10}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Execution Conditions</Label>
            <Textarea 
              placeholder="// Return true to execute action, false to prevent it
return validateForm();"
              value={actionConfig.executionCondition || ""} 
              onChange={(e) => handleActionConfigChange("executionCondition", e.target.value)}
              className="font-mono text-sm"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2 mt-2">
            <Switch 
              checked={actionConfig.asyncExecution || false} 
              onCheckedChange={(checked) => handleActionConfigChange("asyncExecution", checked)} 
            />
            <Label>Run asynchronously</Label>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => handleActionConfigChange("testing", true)}>
          Test Action
        </Button>
      </div>
    </div>
  );
}