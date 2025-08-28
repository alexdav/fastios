"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Users, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DealsPage() {
  const deals = useQuery(api.deals.list);
  const createDeal = useMutation(api.deals.create);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyAddress: "",
    propertyType: "single_family",
    listPrice: "",
    status: "draft",
    stage: "lead",
  });

  const handleCreateDeal = async () => {
    try {
      await createDeal({
        ...formData,
        listPrice: formData.listPrice ? parseFloat(formData.listPrice) : undefined,
      });
      setShowCreateDialog(false);
      setFormData({
        title: "",
        description: "",
        propertyAddress: "",
        propertyType: "single_family",
        listPrice: "",
        status: "draft",
        stage: "lead",
      });
    } catch (error) {
      console.error("Failed to create deal:", error);
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-1">Manage your real estate deals and transactions</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
              <DialogDescription>
                Add a new real estate deal to your pipeline
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Deal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 123 Main St - Johnson Family"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the deal..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="listPrice">List Price</Label>
                  <Input
                    id="listPrice"
                    type="number"
                    value={formData.listPrice}
                    onChange={(e) => setFormData({ ...formData, listPrice: e.target.value })}
                    placeholder="450000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData({ ...formData, stage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="showing">Showing</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDeal} disabled={!formData.title}>
                Create Deal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!deals ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading deals...</p>
        </div>
      ) : deals.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <FileText className="w-12 h-12 text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No deals yet</h3>
              <p className="text-gray-600 mt-1">Create your first deal to get started</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Deal
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{deal.title}</CardTitle>
                    {deal.propertyAddress && (
                      <CardDescription className="mt-1">{deal.propertyAddress}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className={getStatusColor(deal.status)}>
                      {deal.status}
                    </Badge>
                    <Badge variant="secondary" className={getStageColor(deal.stage)}>
                      {deal.stage}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {deal.listPrice && (
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>{formatPrice(deal.listPrice)}</span>
                      </div>
                    )}

                    {deal.clients && deal.clients.length > 0 && (
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{deal.clients.length} client{deal.clients.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Created {formatDistanceToNow(deal.createdAt, { addSuffix: true })}</span>
                    </div>
                  </div>

                  {deal.propertyType && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {deal.propertyType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}