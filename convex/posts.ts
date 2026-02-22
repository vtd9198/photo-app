import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const sendPost = mutation({
    args: {
        storageId: v.id("_storage"),
        authorName: v.string(),
        caption: v.optional(v.string()),
        mediaType: v.union(v.literal("image"), v.literal("video")),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("posts", {
            ...args,
            authorName: args.authorName || "Party Guest",
            createdAt: Date.now(),
        });
    },
});

export const listPosts = query({
    handler: async (ctx) => {
        const posts = await ctx.db.query("posts").order("desc").collect();

        // Map storageId to public URLs
        return Promise.all(
            posts.map(async (post) => ({
                ...post,
                mediaUrl: await ctx.storage.getUrl(post.storageId),
            }))
        );
    },
});
