"use client";

import { useState } from "react";
import GalleryGrid, { type Post } from "@/components/GalleryGrid";
import MediaModal from "@/components/MediaModal";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";


export default function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "mostLiked">("newest");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="pt-24">
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-md mx-auto px-6 h-20 flex justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-lg text-primary">
              Ala&apos;s 18th Birthday
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 leading-none">Party Feed 🥂</p>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-end min-w-0">
            <div className="relative max-w-[150px] w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-accent/50 border border-primary/10 rounded-full px-4 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-foreground/30"
              />
            </div>
            <div className="bg-white/50 dark:bg-neutral-900/50 p-1 rounded-full shadow-sm hover:scale-105 transition-transform border border-primary/10 flex-shrink-0">
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

      <GalleryGrid sortBy={sortBy} searchTerm={searchTerm} onPostClick={setSelectedPost} />

      <MediaModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
