import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthorized: You must be logged in to upload media.");
    }
    return await ctx.storage.generateUploadUrl();
});

export const sendPost = mutation({
    args: {
        storageId: v.id("_storage"),
        caption: v.optional(v.string()),
        mediaType: v.union(v.literal("image"), v.literal("video")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized: You must be logged in to share a memory.");
        }

        // Get user profile to use their verified name
        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        const authorName = user?.name || identity.name || "Party Guest";

        await ctx.db.insert("posts", {
            ...args,
            authorName,
            createdAt: Date.now(),
        });
    },
});

export const listPosts = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        const user = identity
            ? await ctx.db
                .query("users")
                .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
                .unique()
            : null;

        const posts = await ctx.db.query("posts").order("desc").collect();

        return Promise.all(
            posts.map(async (post) => {
                const likes = await ctx.db
                    .query("likes")
                    .withIndex("by_postId", (q) => q.eq("postId", post._id))
                    .collect();

                const isLikedByMe = user
                    ? likes.some((like) => like.userId === user._id)
                    : false;

                return {
                    ...post,
                    mediaUrl: await ctx.storage.getUrl(post.storageId),
                    likeCount: likes.length,
                    isLikedByMe,
                };
            })
        );
    },
});

export const toggleLike = mutation({
    args: {
        postId: v.id("posts"),
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

        const existingLike = await ctx.db
            .query("likes")
            .withIndex("by_userId_postId", (q) =>
                q.eq("userId", user._id).eq("postId", args.postId)
            )
            .unique();

        if (existingLike) {
            await ctx.db.delete(existingLike._id);
        } else {
            await ctx.db.insert("likes", {
                userId: user._id,
                postId: args.postId,
            });
        }
    },
});
