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

export const updateName = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            name: args.name,
        });

        // Also update authorName on all their posts
        const userPosts = await ctx.db
            .query("posts")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        for (const post of userPosts) {
            await ctx.db.patch(post._id, {
                authorName: args.name,
            });
        }
    },
});
