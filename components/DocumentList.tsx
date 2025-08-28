"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Trash2, MoreVertical, Loader2, File, Image, FileSpreadsheet, Check, Edit2, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

interface DocumentListProps {
  dealId: Id<"deals">;
  category?: string;
}

export function DocumentList({ dealId, category }: DocumentListProps) {
  const documents = useQuery(api.documents.listDealDocuments, { dealId, category });
  const categories = useQuery(api.documents.getCategories);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const updateDocumentCategory = useMutation(api.documents.updateDocumentCategory);
  const renameDocument = useMutation(api.documents.renameDocument);
  const generateAccessToken = useMutation(api.documents.generateDocumentAccessToken);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [updatingCategoryId, setUpdatingCategoryId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [changeCategoryId, setChangeCategoryId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const handleView = async (documentId: Id<"documents">) => {
    setViewingId(documentId);
    try {
      // Generate a secure access token
      const result = await generateAccessToken({ documentId });
      
      // Open the secure URL in a new tab
      window.open(result.url, "_blank");
    } catch (error) {
      console.error("Failed to view document:", error);
      alert("Failed to view document. You may not have permission to access this file.");
    } finally {
      setViewingId(null);
    }
  };

  const handleDownload = async (documentId: Id<"documents">) => {
    setDownloadingId(documentId);
    try {
      // Generate a secure access token
      const result = await generateAccessToken({ documentId });
      
      // Add download parameter to the URL
      const downloadUrl = result.url + "&download=true";
      
      // Open the download URL (browser will handle as download due to Content-Disposition header)
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Failed to download document. You may not have permission to access this file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (documentId: Id<"documents">) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    setDeletingId(documentId);
    try {
      await deleteDocument({ documentId });
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCategoryChange = async (documentId: Id<"documents">, newCategory: string) => {
    setUpdatingCategoryId(documentId);
    try {
      await updateDocumentCategory({ 
        documentId, 
        category: newCategory 
      });
      setEditingCategoryId(null);
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const handleRename = async (documentId: Id<"documents">) => {
    if (!newFileName.trim()) {
      alert("Please enter a valid file name.");
      return;
    }

    try {
      await renameDocument({
        documentId,
        fileName: newFileName.trim(),
      });
      setRenamingId(null);
      setNewFileName("");
    } catch (error) {
      console.error("Failed to rename document:", error);
      alert("Failed to rename document. Please try again.");
    }
  };

  const handleCategoryChangeDialog = async (documentId: Id<"documents">) => {
    if (!selectedCategory) {
      alert("Please select a category.");
      return;
    }

    try {
      await updateDocumentCategory({
        documentId,
        category: selectedCategory,
      });
      setChangeCategoryId(null);
      setSelectedCategory("");
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (fileType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (fileType.includes("sheet") || fileType.includes("excel")) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      contract: "bg-purple-100 text-purple-800",
      disclosure: "bg-blue-100 text-blue-800",
      inspection: "bg-yellow-100 text-yellow-800",
      financial: "bg-green-100 text-green-800",
      correspondence: "bg-gray-100 text-gray-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (!documents) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            {getFileIcon(doc.fileType)}
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm">{doc.fileName}</p>
                <Popover 
                  open={editingCategoryId === doc._id} 
                  onOpenChange={(open) => setEditingCategoryId(open ? doc._id : null)}
                >
                  <PopoverTrigger asChild>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(doc.category)}`}
                      title="Click to change category"
                    >
                      {updatingCategoryId === doc._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        doc.category
                      )}
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="space-y-1">
                      {categories?.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => handleCategoryChange(doc._id, cat.value)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors ${
                            doc.category === cat.value ? 'bg-gray-100' : ''
                          }`}
                          disabled={updatingCategoryId === doc._id}
                        >
                          <span>{cat.label}</span>
                          {doc.category === cat.value && (
                            <Check className="h-3 w-3 text-green-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span>
                  Uploaded {formatDistanceToNow(doc.uploadedAt, { addSuffix: true })}
                </span>
                {doc.uploader && (
                  <>
                    <span>•</span>
                    <span>by {doc.uploader.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={deletingId === doc._id || downloadingId === doc._id || viewingId === doc._id}
              >
                {deletingId === doc._id || downloadingId === doc._id || viewingId === doc._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleDownload(doc._id)}
                disabled={downloadingId === doc._id}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingId === doc._id ? "Downloading..." : "Download"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleView(doc._id)}
                disabled={viewingId === doc._id}
              >
                <FileText className="h-4 w-4 mr-2" />
                {viewingId === doc._id ? "Loading..." : "View"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCategory(doc.category);
                  setChangeCategoryId(doc._id);
                }}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Change Category
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setNewFileName(doc.fileName);
                  setRenamingId(doc._id);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(doc._id)}
                className="text-red-600"
                disabled={deletingId === doc._id}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingId === doc._id ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {/* Rename Dialog */}
      <Dialog open={!!renamingId} onOpenChange={(open) => {
        if (!open) {
          setRenamingId(null);
          setNewFileName("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
            <DialogDescription>
              Enter a new name for the document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="col-span-3"
                placeholder="Enter file name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && renamingId) {
                    handleRename(renamingId as Id<"documents">);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenamingId(null);
                setNewFileName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => renamingId && handleRename(renamingId as Id<"documents">)}
              disabled={!newFileName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Category Dialog */}
      <Dialog open={!!changeCategoryId} onOpenChange={(open) => {
        if (!open) {
          setChangeCategoryId(null);
          setSelectedCategory("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Category</DialogTitle>
            <DialogDescription>
              Select a new category for the document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangeCategoryId(null);
                setSelectedCategory("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => changeCategoryId && handleCategoryChangeDialog(changeCategoryId as Id<"documents">)}
              disabled={!selectedCategory}
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}