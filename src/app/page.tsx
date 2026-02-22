"use client";

import { useState } from "react";
import GalleryGrid, { type Post } from "@/components/GalleryGrid";
import MediaModal from "@/components/MediaModal";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "mostLiked">("newest");

  return (
    <div className="pt-12 min-h-screen">
      <div className="px-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Party Feed</h1>
          <p className="text-foreground/60 mt-1 font-medium">Memories from tonight 🥂</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-1 rounded-full shadow-sm hover:scale-105 transition-transform border border-foreground/5">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Sorting Toggle */}
      <div className="px-6 mb-8 flex gap-2">
        <button
          onClick={() => setSortBy("newest")}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider uppercase",
            sortBy === "newest"
              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
              : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
          )}
        >
          Newest
        </button>
        <button
          onClick={() => setSortBy("mostLiked")}
          className={cn(
            "px-6 py-2.5 rounded-full text-xs font-bold transition-all duration-300 tracking-wider uppercase",
            sortBy === "mostLiked"
              ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
              : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
          )}
        >
          Popular
        </button>
      </div>

      <GalleryGrid onSelectPost={setSelectedPost} sortBy={sortBy} />

      <MediaModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
