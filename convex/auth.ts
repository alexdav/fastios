import { QueryCtx, MutationCtx } from "./_generated/server";

export const auth = {
  getUserId: async (ctx: QueryCtx | MutationCtx) => {
    return (await ctx.auth.getUserIdentity())?.subject;
  },
  getUserIdentity: async (ctx: QueryCtx | MutationCtx) => {
    return await ctx.auth.getUserIdentity();
  }
};