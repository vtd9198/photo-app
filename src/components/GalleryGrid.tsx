"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Heart, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useRef, useState, useCallback } from "react";

export type Post = {
    _id: string;
    mediaUrl: string | null;
    livePhotoVideoUrl?: string | null;
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

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 1.02, 0.47, 0.98] as const } },
};

// ─── Live Photo thumbnail card ───────────────────────────────────────────────
function LivePhotoCard({ post, isSelected, selectMode, onSelect, onOpen }: {
    post: Post;
    isSelected: boolean;
    selectMode: boolean;
    onSelect: (id: string) => void;
    onOpen: (post: Post) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [liveActive, setLiveActive] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const playLive = useCallback(() => {
        if (!videoRef.current || !post.livePhotoVideoUrl) return;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => { });
        setIsPlaying(true);
        setLiveActive(true);
    }, [post.livePhotoVideoUrl]);

    const stopLive = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
        setLiveActive(false);
    }, []);

    const handlePointerDown = useCallback(() => {
        if (selectMode) return;
        longPressTimer.current = setTimeout(playLive, 200);
    }, [selectMode, playLive]);

    const handlePointerUp = useCallback(() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        stopLive();
    }, [stopLive]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectMode) {
            onSelect(post._id);
        } else {
            onOpen(post);
        }
    }, [selectMode, onSelect, onOpen, post]);

    return (
        <div
            className="relative overflow-hidden rounded-none cursor-pointer select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={handleClick}
            style={{
                aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined,
                maxHeight: '85vh',
            }}
        >
            {/* Still image */}
            <img
                src={post.mediaUrl || ""}
                alt={post.caption || "Party memory"}
                className="w-full h-full object-contain"
                loading="lazy"
                draggable={false}
            />

            {/* Live Photo video overlay */}
            {post.livePhotoVideoUrl && (
                <video
                    ref={videoRef}
                    src={post.livePhotoVideoUrl}
                    className="absolute inset-0 w-full h-full object-contain transition-opacity duration-150"
                    style={{ opacity: isPlaying ? 1 : 0 }}
                    playsInline
                    muted
                    preload="metadata"
                    onEnded={stopLive}
                />
            )}

            {/* Author badge */}
            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none">
                <p className="text-white text-[9px] font-bold uppercase tracking-wider">{post.authorName}</p>
            </div>

            {/* LIVE badge */}
            {post.livePhotoVideoUrl && (
                <div className={cn(
                    "absolute top-3 right-3 flex items-center gap-1 backdrop-blur-md px-2 py-1 rounded-full border pointer-events-none transition-all duration-200",
                    liveActive ? "bg-white/90 border-white" : "bg-black/50 border-white/10"
                )}>
                    <span className="relative flex h-1.5 w-1.5">
                        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", liveActive ? "bg-black animate-ping" : "bg-white")} />
                        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", liveActive ? "bg-black" : "bg-white")} />
                    </span>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest", liveActive ? "text-black" : "text-white")}>LIVE</span>
                </div>
            )}

            {/* Select mode overlay */}
            <AnimatePresence>
                {selectMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        {isSelected && (
                            <div className="absolute inset-0 bg-gold/20 border-[3px] border-gold" />
                        )}
                        <div className={cn(
                            "absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center",
                            isSelected ? "bg-gold border-gold" : "bg-black/30 border-white/60"
                        )}>
                            {isSelected && <CheckCircle2 size={16} className="text-white fill-white" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main GalleryGrid ────────────────────────────────────────────────────────
export default function GalleryGrid({
    posts: initialPosts,
    sortBy = "newest",
    searchTerm = "",
    onPostClick,
    selectMode = false,
    selectedIds = [],
    onSelectToggle,
}: {
    posts?: Post[];
    sortBy?: "newest" | "mostLiked";
    searchTerm?: string;
    onPostClick?: (post: Post) => void;
    selectMode?: boolean;
    selectedIds?: string[];
    onSelectToggle?: (id: string) => void;
}) {
    const fetchedPosts = useQuery(api.posts.listPosts, { sortBy, searchTerm }) as Post[] | undefined;
    const toggleLike = useMutation(api.posts.toggleLike);
    const deletePost = useMutation(api.posts.deletePost);
    const posts = initialPosts !== undefined ? initialPosts : fetchedPosts;

    if (posts === undefined) {
        return (
            <div className="flex flex-col gap-6 px-4 pb-20 max-w-2xl mx-auto">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="w-full bg-primary/10 rounded-2xl animate-pulse"
                        style={{ height: i % 2 === 0 ? '260px' : '340px' }}
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
            {posts.map((post) => (
                <motion.div
                    key={post._id}
                    layout
                    variants={itemVariants}
                    className="relative rounded-3xl overflow-hidden flex flex-col group shadow-lg"
                >
                    <div className="relative overflow-hidden">
                        {post.mediaType === 'video' ? (
                            /* ── regular video ── */
                            <div
                                className={cn(
                                    "relative w-full flex items-center justify-center overflow-hidden cursor-pointer",
                                    selectMode && "cursor-default"
                                )}
                                style={{
                                    aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined,
                                    maxHeight: '80vh',
                                }}
                                onClick={() => selectMode ? onSelectToggle?.(post._id) : onPostClick?.(post)}
                            >
                                <video
                                    src={post.mediaUrl || ""}
                                    className={cn("w-full h-full object-contain", selectMode && "pointer-events-none")}
                                    autoPlay muted loop playsInline preload="auto"
                                />
                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-full z-10 text-white pointer-events-none">
                                    <Play size={16} className="ml-0.5 fill-current" />
                                </div>
                                <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 pointer-events-none">
                                    <p className="text-white text-[9px] font-bold uppercase tracking-wider">{post.authorName}</p>
                                </div>

                                {/* Select overlay for video */}
                                <AnimatePresence>
                                    {selectMode && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="absolute inset-0 pointer-events-none">
                                            {selectedIds.includes(post._id) && <div className="absolute inset-0 bg-gold/20 border-[3px] border-gold" />}
                                            <div className={cn("absolute top-3 right-10 w-7 h-7 rounded-full border-2 flex items-center justify-center",
                                                selectedIds.includes(post._id) ? "bg-gold border-gold" : "bg-black/30 border-white/60")}>
                                                {selectedIds.includes(post._id) && <CheckCircle2 size={16} className="text-white fill-white" />}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            /* ── image / live photo ── */
                            <LivePhotoCard
                                post={post}
                                isSelected={selectedIds.includes(post._id)}
                                selectMode={selectMode}
                                onSelect={(id) => onSelectToggle?.(id)}
                                onOpen={(p) => onPostClick?.(p)}
                            />
                        )}

                        {/* Fallback error */}
                        {post.mediaType === 'image' && !post.mediaUrl && (
                            <div className="flex flex-col items-center justify-center p-20 text-foreground/20">
                                <AlertCircle size={48} />
                                <p className="mt-2 text-sm font-medium">Image unavailable</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Info Row */}
                    <div className="p-3 bg-white dark:bg-neutral-900">
                        <div className="flex items-center justify-between mb-1 text-foreground">
                            <div className="flex items-center gap-1.5">
                                <SignedIn>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleLike({ postId: post._id as any }); }}
                                        className="transition-transform active:scale-125 duration-200"
                                    >
                                        <Heart
                                            size={20}
                                            className={cn(post.isLikedByMe ? "text-red-500 fill-red-500" : "text-foreground/40")}
                                        />
                                    </button>
                                </SignedIn>
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button onClick={(e) => e.stopPropagation()} className="text-foreground/40">
                                            <Heart size={20} />
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                                <span className="text-sm font-bold">{post.likeCount || 0}</span>
                            </div>

                            {post.isAuthor && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this memory?")) deletePost({ postId: post._id as any });
                                    }}
                                    className="p-1.5 text-foreground/30 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {post.caption && (
                            <p className="text-[11px] text-foreground/70 line-clamp-2 leading-tight">{post.caption}</p>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
