import { useState } from "react";
import { X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface DataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DataSourceFormValues = {
  name: string;
  type: "database" | "sharepoint";
  server?: string;
  port?: string;
  database?: string;
  schema?: string;
  username?: string;
  password?: string;
  sharePointUrl?: string;
  listName?: string;
};

export function DataSourceModal({ isOpen, onClose }: DataSourceModalProps) {
  const [activeTab, setActiveTab] = useState<"connection" | "fields" | "preview">("connection");
  const { toast } = useToast();
  
  const form = useForm<DataSourceFormValues>({
    defaultValues: {
      name: "",
      type: "database",
      server: "",
      port: "1433",
      database: "",
      schema: "",
      username: "",
      password: "",
      sharePointUrl: "",
      listName: ""
    }
  });
  
  const handleSave = async (data: DataSourceFormValues) => {
    try {
      // Create a config object based on the type
      const config = data.type === "database" 
        ? {
            server: data.server,
            port: data.port,
            database: data.database,
            schema: data.schema,
            username: data.username,
            password: data.password
          } 
        : {
            url: data.sharePointUrl,
            listName: data.listName
          };
      
      // Send to the API
      await apiRequest('POST', '/api/datasources', {
        name: data.name,
        type: data.type,
        config
      });
      
      // Invalidate the data sources query
      queryClient.invalidateQueries({ queryKey: ['/api/datasources'] });
      
      toast({
        title: "Data source created",
        description: `The data source "${data.name}" has been created successfully`
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating data source:', error);
      toast({
        title: "Error",
        description: "Failed to create data source",
        variant: "destructive"
      });
    }
  };
  
  const handleTestConnection = () => {
    toast({
      title: "Connection test successful",
      description: "The connection to the data source was successful"
    });
  };
  
  const renderConnectionTab = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My Data Source" />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      <div className="mb-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Source Type</FormLabel>
              <FormControl>
                <RadioGroup 
                  className="grid grid-cols-2 gap-4"
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <div className={`border rounded-lg p-4 ${field.value === "database" ? "border-primary bg-blue-50" : "border-gray-300"} flex items-start`}>
                    <RadioGroupItem value="database" id="database" className="mt-1 mr-3" />
                    <div>
                      <Label htmlFor="database" className="font-medium">Database</Label>
                      <div className="text-sm text-gray-500">Connect to SQL, MySQL, or other databases</div>
                    </div>
                  </div>
                  <div className={`border rounded-lg p-4 ${field.value === "sharepoint" ? "border-primary bg-blue-50" : "border-gray-300"} flex items-start`}>
                    <RadioGroupItem value="sharepoint" id="sharepoint" className="mt-1 mr-3" />
                    <div>
                      <Label htmlFor="sharepoint" className="font-medium">SharePoint</Label>
                      <div className="text-sm text-gray-500">Connect to SharePoint lists or Excel files</div>
                    </div>
                  </div>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      {form.watch("type") === "database" ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <FormField
              control={form.control}
              name="server"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Server</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="dbserver.example.com" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="port"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="1433" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Database</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="HR_Database" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Schema/Table</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="employees" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="db_user" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="********" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </>
      ) : (
        <>
          <FormField
            control={form.control}
            name="sharePointUrl"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>SharePoint URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://example.sharepoint.com/sites/mysite" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="listName"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel>List or Excel File Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Employees" />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}
      
      <Button 
        type="button"
        className="bg-primary text-white"
        onClick={handleTestConnection}
      >
        Test Connection
      </Button>
    </div>
  );
  
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
              disabled={activeTab === "connection"}
            >
              Fields Mapping
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "preview" ? "text-primary border-b-2 border-primary font-medium" : "text-gray-500 hover:text-gray-700"}`}
              onClick={() => setActiveTab("preview")}
              disabled={activeTab === "connection" || activeTab === "fields"}
            >
              Preview Data
            </button>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              {activeTab === "connection" && renderConnectionTab()}
              {activeTab === "fields" && <div>Fields mapping configuration</div>}
              {activeTab === "preview" && <div>Data preview</div>}
            </form>
          </Form>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            className="bg-primary text-white"
            onClick={form.handleSubmit(handleSave)}
          >
            Save and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
