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
              {/* Form fields go here */}
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