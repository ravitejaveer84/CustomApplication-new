import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

type ApprovalRequest = {
  id: number;
  formSubmissionId: number;
  requesterId: number;
  status: string;
  reason: string | null;
  approvedById: number | null;
  createdAt: string;
  updatedAt: string;
  // Extended properties from joins
  requesterName?: string;
  approverName?: string;
  formName?: string;
  submissionData?: any;
};

export default function ApprovalRequests() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [responseReason, setResponseReason] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Get all approval requests (for admins)
  const allRequestsQuery = useQuery<ApprovalRequest[]>({
    queryKey: ["/api/approval-requests"],
    enabled: isAdmin,
  });

  // Get pending approval requests (for approvers/admins)
  const pendingRequestsQuery = useQuery<ApprovalRequest[]>({
    queryKey: ["/api/approval-requests/pending"],
  });

  // Get user's own approval requests
  const userRequestsQuery = useQuery<ApprovalRequest[]>({
    queryKey: ["/api/approval-requests/user"],
  });

  // Mutation to update approval request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: number;
      status: string;
      reason: string;
    }) => {
      return apiRequest(`/api/approval-requests/${id}`, {
        method: "PATCH",
        data: { status, reason },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/approval-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approval-requests/user"] });
      
      toast({
        title: "Request updated",
        description: "The approval request has been updated successfully.",
      });
      
      setIsDialogOpen(false);
      setResponseReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the approval request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApproveReject = (status: "approved" | "rejected") => {
    if (!selectedRequest) return;

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status,
      reason: responseReason,
    });
  };

  const openResponseDialog = (request: ApprovalRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setResponseReason("");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderRequestList = (requests: ApprovalRequest[] | undefined, isPending: boolean = false) => {
    if (!requests || requests.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          No approval requests found.
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Request #{request.id}</CardTitle>
                  <CardDescription>
                    Created on {new Date(request.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                {getStatusBadge(request.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Form Submission:</span>
                  <span className="text-sm ml-2">#{request.formSubmissionId}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Requester:</span>
                  <span className="text-sm ml-2">{request.requesterName ?? request.requesterId}</span>
                </div>
                {request.approvedById && (
                  <div>
                    <span className="text-sm font-medium">Reviewer:</span>
                    <span className="text-sm ml-2">{request.approverName ?? request.approvedById}</span>
                  </div>
                )}
                {request.reason && (
                  <div>
                    <span className="text-sm font-medium">Reason:</span>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded-md">{request.reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
            {isPending && user && request.requesterId !== user.id && (
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResponseDialog(request, "reject")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => openResponseDialog(request, "approve")}
                >
                  Approve
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    );
  };

  const isLoading = allRequestsQuery.isLoading || pendingRequestsQuery.isLoading || userRequestsQuery.isLoading;

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Approval Requests</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" disabled={!isAdmin}>
            All Requests
          </TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="user">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderRequestList(allRequestsQuery.data)
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderRequestList(pendingRequestsQuery.data, true)
          )}
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderRequestList(userRequestsQuery.data)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === "approved" ? "Approve" : "Reject"} Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.status === "approved"
                ? "Confirm approval of this request."
                : "Please provide a reason for rejecting this request."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Comments</Label>
              <Textarea
                id="reason"
                placeholder="Enter additional comments or reasons..."
                value={responseReason}
                onChange={(e) => setResponseReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleApproveReject(selectedRequest?.status === "approved" ? "approved" : "rejected")}
              disabled={updateRequestMutation.isPending}
            >
              {updateRequestMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}