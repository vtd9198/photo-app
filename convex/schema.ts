import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    posts: defineTable({
        storageId: v.id("_storage"),
        authorName: v.string(),
        caption: v.optional(v.string()),
        mediaType: v.union(v.literal("image"), v.literal("video")),
        createdAt: v.number(), // timestamp
    }),
});
