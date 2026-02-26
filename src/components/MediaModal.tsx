"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Heart } from "lucide-react";
import type { Post } from "./GalleryGrid";
import { useState, useRef, useCallback } from "react";

export default function MediaModal({
    post,
    onClose
}: {
    post: Post;
    onClose: () => void;
}) {
    const [liked, setLiked] = useState(false);
    const [isPlayingLive, setIsPlayingLive] = useState(false);
    const liveVideoRef = useRef<HTMLVideoElement>(null);

    const isLivePhoto = post.mediaType === 'image' && !!post.livePhotoVideoUrl;

    const startLive = useCallback(() => {
        if (!liveVideoRef.current) return;
        liveVideoRef.current.currentTime = 0;
        liveVideoRef.current.play().catch(() => { });
        setIsPlayingLive(true);
    }, []);

    const stopLive = useCallback(() => {
        if (!liveVideoRef.current) return;
        liveVideoRef.current.pause();
        liveVideoRef.current.currentTime = 0;
        setIsPlayingLive(false);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col pt-safe-top"
        >
            {/* Backdrop Click */}
            <div className="absolute inset-0 z-0" onClick={onClose} />

            <div className="relative z-10 flex flex-col h-full">
                {/* Top Header */}
                <div className="flex justify-between items-center p-4">
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex gap-3 items-center">
                        {/* Live Photo button — top right */}
                        {isLivePhoto && (
                            <motion.button
                                onPointerDown={startLive}
                                onPointerUp={stopLive}
                                onPointerLeave={stopLive}
                                onClick={(e) => e.stopPropagation()}
                                whileTap={{ scale: 0.92 }}
                                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-2 rounded-full text-white border border-white/20 select-none"
                                title="Hold to play live photo"
                            >
                                <span className="relative flex h-2 w-2">
                                    <span className={`absolute inline-flex h-full w-full rounded-full bg-white opacity-60 ${isPlayingLive ? 'animate-ping' : ''}`}></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {isPlayingLive ? "Playing…" : "LIVE"}
                                </span>
                            </motion.button>
                        )}

                        {post.mediaUrl && (
                            <a
                                href={post.mediaUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"
                            >
                                <Download size={24} />
                            </a>
                        )}
                    </div>
                </div>

                {/* Media Content - Swipe to close */}
                <motion.div
                    className="flex-1 flex items-center justify-center p-4 relative"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(e, info) => {
                        if (Math.abs(info.offset.y) > 100) onClose();
                    }}
                >
                    {post.mediaType === 'video' ? (
                        <video
                            src={post.mediaUrl || ""}
                            className="max-h-[90vh] max-w-full rounded-xl shadow-2xl bg-black"
                            style={{ aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined }}
                            controls
                            autoPlay
                            playsInline
                        />
                    ) : (
                        <motion.div
                            layoutId={`media-${post._id}`}
                            className="w-full h-full flex items-center justify-center relative"
                        >
                            {/* Still image */}
                            <AnimatePresence>
                                {!isPlayingLive && (
                                    <motion.img
                                        key="still"
                                        src={post.mediaUrl || ""}
                                        alt={post.caption || "Full screen memory"}
                                        className="max-h-[90vh] max-w-full rounded-xl shadow-2xl object-contain absolute"
                                        style={{ aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined }}
                                        initial={{ opacity: 1 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        onError={(e) => {
                                            console.error("Modal image failed to load:", post.mediaUrl);
                                        }}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Live Photo video (hidden video element, shown when playing) */}
                            {isLivePhoto && (
                                <motion.video
                                    ref={liveVideoRef}
                                    key="live-video"
                                    src={post.livePhotoVideoUrl}
                                    className="max-h-[90vh] max-w-full rounded-xl shadow-2xl object-contain absolute"
                                    style={{ aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined }}
                                    playsInline
                                    muted={false}
                                    preload="auto"
                                    onEnded={stopLive}
                                    animate={{ opacity: isPlayingLive ? 1 : 0 }}
                                    transition={{ duration: 0.15 }}
                                />
                            )}
                        </motion.div>
                    )}
                </motion.div>


                {/* Bottom Details */}
                <div className="p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] text-white">
                    <div className="flex justify-between items-end">
                        <div className="flex-1 right-4">
                            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-1">{post.authorName}</p>
                            {post.caption ? (
                                <p className="font-sans text-lg">{post.caption}</p>
                            ) : (
                                <span className="opacity-50 italic">Shared a memory</span>
                            )}
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => setLiked(!liked)}
                            className="ml-4"
                        >
                            <Heart
                                size={32}
                                className={liked ? "fill-primary text-primary" : "text-white"}
                                strokeWidth={liked ? 0 : 2}
                            />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
