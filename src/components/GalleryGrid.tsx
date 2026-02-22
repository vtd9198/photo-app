"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart, AlertCircle, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export type Post = {
    _id: string;
    mediaUrl: string | null;
    mediaType: 'image' | 'video';
    caption?: string;
    authorName: string;
    createdAt: number;
    likeCount?: number;
    isLikedByMe?: boolean;
    isAuthor?: boolean;
    width?: number;
    height?: number;
};

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
    posts: initialPosts,
    sortBy = "newest",
    searchTerm,
    onPostClick
}: {
    posts?: Post[];
    sortBy?: "newest" | "mostLiked";
    searchTerm?: string;
    onPostClick?: (post: Post) => void;
}) {
    const fetchedPosts = useQuery(api.posts.listPosts, { sortBy, searchTerm }) as Post[] | undefined;
    const toggleLike = useMutation(api.posts.toggleLike);
    const deletePost = useMutation(api.posts.deletePost);
    const posts = (initialPosts !== undefined ? initialPosts : fetchedPosts) as Post[] | undefined;

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


    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-8 px-4 pb-20 max-w-2xl mx-auto"
        >
            {posts.map((post, index) => (
                <motion.div
                    key={post._id}
                    layout
                    variants={itemVariants}
                    className="relative rounded-3xl overflow-hidden flex flex-col group cursor-zoom-in"
                    onClick={() => onPostClick?.(post)}
                >
                    <div className="relative overflow-hidden">
                        {post.mediaType === 'video' ? (
                            <div
                                className="relative w-full flex items-center justify-center overflow-hidden"
                                style={{
                                    aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined,
                                    maxHeight: '80vh',
                                }}
                            >
                                <video
                                    src={post.mediaUrl || ""}
                                    className="w-full h-full object-contain shadow-2xl"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    preload="auto"
                                />
                                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full z-10 text-white">
                                    <Play size={18} className="ml-0.5 fill-current" />
                                </div>
                            </div>
                        ) : (
                            <div
                                className="relative w-full flex items-center justify-center overflow-hidden"
                                style={{
                                    aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined,
                                    maxHeight: '85vh',
                                }}
                            >
                                {post.mediaUrl ? (
                                    <img
                                        src={post.mediaUrl}
                                        alt={post.caption || "Party memory"}
                                        className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-700 group-hover:scale-[1.01] shadow-2xl"
                                        loading="lazy"
                                        onLoad={(e) => {
                                            const img = e.currentTarget;
                                            if (img.naturalWidth && img.naturalHeight && (!post.width || !post.height)) {
                                                console.log("Measured dimensions:", img.naturalWidth, img.naturalHeight);
                                            }
                                        }}
                                        onError={(e) => {
                                            console.error("Image failed to load:", post.mediaUrl);
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                        }}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-20 text-foreground/20">
                                        <AlertCircle size={48} />
                                        <p className="mt-2 text-sm font-medium">Image unavailable</p>
                                    </div>
                                )}
                                <div className="image-fallback hidden absolute inset-0 flex-col items-center justify-center p-20 text-foreground/20">
                                    <AlertCircle size={48} />
                                    <p className="mt-2 text-sm font-medium">Failed to load memory</p>
                                </div>
                            </div>
                        )}

                        {/* Author Badge */}
                        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <p className="text-white text-[10px] font-bold uppercase tracking-wider">
                                {post.authorName}
                            </p>
                        </div>
                    </div>

                    {/* Bottom Info Row */}
                    <div className="p-3 bg-white dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                                <SignedIn>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLike({ postId: post._id as any });
                                        }}
                                        className="transition-transform active:scale-125 duration-200"
                                    >
                                        <Heart
                                            size={20}
                                            className={cn(
                                                post.isLikedByMe ? "text-red-500 fill-red-500" : "text-foreground/40"
                                            )}
                                        />
                                    </button>
                                </SignedIn>
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button
                                            className="text-foreground/40"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Heart size={20} />
                                        </button>
                                    </SignInButton>
                                </SignedOut>

                                <span className="text-sm font-bold text-foreground">
                                    {post.likeCount || 0}
                                </span>
                            </div>

                            {post.isAuthor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Are you sure you want to delete this memory?")) {
                                            deletePost({ postId: post._id as any });
                                        }
                                    }}
                                    className="p-1.5 text-foreground/30 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {post.caption && (
                            <p className="text-[11px] text-foreground/70 line-clamp-2 leading-tight">
                                {post.caption}
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}


