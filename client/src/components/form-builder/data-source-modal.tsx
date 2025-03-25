import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type DataSourceFormValues = {
  name: string;
  type: "database" | "sharepoint" | "excel";
  server?: string;
  port?: string;
  database?: string;
  schema?: string;
  username?: string;
  password?: string;
  sharePointUrl?: string;
  listName?: string;
  fileUrl?: string;
};

type DataField = {
  name: string;
  type: string;
  selected: boolean;
};

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourceModal({ isOpen, onClose }: DataSourceModalProps) {
  const [activeTab, setActiveTab] = useState("connection");
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [fields, setFields] = useState<DataField[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DataSourceFormValues>();
  
  // Effect to generate sample fields when connection is tested successfully
  useEffect(() => {
    if (isConnectionTested) {
      // In a real application, these would come from the backend
      // For now, generate sample fields based on the data source type
      const type = form.getValues('type');
      
      let sampleFields: DataField[] = [];
      
      if (type === 'database') {
        sampleFields = [
          { name: 'id', type: 'number', selected: true },
          { name: 'name', type: 'text', selected: true },
          { name: 'email', type: 'text', selected: true },
          { name: 'created_date', type: 'datetime', selected: false },
          { name: 'status', type: 'text', selected: false },
          { name: 'department', type: 'text', selected: false },
          { name: 'manager_id', type: 'number', selected: false },
        ];
      } else if (type === 'sharepoint') {
        sampleFields = [
          { name: 'ID', type: 'number', selected: true },
          { name: 'Title', type: 'text', selected: true },
          { name: 'Modified', type: 'datetime', selected: true },
          { name: 'Created', type: 'datetime', selected: false },
          { name: 'Author', type: 'text', selected: false },
          { name: 'Category', type: 'text', selected: false },
          { name: 'Status', type: 'text', selected: false },
        ];
      } else if (type === 'excel') {
        sampleFields = [
          { name: 'Column1', type: 'text', selected: true },
          { name: 'Column2', type: 'text', selected: true },
          { name: 'Column3', type: 'number', selected: true },
          { name: 'Column4', type: 'datetime', selected: false },
          { name: 'Column5', type: 'text', selected: false },
          { name: 'Column6', type: 'number', selected: false },
        ];
      }
      
      setFields(sampleFields);
      
      // Also generate sample preview data
      generateSamplePreviewData(sampleFields);
    }
  }, [isConnectionTested]);
  
  const generateSamplePreviewData = (fields: DataField[]) => {
    // Generate 5 rows of sample data
    const data = [];
    for (let i = 0; i < 5; i++) {
      const row: Record<string, any> = {};
      fields.forEach(field => {
        if (field.type === 'number') {
          row[field.name] = Math.floor(Math.random() * 1000);
        } else if (field.type === 'datetime') {
          row[field.name] = new Date().toISOString().substring(0, 10);
        } else {
          row[field.name] = `Sample ${field.name} ${i+1}`;
        }
      });
      data.push(row);
    }
    setPreviewData(data);
  };
  
  const toggleFieldSelection = (index: number) => {
    const updatedFields = [...fields];
    updatedFields[index].selected = !updatedFields[index].selected;
    setFields(updatedFields);
  };

  const testConnection = async (data: DataSourceFormValues) => {
    try {
      if (!data.name) {
        toast({
          title: "Error",
          description: "Please provide a name for the data source",
          variant: "destructive"
        });
        return;
      }

      // Build the configuration object based on data source type
      let config: any = {};
      
      if (data.type === 'database') {
        if (!data.server || !data.database) {
          toast({
            title: "Error",
            description: "Server and database name are required for database connections",
            variant: "destructive"
          });
          return;
        }
        config = {
          server: data.server,
          port: data.port,
          database: data.database,
          username: data.username,
          password: data.password
        };
      } else if (data.type === 'sharepoint') {
        if (!data.sharePointUrl || !data.listName) {
          toast({
            title: "Error",
            description: "SharePoint URL and list name are required",
            variant: "destructive"
          });
          return;
        }
        config = {
          url: data.sharePointUrl,
          listName: data.listName
        };
      } else if (data.type === 'excel') {
        if (!data.fileUrl) {
          toast({
            title: "Error",
            description: "File URL is required for Excel connections",
            variant: "destructive"
          });
          return;
        }
        config = {
          fileUrl: data.fileUrl
        };
      }

      const response = await fetch('/api/datasources/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          config
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsConnectionTested(true);
        toast({
          title: "Success",
          description: "Connection test successful!"
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (data: DataSourceFormValues) => {
    try {
      if (!data.name) {
        toast({
          title: "Error",
          description: "Please provide a name for the data source",
          variant: "destructive"
        });
        return;
      }

      // Validate connection was tested
      if (!isConnectionTested) {
        toast({
          title: "Error",
          description: "Please test the connection before saving",
          variant: "destructive"
        });
        return;
      }

      // Build the configuration object based on data source type
      let config: any = {};
      
      if (data.type === 'database') {
        if (!data.server || !data.database) {
          toast({
            title: "Error",
            description: "Server and database name are required for database connections",
            variant: "destructive"
          });
          return;
        }
        config = {
          server: data.server,
          port: data.port,
          database: data.database,
          username: data.username,
          password: data.password
        };
      } else if (data.type === 'sharepoint') {
        if (!data.sharePointUrl || !data.listName) {
          toast({
            title: "Error",
            description: "SharePoint URL and list name are required",
            variant: "destructive"
          });
          return;
        }
        config = {
          url: data.sharePointUrl,
          listName: data.listName
        };
      } else if (data.type === 'excel') {
        if (!data.fileUrl) {
          toast({
            title: "Error",
            description: "File URL is required for Excel connections",
            variant: "destructive"
          });
          return;
        }
        config = {
          fileUrl: data.fileUrl
        };
      }

      // Get the selected fields
      const selectedFields = fields
        .filter(field => field.selected)
        .map(field => ({
          name: field.name,
          type: field.type
        }));

      const response = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          config,
          fields: selectedFields
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save data source');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/datasources'] });
      onClose();
      toast({
        title: "Success",
        description: "Data source saved successfully!"
      });
    } catch (error) {
      console.error('Error saving data source:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save data source",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configure Data Source</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex space-x-4 border-b border-gray-200 mb-6">
            <button
              className={`px-4 py-2 ${activeTab === "connection" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("connection")}
            >
              Connection
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "fields" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("fields")}
              disabled={!isConnectionTested}
            >
              Fields Mapping
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "preview" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("preview")}
              disabled={!isConnectionTested}
            >
              Preview Data
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              {activeTab === "connection" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <input 
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        {...form.register("name", { required: true })}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">Name is required</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        {...form.register("type", { required: true })}
                      >
                        <option value="database">Database</option>
                        <option value="sharepoint">SharePoint</option>
                        <option value="excel">Excel</option>
                      </select>
                    </div>
                  </div>

                  {form.watch("type") === "database" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Server</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="localhost"
                          {...form.register("server")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Port</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="5432"
                          {...form.register("port")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Database</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          {...form.register("database")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Schema</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="public"
                          {...form.register("schema")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          {...form.register("username")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          {...form.register("password")}
                        />
                      </div>
                    </div>
                  )}

                  {form.watch("type") === "sharepoint" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">SharePoint URL</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://your-domain.sharepoint.com/sites/your-site"
                          {...form.register("sharePointUrl")}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">List Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          {...form.register("listName")}
                        />
                      </div>
                    </div>
                  )}

                  {form.watch("type") === "excel" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">File URL or Path</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://example.com/path/to/file.xlsx"
                        {...form.register("fileUrl")}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "fields" && (
                <div>
                  {!isConnectionTested ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Field mapping will be available after a successful connection test.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-600">
                        Select the fields you want to include in your form. These fields will be available when mapping form elements.
                      </p>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Include</TableHead>
                            <TableHead>Field Name</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="flex items-center">
                                  <Checkbox 
                                    id={`field-${index}`} 
                                    checked={field.selected} 
                                    onCheckedChange={() => toggleFieldSelection(index)}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Label 
                                  htmlFor={`field-${index}`}
                                  className="cursor-pointer"
                                >
                                  {field.name}
                                </Label>
                              </TableCell>
                              <TableCell>{field.type}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === "preview" && (
                <div>
                  {!isConnectionTested ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        Data preview will be available after a successful connection test.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-600">
                        Preview of data from the selected data source. Only the first 5 rows are shown.
                      </p>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {fields.filter(f => f.selected).map((field, index) => (
                                <TableHead key={index}>{field.name}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {fields.filter(f => f.selected).map((field, fieldIndex) => (
                                  <TableCell key={fieldIndex}>{row[field.name]}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  onClick={() => testConnection(form.getValues())}
                >
                  Test Connection
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}