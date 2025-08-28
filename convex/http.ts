import { httpRouter } from "convex/server";

const http = httpRouter();

// Clerk webhook endpoint would go here if needed
// http.route({
//   path: "/clerk",
//   method: "POST",
//   handler: ...,
// });

export default http;