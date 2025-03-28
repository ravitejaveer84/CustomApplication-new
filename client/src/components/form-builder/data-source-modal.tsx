import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type DataSourceFormValues = {
  name: string;
  type: "database" | "sharepoint" | "excel";
  dbType?: "postgresql" | "mysql" | "mongodb" | "mssql" | "oracle" | "sqlite";
  server?: string;
  port?: string;
  database?: string;
  schema?: string;
  // For relational databases - table selection
  table?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  sharePointUrl?: string;
  listName?: string;
  fileUrl?: string;
  // MongoDB specific
  collection?: string; 
  // Oracle specific
  service?: string;
  // SQLite specific
  filename?: string;
  // Option for using default database connection from environment
  useDefaultDatabase?: boolean;
};

type DataField = {
  name: string;
  type: string;
  selected: boolean;
};

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId?: number; // The ID of the form this data source is associated with
  existingDataSource?: any; // For editing existing data sources
}

export function DataSourceModal({ isOpen, onClose, formId, existingDataSource }: DataSourceModalProps) {
  // Add a view state to switch between list and edit/create views
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [activeTab, setActiveTab] = useState("connection");
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const [fields, setFields] = useState<DataField[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data sources for this form
  const { data: dataSources = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/datasources", formId],
    queryFn: async () => {
      const url = formId ? `/api/datasources?formId=${formId}` : '/api/datasources';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch data sources');
      }
      return response.json();
    },
    enabled: isOpen && view === "list",
  });

  const form = useForm<DataSourceFormValues>({
    defaultValues: {
      type: "database",
      dbType: "postgresql",
      useDefaultDatabase: false
    }
  });
  
  // State to store connection test response
  const [connectionTestResponse, setConnectionTestResponse] = useState<any>(null);
  
  // Effect to load fields and preview data when editing an existing data source
  useEffect(() => {
    if (view === "edit" && selectedDataSource) {
      // Get the saved fields from the data source
      const savedFields = selectedDataSource.fields || [];
      if (savedFields.length > 0) {
        setFields(savedFields);
        generateSamplePreviewData(savedFields);
      } else {
        // Fetch fields from the API if not stored with the data source
        fetchDataSourceFields(selectedDataSource.id);
      }
    }
  }, [view, selectedDataSource]);

  // Function to fetch fields for a data source by ID
  const fetchDataSourceFields = async (dataSourceId: number) => {
    try {
      const response = await fetch(`/api/datasources/${dataSourceId}`);
      if (response.ok) {
        const dataSource = await response.json();
        
        if (dataSource.fields && dataSource.fields.length > 0) {
          setFields(dataSource.fields);
          generateSamplePreviewData(dataSource.fields);
        }
      }
    } catch (error) {
      console.error('Error fetching data source fields:', error);
    }
  };

  // Effect to generate fields when connection is tested successfully
  useEffect(() => {
    if (isConnectionTested && connectionTestResponse && view !== "edit") {
      // Process fields from the connection test response
      const type = form.getValues('type');
      
      let dataFields: DataField[] = [];
      
      if (connectionTestResponse.fields) {
        // If the API returns fields directly (for SharePoint and Excel)
        if (Array.isArray(connectionTestResponse.fields)) {
          dataFields = connectionTestResponse.fields;
        } 
        // If it returns fields grouped by table (for database)
        else if (typeof connectionTestResponse.fields === 'object') {
          const tables = Object.keys(connectionTestResponse.fields);
          if (tables.length > 0) {
            // Use the first table's fields
            const firstTable = tables[0];
            dataFields = connectionTestResponse.fields[firstTable] || [];
          }
        }
      } else {
        // Fallback sample fields if the API doesn't return any
        if (type === 'database') {
          dataFields = [
            { name: 'id', type: 'number', selected: true },
            { name: 'name', type: 'text', selected: true },
            { name: 'email', type: 'text', selected: true },
            { name: 'created_date', type: 'datetime', selected: false },
            { name: 'status', type: 'text', selected: false },
          ];
        } else if (type === 'sharepoint') {
          dataFields = [
            { name: 'ID', type: 'number', selected: true },
            { name: 'Title', type: 'text', selected: true },
            { name: 'Modified', type: 'datetime', selected: true },
            { name: 'Created', type: 'datetime', selected: false },
            { name: 'Author', type: 'text', selected: false },
          ];
        } else if (type === 'excel') {
          dataFields = [
            { name: 'Column1', type: 'text', selected: true },
            { name: 'Column2', type: 'text', selected: true },
            { name: 'Column3', type: 'number', selected: true },
            { name: 'Column4', type: 'datetime', selected: false },
          ];
        }
      }
      
      // Set fields and generate preview data
      setFields(dataFields);
      generateSamplePreviewData(dataFields);
      
      console.log('Data source connection response:', connectionTestResponse);
      console.log('Processed fields:', dataFields);
    }
  }, [isConnectionTested, connectionTestResponse]);
  
  const generateSamplePreviewData = (fields: DataField[]) => {
    // Generate 5 rows of more realistic sample data
    const data = [];
    
    // Sample data generators for different field types
    const generateTextValue = (fieldName: string, index: number) => {
      // Generate sample text based on common field names
      const fieldNameLower = fieldName.toLowerCase();
      
      if (fieldNameLower.includes('name') || fieldNameLower === 'title') {
        const names = ['John Smith', 'Jane Doe', 'Alex Johnson', 'Maria Garcia', 'Wei Zhang', 
                       'Sarah Wilson', 'Michael Brown', 'Emma Davis', 'Raj Patel', 'Olivia Miller'];
        return names[index % names.length];
      } 
      else if (fieldNameLower.includes('email')) {
        const emails = ['john@example.com', 'jane.doe@company.com', 'alex.j@mail.net', 
                       'maria.garcia@org.co', 'wei.zhang@tech.io'];
        return emails[index % emails.length];
      }
      else if (fieldNameLower.includes('address')) {
        const addresses = ['123 Main St', '456 Oak Ave', '789 Pine Rd', '101 River Ln', '555 Beach Blvd'];
        return addresses[index % addresses.length];
      }
      else if (fieldNameLower.includes('status')) {
        const statuses = ['Active', 'Pending', 'Completed', 'On Hold', 'Cancelled'];
        return statuses[index % statuses.length];
      }
      else if (fieldNameLower.includes('department') || fieldNameLower.includes('category')) {
        const departments = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance'];
        return departments[index % departments.length];
      }
      else if (fieldNameLower.includes('phone')) {
        const phones = ['(555) 123-4567', '(555) 987-6543', '(555) 456-7890', '(555) 321-0987', '(555) 789-0123'];
        return phones[index % phones.length];
      }
      else {
        // Generic fallback for other text fields
        return `Sample ${fieldName} ${index+1}`;
      }
    };
    
    const generateNumberValue = (fieldName: string, index: number) => {
      const fieldNameLower = fieldName.toLowerCase();
      
      if (fieldNameLower.includes('id')) {
        return index + 1;
      }
      else if (fieldNameLower.includes('age')) {
        return 25 + (index % 40); // Ages between 25-64
      }
      else if (fieldNameLower.includes('price') || fieldNameLower.includes('cost')) {
        return (19.99 + (index * 10)).toFixed(2);
      }
      else if (fieldNameLower.includes('quantity') || fieldNameLower.includes('count')) {
        return 1 + (index * 3);
      }
      else {
        return Math.floor(Math.random() * 1000);
      }
    };
    
    const generateDateValue = (fieldName: string, index: number) => {
      const fieldNameLower = fieldName.toLowerCase();
      const today = new Date();
      
      if (fieldNameLower.includes('created') || fieldNameLower.includes('start')) {
        // Dates in the past
        const date = new Date(today);
        date.setDate(today.getDate() - (30 + index * 5));
        return date.toISOString().substring(0, 10);
      }
      else if (fieldNameLower.includes('updated') || fieldNameLower.includes('modified')) {
        // Recent dates
        const date = new Date(today);
        date.setDate(today.getDate() - (index * 3));
        return date.toISOString().substring(0, 10);
      }
      else if (fieldNameLower.includes('due') || fieldNameLower.includes('end')) {
        // Dates in the future
        const date = new Date(today);
        date.setDate(today.getDate() + (7 + index * 7));
        return date.toISOString().substring(0, 10);
      }
      else {
        return today.toISOString().substring(0, 10);
      }
    };
    
    // Generate the rows
    for (let i = 0; i < 5; i++) {
      const row: Record<string, any> = {};
      fields.forEach(field => {
        if (field.type === 'number') {
          row[field.name] = generateNumberValue(field.name, i);
        } else if (field.type === 'datetime') {
          row[field.name] = generateDateValue(field.name, i);
        } else if (field.type === 'boolean') {
          row[field.name] = i % 2 === 0;
        } else {
          row[field.name] = generateTextValue(field.name, i);
        }
      });
      data.push(row);
    }
    setPreviewData(data);
    
    console.log('Generated preview data:', data);
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
        // Include database type and table in the config
        config = {
          dbType: data.dbType || 'postgresql',
          useDefaultDatabase: data.useDefaultDatabase,
          table: data.table || (availableTables.length > 0 ? availableTables[0] : undefined)
        };
        
        // Different validation logic based on database type
        if (data.dbType === 'sqlite') {
          if (!data.filename) {
            toast({
              title: "Error",
              description: "Database filename is required for SQLite connections",
              variant: "destructive"
            });
            return;
          }
          config.filename = data.filename;
        } else if (data.dbType === 'mongodb') {
          if (data.connectionString) {
            config.uri = data.connectionString;
          } else if (!data.server || !data.database) {
            toast({
              title: "Error",
              description: "Server and database name are required for MongoDB connections",
              variant: "destructive"
            });
            return;
          } else {
            config.host = data.server;
            config.port = data.port;
            config.database = data.database;
            config.username = data.username;
            config.password = data.password;
            config.collection = data.collection;
          }
        } else if (data.dbType === 'oracle') {
          if (data.connectionString) {
            config.connectString = data.connectionString;
          } else if (!data.server || !data.service) {
            toast({
              title: "Error",
              description: "Server and service name are required for Oracle connections",
              variant: "destructive"
            });
            return;
          } else {
            config.host = data.server;
            config.port = data.port;
            config.service = data.service;
            config.user = data.username;
            config.password = data.password;
          }
        } else {
          // PostgreSQL, MySQL, SQL Server all use similar connection parameters
          if (!data.server || !data.database) {
            toast({
              title: "Error",
              description: `Server and database name are required for ${data.dbType} connections`,
              variant: "destructive"
            });
            return;
          }
          config.server = data.server;
          config.port = data.port;
          config.database = data.database;
          config.schema = data.schema;
          config.user = data.username;
          config.password = data.password;
        }
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
        setConnectionTestResponse(result);
        
        // Extract tables and fields from the response
        let extractedFields: DataField[] = [];
        if (data.type === 'database') {
          // For database, store tables and select the first one as default
          const tables = result.tables || [];
          setAvailableTables(tables);
          
          if (tables.length > 0) {
            // Set the first table as default
            const firstTable = tables[0];
            form.setValue('table', firstTable);
            
            // Get fields for this table
            const tableFields = result.fields[firstTable] || [];
            extractedFields = tableFields.map((field: any) => ({
              name: field.name,
              type: field.type,
              selected: field.selected || false
            }));
          }
        } else if (data.type === 'sharepoint' || data.type === 'excel') {
          // For SharePoint and Excel, the fields are directly in the response
          extractedFields = (result.fields || []).map((field: any) => ({
            name: field.name,
            type: field.type,
            selected: field.selected || false
          }));
        }
        
        setFields(extractedFields);
        
        // Generate preview data based on the fields
        if (extractedFields.length > 0) {
          generateSamplePreviewData(extractedFields);
        }
        
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

      // If editing, we may skip connection testing
      if (!isConnectionTested && view !== "edit") {
        toast({
          title: "Error",
          description: "Please test the connection before saving",
          variant: "destructive"
        });
        return;
      }
      
      // Check if we're editing an existing data source
      const isEditing = view === "edit" && selectedDataSource;

      // Build the configuration object based on data source type
      let config: any = {};
      
      if (data.type === 'database') {
        // Make sure a table is selected for database connections
        if (!data.table && availableTables.length > 0) {
          toast({
            title: "Error",
            description: "Please select a table for this data source",
            variant: "destructive"
          });
          return;
        }
        
        // Include database type in the config
        config = {
          dbType: data.dbType || 'postgresql',
          useDefaultDatabase: data.useDefaultDatabase,
          table: data.table
        };
        
        // Different validation logic based on database type
        if (data.dbType === 'sqlite') {
          if (!data.filename) {
            toast({
              title: "Error",
              description: "Database filename is required for SQLite connections",
              variant: "destructive"
            });
            return;
          }
          config.filename = data.filename;
        } else if (data.dbType === 'mongodb') {
          if (data.connectionString) {
            config.uri = data.connectionString;
          } else if (!data.server || !data.database) {
            toast({
              title: "Error",
              description: "Server and database name are required for MongoDB connections",
              variant: "destructive"
            });
            return;
          } else {
            config.host = data.server;
            config.port = data.port;
            config.database = data.database;
            config.username = data.username;
            config.password = data.password;
            config.collection = data.collection;
          }
        } else if (data.dbType === 'oracle') {
          if (data.connectionString) {
            config.connectString = data.connectionString;
          } else if (!data.server || !data.service) {
            toast({
              title: "Error",
              description: "Server and service name are required for Oracle connections",
              variant: "destructive"
            });
            return;
          } else {
            config.host = data.server;
            config.port = data.port;
            config.service = data.service;
            config.user = data.username;
            config.password = data.password;
          }
        } else {
          // PostgreSQL, MySQL, SQL Server all use similar connection parameters
          if (!data.server || !data.database) {
            toast({
              title: "Error",
              description: `Server and database name are required for ${data.dbType} connections`,
              variant: "destructive"
            });
            return;
          }
          config.server = data.server;
          config.port = data.port;
          config.database = data.database;
          config.schema = data.schema;
          config.user = data.username;
          config.password = data.password;
        }
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

      // Get the selected field names for storage
      const selectedFieldNames = fields
        .filter(field => field.selected)
        .map(field => field.name);

      // Use PUT for editing existing data source, POST for creating a new one
      const url = isEditing ? `/api/datasources/${selectedDataSource.id}` : '/api/datasources';
      const method = isEditing ? 'PUT' : 'POST';
        
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          config: config, // Send config as plain object, server will stringify if needed
          fields: fields,                 // Store all fields
          selectedFields: selectedFieldNames, // Store just the names of selected fields
          formId: formId || undefined // Associate with form if formId is provided
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {view === "list" ? "Data Sources" : view === "create" ? "Create Data Source" : "Edit Data Source"}
          </DialogTitle>
        </DialogHeader>

        {/* List View */}
        {view === "list" && (
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Available Data Sources</h3>
              <button
                className="px-4 py-2 bg-primary text-white rounded-md flex items-center"
                onClick={() => {
                  setView("create");
                  form.reset({
                    type: "database",
                    dbType: "postgresql",
                    useDefaultDatabase: false
                  });
                  setIsConnectionTested(false);
                  setFields([]);
                  setPreviewData([]);
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Data Source
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : dataSources.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No data sources found for this form</p>
                <p className="text-sm text-gray-500">Click "Add Data Source" to create one</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataSources.map((dataSource: any) => (
                      <tr key={dataSource.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataSource.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {dataSource.type.charAt(0).toUpperCase() + dataSource.type.slice(1)}
                          {dataSource.config && dataSource.config.dbType && ` (${dataSource.config.dbType})`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            className="text-primary hover:text-primary-dark mr-4"
                            onClick={() => {
                              setSelectedDataSource(dataSource);
                              // Populate form with existing values
                              const config = dataSource.config || {};
                              form.reset({
                                name: dataSource.name,
                                type: dataSource.type,
                                dbType: config.dbType,
                                server: config.server || config.host,
                                port: config.port,
                                database: config.database,
                                schema: config.schema,
                                table: config.table,
                                username: config.username || config.user,
                                password: config.password,
                                connectionString: config.connectionString || config.uri || config.connectString,
                                sharePointUrl: config.url,
                                listName: config.listName,
                                fileUrl: config.fileUrl,
                                collection: config.collection,
                                service: config.service,
                                filename: config.filename,
                                useDefaultDatabase: config.useDefaultDatabase || false
                              });
                              setView("edit");
                              setIsConnectionTested(true); // Assume connection is valid for existing source
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete the data source "${dataSource.name}"?`)) {
                                try {
                                  const response = await fetch(`/api/datasources/${dataSource.id}`, {
                                    method: 'DELETE'
                                  });
                                  
                                  if (response.ok) {
                                    queryClient.invalidateQueries({ queryKey: ["/api/datasources"] });
                                    toast({
                                      title: "Success",
                                      description: "Data source deleted successfully"
                                    });
                                  } else {
                                    throw new Error("Failed to delete data source");
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete data source",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit View */}
        {(view === "create" || view === "edit") && (
          <div className="py-4">
            <div className="mb-4 flex justify-between">
              <button
                className="px-3 py-1 text-gray-600 hover:text-gray-800 flex items-center"
                onClick={() => setView("list")}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to List
              </button>
            </div>
          
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
                    <>
                      <div className="p-4 mb-4 border rounded-md bg-blue-50">
                        <p className="text-sm text-blue-600">
                          Select the type of database you want to connect to.
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <label className="text-sm font-medium">Database Type</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            {...form.register("dbType")}
                            defaultValue="postgresql"
                          >
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="mongodb">MongoDB</option>
                            <option value="mssql">Microsoft SQL Server</option>
                            <option value="oracle">Oracle</option>
                            <option value="sqlite">SQLite</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2 col-span-2">
                          <label className="flex items-center space-x-2">
                            <Checkbox 
                              id="useDefaultDatabase"
                              checked={form.getValues("useDefaultDatabase")}
                              onCheckedChange={(checked) => {
                                const useDefault = checked === true;
                                form.setValue("useDefaultDatabase", useDefault);
                                if (useDefault) {
                                  form.setValue("server", "localhost");
                                  form.setValue("port", form.watch("dbType") === "postgresql" ? "5432" : 
                                    form.watch("dbType") === "mysql" ? "3306" : 
                                    form.watch("dbType") === "mongodb" ? "27017" : 
                                    form.watch("dbType") === "mssql" ? "1433" : 
                                    form.watch("dbType") === "oracle" ? "1521" : "");
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">Use default environment database</span>
                          </label>
                          <p className="text-xs text-gray-500">
                            If checked, the application will use the database connection from environment variables
                          </p>
                        </div>
                        
                        {form.watch("dbType") === "postgresql" || form.watch("dbType") === "mysql" || form.watch("dbType") === "mssql" ? (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Server/Host</label>
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
                                placeholder={form.watch("dbType") === "postgresql" ? "5432" : 
                                  form.watch("dbType") === "mysql" ? "3306" : "1433"}
                                {...form.register("port")}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Database Name</label>
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
                            
                            {/* Table selector - only shown after connection test */}
                            {isConnectionTested && (
                              <div className="space-y-2 col-span-2">
                                <label className="text-sm font-medium">Table</label>
                                <select
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                  {...form.register("table")}
                                  onChange={(e) => {
                                    const selectedTable = e.target.value;
                                    // Update fields based on the selected table
                                    if (connectionTestResponse?.fields && connectionTestResponse.fields[selectedTable]) {
                                      const tableFields = connectionTestResponse.fields[selectedTable].map((field: any) => ({
                                        name: field.name,
                                        type: field.type,
                                        selected: field.selected || false
                                      }));
                                      setFields(tableFields);
                                      generateSamplePreviewData(tableFields);
                                    }
                                  }}
                                >
                                  {availableTables.length > 0 ? (
                                    availableTables.map((table) => (
                                      <option key={table} value={table}>
                                        {table}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="">No tables found</option>
                                  )}
                                </select>
                                <p className="text-xs text-gray-500">
                                  Select a table from the database to use for this data source
                                </p>
                              </div>
                            )}
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
                          </>
                        ) : form.watch("dbType") === "mongodb" ? (
                          <>
                            <div className="space-y-2 col-span-2">
                              <label className="text-sm font-medium">Connection URI (optional)</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="mongodb://username:password@host:port/database"
                                {...form.register("connectionString")}
                              />
                              <p className="text-xs text-gray-500">
                                If provided, other connection details are ignored
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Host</label>
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
                                placeholder="27017"
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
                              <label className="text-sm font-medium">Collection</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                {...form.register("collection")}
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
                          </>
                        ) : form.watch("dbType") === "oracle" ? (
                          <>
                            <div className="space-y-2 col-span-2">
                              <label className="text-sm font-medium">Connection String (optional)</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="host:port/service"
                                {...form.register("connectionString")}
                              />
                              <p className="text-xs text-gray-500">
                                If provided, host/port/service fields are ignored
                              </p>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Host</label>
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
                                placeholder="1521"
                                {...form.register("port")}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Service Name</label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="orcl"
                                {...form.register("service")}
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
                          </>
                        ) : form.watch("dbType") === "sqlite" ? (
                          <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium">Database Filename</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="/path/to/database.db"
                              {...form.register("filename")}
                            />
                          </div>
                        ) : null}
                      </div>
                    </>
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
                      
                      {/* Added max-height with overflow-y-auto to make table scrollable */}
                      <div className="max-h-[400px] overflow-y-auto border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
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
                      
                      {/* Added max-height with overflow-y-auto for vertical scrolling */}
                      <div className="max-h-[400px] overflow-y-auto overflow-x-auto border rounded-md">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10">
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
                                  <TableCell key={fieldIndex}>
                                    {/* Add max-width to prevent cells from becoming too wide */}
                                    <div className="max-w-[200px] truncate" title={String(row[field.name])}>
                                      {row[field.name]}
                                    </div>
                                  </TableCell>
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
        )}
      </DialogContent>
    </Dialog>
  );
}