"use client";

import { useState } from "react";
import GalleryGrid, { type Post } from "@/components/GalleryGrid";
import MediaModal from "@/components/MediaModal";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <div className="pt-12">
      <div className="px-6 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Party Feed</h1>
          <p className="text-foreground/60 mt-1">Memories from tonight 🥂</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-1 rounded-full shadow-sm hover:scale-105 transition-transform">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      <GalleryGrid onSelectPost={setSelectedPost} />

      <MediaModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
}
