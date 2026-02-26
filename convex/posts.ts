import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const sendPost = mutation({
    args: {
        storageId: v.id("_storage"),
        livePhotoVideoId: v.optional(v.id("_storage")),
        caption: v.optional(v.string()),
        mediaType: v.union(v.literal("image"), v.literal("video")),
        authorName: v.string(),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
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

        console.log("Saving post:", {
            storageId: args.storageId,
            authorName: args.authorName,
            mediaType: args.mediaType,
            width: args.width,
            height: args.height,
        });

        await ctx.db.insert("posts", {
            storageId: args.storageId,
            livePhotoVideoId: args.livePhotoVideoId,
            userId: user._id,
            authorName: args.authorName,
            caption: args.caption,
            mediaType: args.mediaType,
            width: args.width,
            height: args.height,
            createdAt: Date.now(),
        });
    },
});


export const listPosts = query({
    args: {
        sortBy: v.optional(v.union(v.literal("newest"), v.literal("mostLiked"))),
        searchTerm: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        const user = identity
            ? await ctx.db
                .query("users")
                .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
                .unique()
            : null;

        let posts = await ctx.db.query("posts").order("desc").collect();

        if (args.searchTerm && args.searchTerm.trim() !== "") {
            const searchLower = args.searchTerm.toLowerCase().trim();
            posts = posts.filter(post =>
                post.authorName.toLowerCase().includes(searchLower)
            );
        }

        const postsWithDetails = await Promise.all(
            posts.map(async (post) => {
                const likes = await ctx.db
                    .query("likes")
                    .withIndex("by_postId", (q) => q.eq("postId", post._id))
                    .collect();

                const isLikedByMe = user
                    ? likes.some((like) => like.userId === user._id)
                    : false;

                const mediaUrl = await ctx.storage.getUrl(post.storageId);
                const livePhotoVideoUrl = post.livePhotoVideoId
                    ? await ctx.storage.getUrl(post.livePhotoVideoId)
                    : undefined;

                return {
                    ...post,
                    mediaUrl,
                    livePhotoVideoUrl,
                    likeCount: likes.length,
                    isLikedByMe,
                };
            })
        );

        if (args.sortBy === "mostLiked") {
            return postsWithDetails.sort((a, b) => b.likeCount - a.likeCount);
        }

        return postsWithDetails;
    },
});

export const listUserPosts = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        if (!user) return [];

        const posts = await ctx.db
            .query("posts")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();

        return Promise.all(
            posts.map(async (post) => {
                const likes = await ctx.db
                    .query("likes")
                    .withIndex("by_postId", (q) => q.eq("postId", post._id))
                    .collect();

                const isLikedByMe = likes.some((like) => like.userId === user._id);

                const mediaUrl = await ctx.storage.getUrl(post.storageId);
                const livePhotoVideoUrl = post.livePhotoVideoId
                    ? await ctx.storage.getUrl(post.livePhotoVideoId)
                    : undefined;

                return {
                    ...post,
                    mediaUrl,
                    livePhotoVideoUrl,
                    likeCount: likes.length,
                    isLikedByMe,
                };
            })
        );
    },
});

export const getUserStats = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_externalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        if (!user) return null;

        const userPosts = await ctx.db
            .query("posts")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        const postLikeCounts = await Promise.all(
            userPosts.map(async (post) => {
                const likes = await ctx.db
                    .query("likes")
                    .withIndex("by_postId", (q) => q.eq("postId", post._id))
                    .collect();
                return likes.length;
            })
        );

        const totalLikesReceived = postLikeCounts.reduce((sum, count) => sum + count, 0);

        return {
            totalLikesReceived,
            postCount: userPosts.length,
        };
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

export const deletePost = mutation({
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

        const post = await ctx.db.get(args.postId);
        if (!post) {
            throw new Error("Post not found");
        }

        if (post.userId !== user._id) {
            throw new Error("Unauthorized: Only the author can delete this post");
        }

        await ctx.db.delete(args.postId);
        // Also delete associated likes
        const likes = await ctx.db
            .query("likes")
            .withIndex("by_postId", (q) => q.eq("postId", args.postId))
            .collect();

        for (const like of likes) {
            await ctx.db.delete(like._id);
        }
    },
});
