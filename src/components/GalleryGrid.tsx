"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type Post = {
    _id: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'video';
    caption?: string;
    authorName: string;
    createdAt: number;
    likeCount?: number;
};

// Beige placeholder for blur-up effect
const BEIGE_BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.21, 1.02, 0.47, 0.98] as const,
        },
    },
};

export default function GalleryGrid({
    onSelectPost,
    sortBy = "newest"
}: {
    onSelectPost: (post: Post) => void;
    sortBy?: "newest" | "mostLiked";
}) {
    const posts = useQuery(api.posts.listPosts, { sortBy });

    if (posts === undefined) {
        return (
            <div className="columns-2 md:columns-3 gap-4 px-6 pb-6 space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="w-full bg-primary/10 rounded-2xl animate-pulse break-inside-avoid"
                        style={{ height: i % 2 === 0 ? '240px' : '320px' }}
                    />
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Play size={32} className="text-primary rotate-90" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">No memories yet</h3>
                <p className="text-foreground/50 text-sm">Be the first to share a moment from the party!</p>
            </div>
        );
    }

    // Helper to get consistent aspect ratio based on post ID
    const getAspectRatioClass = (id: string) => {
        const charCodeSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const mod = charCodeSum % 3;
        if (mod === 0) return "aspect-[3/4]";
        if (mod === 1) return "aspect-square";
        return "aspect-[4/5]";
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="columns-2 md:columns-3 gap-4 px-6 pb-6 space-y-4"
        >
            {posts.map((post, index) => (
                <motion.div
                    key={post._id}
                    layout
                    variants={itemVariants}
                    className="relative rounded-2xl overflow-hidden cursor-pointer shadow-sm bg-neutral-100 dark:bg-neutral-800 break-inside-avoid group"
                    onClick={() => onSelectPost(post)}
                >
                    {post.mediaType === 'video' ? (
                        <div className={cn("relative w-full", getAspectRatioClass(post._id))}>
                            <video
                                src={post.mediaUrl || ""}
                                className="absolute inset-0 w-full h-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                            />
                            <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-1.5 rounded-full z-10">
                                <Play size={14} className="text-white ml-0.5" />
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "relative w-full overflow-hidden",
                            getAspectRatioClass(post._id)
                        )}>
                            <motion.div
                                layoutId={`media-${post._id}`}
                                className="w-full h-full"
                            >
                                <Image
                                    src={post.mediaUrl || ""}
                                    alt={post.caption || "Party memory"}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    placeholder="blur"
                                    blurDataURL={BEIGE_BLUR_DATA_URL}
                                    priority={index < 4}
                                />
                            </motion.div>
                        </div>
                    )}

                    {/* Overlay with info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <p className="text-white text-[10px] font-bold opacity-90 uppercase tracking-widest mb-1">
                            {post.authorName}
                        </p>
                        {post.caption && (
                            <p className="text-white text-xs font-medium line-clamp-2 drop-shadow-sm">
                                {post.caption}
                            </p>
                        )}
                        {post.likeCount !== undefined && post.likeCount > 0 && (
                            <div className="mt-2 flex items-center gap-1">
                                <span className="text-white/80 text-[10px] font-bold">{post.likeCount} likes</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
