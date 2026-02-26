"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Heart, Play } from "lucide-react";
import type { Post } from "./GalleryGrid";
import { useState, useRef, useCallback, useEffect } from "react";

export default function MediaModal({ post, onClose }: { post: Post; onClose: () => void; }) {
    const [liked, setLiked] = useState(false);
    const [isPlayingLive, setIsPlayingLive] = useState(false);
    const liveVideoRef = useRef<HTMLVideoElement>(null);

    const isLivePhoto = post.mediaType === 'image' && !!post.livePhotoVideoUrl;

    const playLive = useCallback(() => {
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
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
        >
            {/* Backdrop tap to close */}
            <div className="absolute inset-0 z-0" onClick={onClose} />

            <div className="relative z-10 flex flex-col h-full">
                {/* ── Top bar ── */}
                <div className="flex justify-between items-center px-4 py-3">
                    <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white">
                        <X size={22} />
                    </button>

                    <div className="flex gap-2 items-center">
                        {/* Play Live button */}
                        {isLivePhoto && !isPlayingLive && (
                            <motion.button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playLive();
                                }}
                                whileTap={{ scale: 0.9 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 text-white hover:bg-white/30 transition-colors"
                            >
                                <Play size={14} fill="white" />
                                <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                            </motion.button>
                        )}

                        {/* Download button */}
                        {post.mediaUrl && (
                            <a
                                href={post.mediaUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Download size={22} />
                            </a>
                        )}
                    </div>
                </div>

                {/* ── Media area ── */}
                <motion.div
                    className="flex-1 flex items-center justify-center px-4 relative"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(_, info) => { if (Math.abs(info.offset.y) > 100) onClose(); }}
                >
                    {post.mediaType === 'video' ? (
                        <video
                            src={post.mediaUrl || ""}
                            className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl bg-black"
                            style={{ aspectRatio: post.width && post.height ? `${post.width}/${post.height}` : undefined }}
                            controls autoPlay playsInline
                        />
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Still image */}
                            <motion.img
                                layoutId={`media-${post._id}`}
                                src={post.mediaUrl || ""}
                                alt={post.caption || "Memory"}
                                className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain"
                                style={{
                                    aspectRatio: post.width && post.height ? `${post.width}/${post.height}` : undefined,
                                    opacity: isPlayingLive ? 0 : 1,
                                    transition: 'opacity 0.3s ease',
                                }}
                                draggable={false}
                            />

                            {/* Live video — appears when playing */}
                            {isLivePhoto && (
                                <motion.video
                                    ref={liveVideoRef}
                                    src={post.livePhotoVideoUrl}
                                    className="absolute inset-0 m-auto max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain"
                                    initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                    animate={isPlayingLive 
                                        ? { opacity: 1, scale: 1, filter: "blur(0px)" } 
                                        : { opacity: 0, scale: 1.05, filter: "blur(10px)" }
                                    }
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        pointerEvents: 'none',
                                    }}
                                    playsInline
                                    preload="auto"
                                    onEnded={stopLive}
                                />
                            )}

                            {/* Iris ripple on play-start */}
                            <AnimatePresence>
                                {isPlayingLive && (
                                    <motion.div
                                        key="iris"
                                        className="absolute inset-0 m-auto rounded-2xl pointer-events-none"
                                        initial={{ boxShadow: 'inset 0 0 0 80px rgba(255,255,255,0.12)' }}
                                        animate={{ boxShadow: 'inset 0 0 0 0px rgba(255,255,255,0)' }}
                                        exit={{ boxShadow: 'inset 0 0 0 0px rgba(255,255,255,0)' }}
                                        transition={{ duration: 0.4, ease: 'easeOut' }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </motion.div>

                {/* ── Bottom details ── */}
                <div className="px-6 pb-8 pt-4 text-white">
                    <div className="flex justify-between items-end">
                        <div className="flex-1">
                            <p className="text-primary font-bold text-sm uppercase tracking-widest mb-1">
                                {post.authorName}
                            </p>
                            {post.caption
                                ? <p className="font-sans text-base">{post.caption}</p>
                                : <span className="opacity-40 italic text-sm">Shared a memory</span>
                            }
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.75 }}
                            onClick={() => setLiked(!liked)}
                            className="ml-4 p-2"
                        >
                            <Heart
                                size={30}
                                className={liked ? "fill-red-500 text-red-500" : "text-white"}
                                strokeWidth={liked ? 0 : 1.5}
                            />
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
