"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export type Post = {
    _id: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'video';
    caption?: string;
    authorName: string;
    createdAt: number;
};

export default function GalleryGrid({ onSelectPost }: { onSelectPost: (post: any) => void }) {
    const posts = useQuery(api.posts.listPosts);

    if (posts === undefined) {
        return (
            <div className="flex flex-col gap-4 px-6 animate-pulse">
                <div className="w-full h-48 bg-primary/10 rounded-2xl" />
                <div className="w-full h-64 bg-primary/10 rounded-2xl" />
                <div className="w-full h-40 bg-primary/10 rounded-2xl" />
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Play size={32} className="text-primary rotate-90" />
                </div>
                <h3 className="font-semibold text-lg">No memories yet</h3>
                <p className="text-foreground/50 text-sm">Be the first to share a moment from the party!</p>
            </div>
        );
    }

    return (
        <div className="columns-2 gap-4 px-6 pb-6 space-y-4">
            {posts.map((post, index) => (
                <motion.div
                    key={post._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="relative rounded-2xl overflow-hidden cursor-pointer shadow-sm bg-neutral-100 dark:bg-neutral-800 break-inside-avoid"
                    onClick={() => onSelectPost(post)}
                >
                    {post.mediaType === 'video' ? (
                        <div className="relative">
                            <video
                                src={post.mediaUrl || ""}
                                className="w-full object-cover aspect-auto"
                                muted
                                playsInline
                                preload="metadata"
                            />
                            <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full z-10">
                                <Play size={14} className="text-white ml-0.5" />
                            </div>
                        </div>
                    ) : (
                        <img
                            src={post.mediaUrl || ""}
                            alt={post.caption || "Party memory"}
                            className="w-full h-auto object-cover"
                            loading="lazy"
                        />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                        <p className="text-white text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">
                            {post.authorName}
                        </p>
                        {post.caption && (
                            <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-md">
                                {post.caption}
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

