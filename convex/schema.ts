import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    authorName: v.string(),
    caption: v.optional(v.string()),
    createdAt: v.float64(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    storageId: v.id("_storage"),
    livePhotoVideoId: v.optional(v.id("_storage")),
    userId: v.optional(v.id("users")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
  
  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  }).index("by_postId", ["postId"]).index("by_userId_postId", ["userId", "postId"]),

  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    profileImage: v.string(),
  }).index("by_externalId", ["externalId"]),
});
