import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        externalId: v.string(), // Clerk's ID
        name: v.string(),
        profileImage: v.string(),
    }).index("by_externalId", ["externalId"]),
    posts: defineTable({
        storageId: v.id("_storage"),
        userId: v.optional(v.id("users")),
        authorName: v.string(),
        caption: v.optional(v.string()),
        mediaType: v.union(v.literal("image"), v.literal("video")),
        createdAt: v.number(), // timestamp
    }).index("by_userId", ["userId"]),

    likes: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
    })
        .index("by_postId", ["postId"])
        .index("by_userId_postId", ["userId", "postId"]),
});
