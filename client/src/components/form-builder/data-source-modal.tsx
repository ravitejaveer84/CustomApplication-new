import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataSourceModal({ isOpen, onClose }: DataSourceModalProps) {
  const [activeTab, setActiveTab] = useState("connection");
  const [isConnectionTested, setIsConnectionTested] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DataSourceFormValues>();

  const testConnection = async (data: DataSourceFormValues) => {
    try {
      const response = await fetch('/api/datasources/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          config: {
            server: data.server,
            port: data.port,
            database: data.database,
            username: data.username,
            password: data.password,
            url: data.sharePointUrl || data.fileUrl,
            listName: data.listName
          }
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
      const response = await fetch('/api/datasources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          config: {
            server: data.server,
            port: data.port,
            database: data.database,
            username: data.username,
            password: data.password,
            url: data.sharePointUrl || data.fileUrl,
            listName: data.listName
          }
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
      toast({
        title: "Error",
        description: "Failed to save data source",
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
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Field mapping will be available after a successful connection test.
                  </p>
                </div>
              )}
              
              {activeTab === "preview" && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Data preview will be available after a successful connection test.
                  </p>
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