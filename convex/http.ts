import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Serve documents with real-time access control
http.route({
  path: "/secure-documents",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const documentId = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    const isDownload = url.searchParams.get("download") === "true";
    
    if (!documentId || !token) {
      return new Response("Missing parameters", { status: 400 });
    }

    try {
      // Validate the access token and get document info
      const validation = await ctx.runQuery(internal.documents.validateAndGetDocument, {
        documentId: documentId as Id<"documents">,
        token,
      });

      if (!validation.isValid) {
        return new Response(validation.error || "Access denied", { status: 403 });
      }

      // Mark token as used (for single-use security)
      if (validation.tokenId) {
        await ctx.runMutation(internal.documents.markTokenAsUsed, {
          tokenId: validation.tokenId as Id<"documentAccessTokens">,
        });
      }

      // Get the file blob
      const blob = await ctx.storage.get(validation.storageId as Id<"_storage">);
      if (!blob) {
        return new Response("File not found", { status: 404 });
      }

      // Set appropriate headers
      const headers = new Headers();
      headers.set("Content-Type", validation.fileType);
      headers.set("Content-Length", validation.fileSize.toString());
      
      if (isDownload) {
        headers.set("Content-Disposition", `attachment; filename="${validation.fileName}"`);
      } else {
        headers.set("Content-Disposition", `inline; filename="${validation.fileName}"`);
      }

      // Add cache control to prevent unauthorized caching
      headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");

      // Log access for audit trail
      await ctx.runMutation(internal.documents.logDocumentAccess, {
        documentId: documentId as Id<"documents">,
        accessType: isDownload ? "download" : "view",
        userId: validation.userId as Id<"users">,
      });

      return new Response(blob, { headers, status: 200 });
    } catch (error) {
      console.error("Error serving document:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }),
});

// Clerk webhook endpoint would go here if needed
// http.route({
//   path: "/clerk",
//   method: "POST",
//   handler: ...,
// });

export default http;