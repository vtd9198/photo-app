import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncUser = mutation({
    args: {
        externalId: v.string(),
        name: v.string(),
        profileImage: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                profileImage: args.profileImage,
            });
            return existingUser._id;
        }

        return await ctx.db.insert("users", {
            externalId: args.externalId,
            name: args.name,
            profileImage: args.profileImage,
        });
    },
});

export const currentUser = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }
        return await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();
    },
});
