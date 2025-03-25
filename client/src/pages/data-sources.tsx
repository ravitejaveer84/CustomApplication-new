import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Sidebar } from "@/components/sidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataSourceModal } from "@/components/form-builder/data-source-modal";
import { useToast } from "@/hooks/use-toast";
import { Plus, MoreHorizontal, Edit, Trash, Database, FileText } from "lucide-react";

export default function DataSources() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataSourceModalOpen, setDataSourceModalOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch data sources
  const { data: dataSources, isLoading } = useQuery({
    queryKey: ['/api/datasources']
  });
  
  // Delete data source mutation
  const deleteMutation = useMutation({
    mutationFn: async (dataSourceId: number) => {
      return apiRequest('DELETE', `/api/datasources/${dataSourceId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/datasources'] });
      toast({
        title: "Data source deleted",
        description: "The data source has been deleted successfully"
      });
    },
    onError: (error) => {
      console.error('Error deleting data source:', error);
      toast({
        title: "Error",
        description: "Failed to delete data source",
        variant: "destructive"
      });
    }
  });
  
  const handleDelete = (dataSourceId: number) => {
    if (window.confirm("Are you sure you want to delete this data source?")) {
      deleteMutation.mutate(dataSourceId);
    }
  };
  
  return (
    <div className="h-screen flex flex-col bg-[#f3f2f1]">
      <AppHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Data Sources</h1>
            <Button 
              className="bg-primary"
              onClick={() => setDataSourceModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Data Sources</CardTitle>
              <CardDescription>Connect to your databases and SharePoint lists</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : dataSources?.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p>No data sources found. Add your first data source!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSources?.map((source) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">{source.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {source.type === "database" ? (
                              <Database className="h-4 w-4 mr-2 text-blue-500" />
                            ) : (
                              <FileText className="h-4 w-4 mr-2 text-green-500" />
                            )}
                            <span className="capitalize">{source.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {source.type === "database" ? (
                            <span>{source.config.server}/{source.config.database}</span>
                          ) : (
                            <span>{source.config.url}</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(source.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(source.id)}>
                                <Trash className="h-4 w-4 mr-2" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      <DataSourceModal 
        isOpen={dataSourceModalOpen} 
        onClose={() => setDataSourceModalOpen(false)} 
      />
    </div>
  );
}
