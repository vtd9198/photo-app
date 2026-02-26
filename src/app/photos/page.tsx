"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GalleryGrid, { type Post } from "@/components/GalleryGrid";
import MediaModal from "@/components/MediaModal";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { CheckSquare, X, Download, Package, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type ZipStage = 'idle' | 'packing' | 'done';

export default function PhotosPage() {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [sortBy, setSortBy] = useState<"newest" | "mostLiked">("newest");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [allPosts, setAllPosts] = useState<Post[]>([]);
    const [zipStage, setZipStage] = useState<ZipStage>('idle');

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds([]);
    };

    const handlePostClick = useCallback((post: Post) => {
        if (!selectMode) setSelectedPost(post);
    }, [selectMode]);

    const downloadSelected = async () => {
        const selected = allPosts.filter(p => selectedIds.includes(p._id));
        if (!selected.length) return;

        setZipStage('packing');
        const zip = new JSZip();
        const folder = zip.folder("Ala-18th-Birthday-Memories")!;
        const abortController = new AbortController();

        try {
            let fileIndex = 1;
            for (const post of selected) {
                try {
                    // Main file
                    if (post.mediaUrl) {
                        const res = await fetch(post.mediaUrl, { signal: abortController.signal });
                        const blob = await res.blob();
                        const ext = post.mediaType === 'video' ? 'mp4' : 'jpg';
                        const name = `${fileIndex.toString().padStart(3, '0')}_${post.authorName.replace(/\s+/g, '_')}.${ext}`;
                        folder.file(name, blob);
                    }
                    // Live photo video companion
                    if (post.livePhotoVideoUrl) {
                        const res = await fetch(post.livePhotoVideoUrl, { signal: abortController.signal });
                        const blob = await res.blob();
                        const name = `${fileIndex.toString().padStart(3, '0')}_${post.authorName.replace(/\s+/g, '_')}_LIVE.mov`;
                        folder.file(name, blob);
                    }
                    fileIndex++;
                } catch {
                    // Skip un-fetchable files gracefully
                }
            }

            const content = await zip.generateAsync({ type: "blob", compression: "STORE" });
            saveAs(content, "Ala-18th-Birthday-Memories.zip");
            setZipStage('done');
            setTimeout(() => setZipStage('idle'), 3000);
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                console.error("ZIP download error:", err);
            }
            setZipStage('idle');
        }
    };

    return (
        <div className="pt-24">
            {/* ── Top header ── */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10">
                <div className="max-w-md mx-auto px-4 h-20 flex items-center gap-3">
                    <h1 className="font-playfair font-bold text-lg text-primary shrink-0">
                        Ala&apos;s 18th
                    </h1>

                    <div className="flex-1 min-w-0">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-accent/50 border border-primary/10 rounded-full px-4 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-foreground/30"
                            />
                        </div>
                    </div>

                    {/* Select button */}
                    <button
                        onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all shrink-0",
                            selectMode
                                ? "bg-foreground text-background border-foreground"
                                : "bg-background border-primary/20 text-foreground/60 hover:text-foreground"
                        )}
                    >
                        {selectMode ? <X size={13} /> : <CheckSquare size={13} />}
                        {selectMode ? "Cancel" : "Select"}
                    </button>

                    <div className="bg-white/50 dark:bg-neutral-900/50 p-1 rounded-full shadow-sm border border-primary/10 shrink-0">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* ── Sort bar ── */}
            <div className="px-6 mb-6 flex justify-center">
                <div className="bg-accent/50 p-1 rounded-full flex gap-1 border border-primary/10 shadow-inner">
                    <button
                        onClick={() => setSortBy("newest")}
                        className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                            sortBy === "newest" ? "bg-primary text-white shadow-sm" : "text-foreground/60")}
                    >Newest</button>
                    <button
                        onClick={() => setSortBy("mostLiked")}
                        className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                            sortBy === "mostLiked" ? "bg-primary text-white shadow-sm" : "text-foreground/60")}
                    >Most Liked</button>
                </div>
            </div>

            {/* ── Gallery ── */}
            <GalleryGrid
                sortBy={sortBy}
                searchTerm={searchTerm}
                onPostClick={handlePostClick}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onSelectToggle={toggleSelect}
            />

            {/* ── Select mode bottom bar ── */}
            <AnimatePresence>
                {selectMode && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                        className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-4 z-50"
                    >
                        <div className="bg-background/90 backdrop-blur-xl border border-primary/10 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="font-bold text-sm text-foreground">
                                    {selectedIds.length === 0 ? "Tap to select" : `${selectedIds.length} selected`}
                                </p>
                                {selectedIds.length > 0 && (
                                    <p className="text-[10px] text-foreground/40 mt-0.5">
                                        Includes original quality + Live Photo videos
                                    </p>
                                )}
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={downloadSelected}
                                disabled={selectedIds.length === 0 || zipStage === 'packing'}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all",
                                    selectedIds.length === 0
                                        ? "opacity-30 cursor-not-allowed bg-foreground"
                                        : "shadow-lg"
                                )}
                                style={selectedIds.length > 0 ? { background: 'linear-gradient(135deg, #C9A84C, #8B6914)' } : {}}
                            >
                                {zipStage === 'packing' ? (
                                    <><Loader2 size={16} className="animate-spin" /> Packing…</>
                                ) : zipStage === 'done' ? (
                                    <><Package size={16} /> Done!</>
                                ) : (
                                    <><Download size={16} /> Download ZIP</>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Packing overlay */}
            <AnimatePresence>
                {zipStage === 'packing' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex flex-col items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="mb-6"
                        >
                            <Package size={56} className="text-[#C9A84C]" />
                        </motion.div>
                        <h2 className="text-white text-xl font-serif font-bold mb-2">Packing your memories…</h2>
                        <p className="text-white/40 text-xs tracking-widest uppercase">
                            Bundling {selectedIds.length} {selectedIds.length === 1 ? 'file' : 'files'} into ZIP
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Media Modal ── */}
            <AnimatePresence>
                {selectedPost && (
                    <MediaModal post={selectedPost} onClose={() => setSelectedPost(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
