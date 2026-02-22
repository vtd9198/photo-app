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
    <div className="pt-24">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-md mx-auto px-6 h-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground leading-tight">Party Feed</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Memories 🥂</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/50 dark:bg-neutral-900/50 p-1 rounded-full shadow-sm hover:scale-105 transition-transform border border-primary/10">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Sorting Toggle */}
      <div className="px-6 mb-6 flex justify-center">
        <div className="bg-accent/50 p-1 rounded-full flex gap-1 border border-primary/10 shadow-inner">
          <button
            onClick={() => setSortBy("newest")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
              sortBy === "newest"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy("mostLiked")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
              sortBy === "mostLiked"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            )}
          >
            Most Liked
          </button>
        </div>
      </div>

      <GalleryGrid sortBy={sortBy} />
    </div>
  );
}
