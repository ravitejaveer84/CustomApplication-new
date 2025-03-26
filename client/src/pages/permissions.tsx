import { useAuth } from "@/hooks/use-auth";
import { RequireAdmin } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Application } from "@shared/schema";

export default function Permissions() {
  const { toast } = useToast();
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  
  // Fetch users and applications
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
    enabled: true,
  });
  
  const { data: applications = [], isLoading: isLoadingApps } = useQuery<Application[]>({
    queryKey: ['/api/applications'],
    enabled: true,
  });

  // This is a placeholder for what would be a real permission management system
  // In a real application, we would have API endpoints to get and set permissions
  
  return (
    <RequireAdmin>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-gray-500">Manage user access to applications</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Permissions</CardTitle>
            <CardDescription>
              Set which users can access which applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">
                  Select Application
                </label>
                <Select
                  onValueChange={(value) => setSelectedAppId(Number(value))}
                  value={selectedAppId?.toString() || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id.toString()}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isLoadingUsers || isLoadingApps ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : selectedAppId ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Has Access</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => {
                        // In a real application, we would check if user has access to this app
                        const hasAccess = user.role === 'admin' || 
                          (selectedAppId && applications.find(a => 
                            a.id === selectedAppId && a.createdBy === user.id
                          ));
                        
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell>
                              {user.role === 'admin' ? (
                                <span className="text-green-600 font-medium">Always (Admin)</span>
                              ) : hasAccess ? (
                                <span className="text-green-600">Yes</span>
                              ) : (
                                <span className="text-red-600">No</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {user.role !== 'admin' && (
                                <Button 
                                  variant={hasAccess ? "destructive" : "outline"} 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: `Access ${hasAccess ? 'revoked' : 'granted'}`,
                                      description: `${user.name} ${hasAccess ? 'no longer has' : 'now has'} access to ${applications.find(a => a.id === selectedAppId)?.name}`,
                                    });
                                  }}
                                >
                                  {hasAccess ? "Revoke Access" : "Grant Access"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="text-sm text-gray-500 mt-4">
                    <p>Note: This is currently a demo UI. In a full implementation, changes would be saved to the database.</p>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  Select an application to manage permissions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAdmin>
  );
}