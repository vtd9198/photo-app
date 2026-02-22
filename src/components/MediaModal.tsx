"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Heart } from "lucide-react";
import type { Post } from "./GalleryGrid";
import { useState } from "react";

export default function MediaModal({
    post,
    onClose
}: {
    post: Post | null;
    onClose: () => void
}) {
    const [liked, setLiked] = useState(false);

    if (!post) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col pt-safe-top"
            >
                {/* Top Header */}
                <div className="flex justify-between items-center p-4">
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex gap-3">
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
                            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl bg-black"
                            style={{ aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined }}
                            controls
                            autoPlay
                            playsInline
                        />
                    ) : (
                        <motion.div
                            layoutId={`media-${post._id}`}
                            className="w-full h-full flex items-center justify-center"
                        >
                            <img
                                src={post.mediaUrl || ""}
                                alt={post.caption || "Full screen memory"}
                                className="max-h-[85vh] max-w-full rounded-xl shadow-2xl object-contain"
                                style={{ aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined }}
                                onError={(e) => {
                                    console.error("Modal image failed to load:", post.mediaUrl);
                                }}
                            />
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
            </motion.div>
        </AnimatePresence>
    );
}
