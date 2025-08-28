"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Trash2, Users, FileText, Clock, DollarSign, MapPin, Home, Calendar, History, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { DocumentUpload } from "@/components/DocumentUpload";
import { DocumentList } from "@/components/DocumentList";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.dealId as Id<"deals">;
  
  const deal = useQuery(api.deals.get, { dealId });
  const storageStats = useQuery(api.documents.getDealStorageStats, { dealId });
  const updateStage = useMutation(api.deals.updateStage);
  const deleteDeal = useMutation(api.deals.remove);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<string | undefined>(undefined);

  const handleDeleteDeal = async () => {
    if (!confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteDeal({ dealId });
      router.push("/deals");
    } catch (error) {
      console.error("Failed to delete deal:", error);
      setIsDeleting(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    try {
      await updateStage({ 
        dealId, 
        stage: newStage,
        message: `Stage updated to ${newStage}`
      });
    } catch (error) {
      console.error("Failed to update stage:", error);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: "bg-gray-100 text-gray-800",
      showing: "bg-blue-100 text-blue-800",
      offer: "bg-purple-100 text-purple-800",
      negotiation: "bg-yellow-100 text-yellow-800",
      contract: "bg-orange-100 text-orange-800",
      inspection: "bg-indigo-100 text-indigo-800",
      closing: "bg-pink-100 text-pink-800",
      closed: "bg-green-100 text-green-800",
    };
    return colors[stage] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      closed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Not set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const stages = [
    "lead", "showing", "offer", "negotiation", 
    "contract", "inspection", "closing", "closed"
  ];

  if (!deal) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading deal details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/deals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deal.title}</h1>
            {deal.propertyAddress && (
              <p className="text-gray-600 mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {deal.propertyAddress}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className={getStatusColor(deal.status)}>
                {deal.status}
              </Badge>
              <Badge variant="secondary" className={getStageColor(deal.stage)}>
                {deal.stage}
              </Badge>
              {deal.propertyType && (
                <Badge variant="outline">
                  {deal.propertyType.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteDeal}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stage Progression */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Deal Pipeline</CardTitle>
          <CardDescription>Track progress through stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => {
              const currentIndex = stages.indexOf(deal.stage);
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              
              return (
                <div key={stage} className="flex-1 flex items-center">
                  <button
                    onClick={() => handleStageChange(stage)}
                    className={`
                      flex flex-col items-center p-2 rounded-lg transition-colors
                      ${isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      ${isCompleted ? 'cursor-pointer' : ''}
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isCurrent ? 'bg-blue-500 text-white' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-600' : ''}
                    `}>
                      {index + 1}
                    </div>
                    <span className={`
                      text-xs mt-1 capitalize
                      ${isCurrent ? 'font-semibold text-blue-600' : 'text-gray-600'}
                    `}>
                      {stage}
                    </span>
                  </button>
                  {index < stages.length - 1 && (
                    <div className={`
                      flex-1 h-0.5 mx-2
                      ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">
            Clients ({deal.clients?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({deal.documentCount || 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            History ({deal.revisions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="mt-1">{deal.description}</p>
                  </div>
                )}
                
                {deal.propertyType && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Property Type</p>
                    <p className="mt-1 capitalize">{deal.propertyType.replace(/_/g, ' ')}</p>
                  </div>
                )}
                
                {deal.propertyAddress && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="mt-1">{deal.propertyAddress}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deal.listPrice && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">List Price</p>
                    <p className="mt-1 text-lg font-semibold">{formatPrice(deal.listPrice)}</p>
                  </div>
                )}
                
                {deal.offerPrice && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Offer Price</p>
                    <p className="mt-1 text-lg font-semibold">{formatPrice(deal.offerPrice)}</p>
                  </div>
                )}
                
                {deal.targetCloseDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Target Close Date</p>
                    <p className="mt-1">{format(new Date(deal.targetCloseDate), 'PPP')}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="mt-1">{formatDistanceToNow(deal.createdAt, { addSuffix: true })}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Deal Clients</CardTitle>
                <Button size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deal.clients && deal.clients.length > 0 ? (
                <div className="space-y-4">
                  {deal.clients.map((client) => (
                    <div key={client._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{client.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{client.user?.email}</p>
                        <Badge variant="outline" className="mt-1">
                          {client.role}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        Added {client.addedAt && formatDistanceToNow(client.addedAt, { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No clients assigned to this deal yet
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {/* Storage Stats */}
          {storageStats && storageStats.totalDocuments > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{storageStats.totalDocuments}</div>
                  <p className="text-xs text-gray-500">Total Documents</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{storageStats.sizeInMB} MB</div>
                  <p className="text-xs text-gray-500">Storage Used</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {Object.keys(storageStats.documentsByCategory || {}).length}
                  </div>
                  <p className="text-xs text-gray-500">Categories</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {storageStats.lastUpload 
                      ? formatDistanceToNow(storageStats.lastUpload, { addSuffix: true })
                      : 'Never'}
                  </div>
                  <p className="text-xs text-gray-500">Last Upload</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Documents List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Manage all documents related to this deal
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={documentFilter || "all"} onValueChange={(v) => setDocumentFilter(v === "all" ? undefined : v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="disclosure">Disclosure</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="correspondence">Correspondence</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <DocumentUpload 
                    dealId={dealId} 
                    onSuccess={() => {
                      // Convex will automatically update the documents list
                      // No need to refresh the page
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DocumentList dealId={dealId} category={documentFilter} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Revision History</CardTitle>
              <CardDescription>Track all changes made to this deal</CardDescription>
            </CardHeader>
            <CardContent>
              {deal.revisions && deal.revisions.length > 0 ? (
                <div className="space-y-4">
                  {deal.revisions.map((revision) => (
                    <div key={revision._id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <History className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">
                            {revision.message || `Revision ${revision.revisionNumber}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(revision.modifiedAt, { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          by {revision.modifiedByUser?.name || 'Unknown'}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          {revision.changeType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No revision history available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}