"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, AlertCircle, CheckCircle2, Lock, ImageIcon, Video } from "lucide-react";
import { useUploadDrawer } from "@/providers/UploadDrawerProvider";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import imageCompression from "browser-image-compression";
import confetti from "canvas-confetti";

type LivePair = { image: File; video: File };
type StandaloneFile = { file: File };
type UploadItem = { type: 'live'; pair: LivePair } | { type: 'standalone'; item: StandaloneFile };

const baseName = (f: File) => f.name.replace(/\.[^.]+$/, "").toLowerCase();

// ── Vault overlay shown during upload ──────────────────────────────────────
function VaultOverlay({ totalFiles, currentFile, overallProgress, fileProgress, stage }: {
    totalFiles: number;
    currentFile: number;
    overallProgress: number;
    fileProgress: number;
    stage: 'processing' | 'uploading';
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(24px)' }}
        >
            {/* Animated vault icon */}
            <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="mb-8 relative"
            >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center shadow-2xl shadow-[#C9A84C]/30">
                    <Lock size={40} className="text-white" strokeWidth={1.5} />
                </div>
                {/* glow ring */}
                <motion.div
                    className="absolute inset-0 rounded-3xl border-2 border-[#C9A84C]/60"
                    animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>

            <h2 className="text-white text-2xl font-serif font-bold mb-2">Sending to the Vault</h2>
            <p className="text-white/50 text-xs tracking-widest uppercase mb-10 px-10 text-center">
                {stage === 'processing'
                    ? 'Optimising for original quality · Do not close the app'
                    : 'Encrypted upload in progress · Do not close the app'}
            </p>

            {/* File progress */}
            <div className="w-72 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[#C9A84C] text-xs font-bold uppercase tracking-widest">
                        File {currentFile} of {totalFiles}
                    </span>
                    <span className="text-white/50 text-xs">{Math.round(fileProgress)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[#C9A84C] rounded-full"
                        animate={{ width: `${fileProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Overall progress */}
            <div className="w-72">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-white/40 text-[10px] uppercase tracking-widest">Overall</span>
                    <span className="text-white/40 text-[10px]">{Math.round(overallProgress)}%</span>
                </div>
                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-white/40 rounded-full"
                        animate={{ width: `${overallProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

// ── Main UploadDrawer ───────────────────────────────────────────────────────
export default function UploadDrawer() {
    const { isOpen, closeDrawer } = useUploadDrawer();
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const [isMounted, setIsMounted] = useState(false);
    const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
    const [caption, setCaption] = useState("");
    const [stage, setStage] = useState<'idle' | 'processing' | 'uploading' | 'success' | 'error'>('idle');
    const [fileProgress, setFileProgress] = useState(0);
    const [overallProgress, setOverallProgress] = useState(0);
    const [currentFileIdx, setCurrentFileIdx] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
    const sendPost = useMutation(api.posts.sendPost);

    useEffect(() => { setIsMounted(true); }, []);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setUploadItems([]);
                setCaption("");
                setStage('idle');
                setFileProgress(0);
                setOverallProgress(0);
                setCurrentFileIdx(0);
                setError(null);
            }, 400);
        }
    }, [isOpen]);

    if (!isMounted) return null;
    if (pathname === "/" || pathname === "/passcode") return null;

    const MAX_FILES = 10;
    const totalItems = uploadItems.length;
    const isUploading = stage === 'processing' || stage === 'uploading';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const selected = Array.from(e.target.files);

        const validTypes = [
            "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
            "video/mp4", "video/quicktime", "video/webm",
        ];
        const invalid = selected.filter(f => !validTypes.includes(f.type));
        if (invalid.length) { setError(`Unsupported format: ${invalid.map(f => f.name).join(', ')}`); return; }

        if (totalItems + selected.length > MAX_FILES) {
            setError(`Max ${MAX_FILES} files per upload. You have ${totalItems} already.`);
            return;
        }

        const images = selected.filter(f => f.type.startsWith("image/"));
        const videos = selected.filter(f => f.type.startsWith("video/"));

        const newItems: UploadItem[] = [];
        const usedImages = new Set<string>();
        const usedVideos = new Set<string>();

        for (const img of images) {
            const match = videos.find(v => baseName(v) === baseName(img));
            if (match) {
                newItems.push({ type: 'live', pair: { image: img, video: match } });
                usedImages.add(img.name);
                usedVideos.add(match.name);
            }
        }
        for (const f of selected) {
            if (!usedImages.has(f.name) && !usedVideos.has(f.name)) {
                newItems.push({ type: 'standalone', item: { file: f } });
            }
        }

        setUploadItems(prev => [...prev, ...newItems]);
        setError(null);
    };

    const getDimensions = (file: File): Promise<{ width?: number; height?: number }> =>
        new Promise((resolve) => {
            if (file.type.startsWith("image/")) {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.onerror = () => resolve({});
                img.src = URL.createObjectURL(file);
            } else if (file.type.startsWith("video/")) {
                const vid = document.createElement("video");
                vid.onloadedmetadata = () => resolve({ width: vid.videoWidth, height: vid.videoHeight });
                vid.onerror = () => resolve({});
                vid.src = URL.createObjectURL(file);
            } else resolve({});
        });

    const compressImage = async (file: File, onProgress: (p: number) => void) => {
        try {
            return await imageCompression(file, {
                maxSizeMB: 1.5,
                maxWidthOrHeight: 2160,
                useWebWorker: true,
                preserveExif: true,
                onProgress,
            });
        } catch { return file; }
    };

    const uploadFile = async (file: File): Promise<string> => {
        const url = await generateUploadUrl();
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
        });
        if (!res.ok) throw new Error(`Upload failed: ${file.name}`);
        const { storageId } = await res.json();
        return storageId;
    };

    const handleUpload = async () => {
        if (!totalItems || !user) return;
        setStage('processing');
        setError(null);

        try {
            for (let i = 0; i < uploadItems.length; i++) {
                const item = uploadItems[i];
                setCurrentFileIdx(i + 1);
                setFileProgress(0);
                setOverallProgress((i / uploadItems.length) * 100);

                if (item.type === 'live') {
                    const { image, video } = item.pair;
                    const dims = await getDimensions(image);

                    setStage('processing');
                    const compressed = await compressImage(image, (p) => setFileProgress(p * 0.5));

                    setStage('uploading');
                    const imageId = await uploadFile(compressed);
                    setFileProgress(70);

                    const videoId = await uploadFile(video);
                    setFileProgress(90);

                    await sendPost({
                        storageId: imageId as any,
                        livePhotoVideoId: videoId as any,
                        caption,
                        mediaType: "image",
                        authorName: user.fullName || user.username || "Party Guest",
                        ...dims,
                    });

                } else {
                    const { file } = item.item;
                    const dims = await getDimensions(file);

                    if (file.type.startsWith("image/")) {
                        setStage('processing');
                        const compressed = await compressImage(file, (p) => setFileProgress(p * 0.7));
                        setStage('uploading');
                        const storageId = await uploadFile(compressed);
                        setFileProgress(90);
                        await sendPost({
                            storageId: storageId as any,
                            caption,
                            mediaType: "image",
                            authorName: user.fullName || user.username || "Party Guest",
                            ...dims,
                        });
                    } else {
                        setStage('uploading');
                        const storageId = await uploadFile(file);
                        setFileProgress(90);
                        await sendPost({
                            storageId: storageId as any,
                            caption,
                            mediaType: "video",
                            authorName: user.fullName || user.username || "Party Guest",
                            ...dims,
                        });
                    }
                }

                setFileProgress(100);
                setOverallProgress(((i + 1) / uploadItems.length) * 100);
            }

            setStage('success');
            confetti({ particleCount: 120, spread: 65, origin: { y: 0.6 }, colors: ["#C9A84C", "#FDFBF7", "#D2B48C"] });
            setTimeout(() => { closeDrawer(); router.push("/photos"); }, 2200);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
            setStage('error');
        }
    };

    const firstPreview = uploadItems[0]
        ? uploadItems[0].type === 'live'
            ? URL.createObjectURL(uploadItems[0].pair.image)
            : URL.createObjectURL(uploadItems[0].item.file)
        : null;

    const hasLive = uploadItems.some(u => u.type === 'live');
    const liveCount = uploadItems.filter(u => u.type === 'live').length;
    const photoCount = uploadItems.filter(u => u.type === 'standalone' && u.item.file.type.startsWith('image/')).length;
    const videoCount = uploadItems.filter(u => u.type === 'standalone' && u.item.file.type.startsWith('video/')).length;

    return (
        <>
            {/* Vault overlay — above everything */}
            <AnimatePresence>
                {isUploading && (
                    <VaultOverlay
                        totalFiles={totalItems}
                        currentFile={currentFileIdx}
                        overallProgress={overallProgress}
                        fileProgress={fileProgress}
                        stage={stage as 'processing' | 'uploading'}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeDrawer}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />

                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 210 }}
                            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background rounded-t-[30px] shadow-2xl z-[101] flex flex-col max-h-[92vh]"
                        >
                            <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mt-4 mb-2" />

                            <div className="px-6 pb-10 pt-2 overflow-y-auto">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <h2 className="text-xl font-serif font-bold">New Memory</h2>
                                        <p className="text-[10px] text-foreground/40 uppercase tracking-widest mt-0.5">
                                            Live Photos supported · Up to {MAX_FILES} files
                                        </p>
                                    </div>
                                    <button onClick={closeDrawer} className="p-2 bg-foreground/5 rounded-full text-foreground/60">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* No files selected */}
                                {totalItems === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-primary/30 rounded-3xl bg-primary/5 h-60 flex flex-col items-center justify-center cursor-pointer mb-6 hover:bg-primary/10 transition-colors group"
                                    >
                                        <div className="bg-primary/20 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                            <UploadCloud size={30} className="text-primary" />
                                        </div>
                                        <p className="font-semibold text-foreground/80">Tap to select memories</p>
                                        <p className="text-xs text-foreground/40 mt-1 px-6 text-center">
                                            Select a photo + its matching video to share as a Live Photo
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                                        {/* Preview */}
                                        <div className="relative rounded-3xl overflow-hidden bg-black/5 min-h-[260px] max-h-[50vh] shadow-xl flex items-center justify-center border border-foreground/5">
                                            {firstPreview && (
                                                uploadItems[0].type === 'standalone' && uploadItems[0].item.file.type.startsWith('video/')
                                                    ? <video src={firstPreview} className="max-w-full max-h-[50vh] object-contain" muted autoPlay loop playsInline />
                                                    : <img src={firstPreview} className="max-w-full max-h-[50vh] object-contain" alt="Preview" />
                                            )}

                                            {/* Live badge on preview */}
                                            {hasLive && (
                                                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-60" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]" />
                                                    </span>
                                                    <span className="text-white text-[9px] font-black uppercase tracking-widest">
                                                        {liveCount} Live {liveCount === 1 ? 'Photo' : 'Photos'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Success state */}
                                            <AnimatePresence>
                                                {stage === 'success' && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                        className="absolute inset-0 bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center text-white"
                                                    >
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                                                            <CheckCircle2 size={72} className="mb-4" />
                                                        </motion.div>
                                                        <h3 className="text-2xl font-serif font-bold mb-1">Memories Saved!</h3>
                                                        <p className="opacity-80 text-sm">Redirecting to gallery…</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* File summary chips */}
                                        <div className="flex flex-wrap gap-2">
                                            {liveCount > 0 && (
                                                <div className="flex items-center gap-1 bg-[#C9A84C]/15 border border-[#C9A84C]/30 px-2.5 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                                                    <span className="text-[10px] font-bold text-[#8B6914] dark:text-[#C9A84C] uppercase tracking-wider">{liveCount} Live</span>
                                                </div>
                                            )}
                                            {photoCount > 0 && (
                                                <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                                                    <ImageIcon size={10} className="text-primary" />
                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{photoCount} Photo{photoCount > 1 ? 's' : ''}</span>
                                                </div>
                                            )}
                                            {videoCount > 0 && (
                                                <div className="flex items-center gap-1 bg-foreground/5 border border-foreground/10 px-2.5 py-1 rounded-full">
                                                    <Video size={10} className="text-foreground/60" />
                                                    <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-wider">{videoCount} Video{videoCount > 1 ? 's' : ''}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[10px] font-bold text-primary/70 border border-primary/20 px-2.5 py-1 rounded-full"
                                            >
                                                + Add more
                                            </button>
                                        </div>

                                        {/* Caption + upload button */}
                                        {stage !== 'success' && (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={caption}
                                                    onChange={(e) => setCaption(e.target.value)}
                                                    placeholder="Add a caption… (optional)"
                                                    className="w-full bg-foreground/5 border border-foreground/10 py-3 px-4 rounded-2xl resize-none h-20 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />

                                                <SignedOut>
                                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-5 rounded-2xl text-center">
                                                        <p className="text-amber-800 dark:text-amber-200 text-sm mb-3">Sign in to share this memory!</p>
                                                        <SignInButton mode="modal">
                                                            <button className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl">Sign In</button>
                                                        </SignInButton>
                                                    </div>
                                                </SignedOut>

                                                <SignedIn>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                                        onClick={handleUpload}
                                                        className="w-full font-bold py-4 rounded-2xl shadow-lg flex justify-center items-center gap-2 text-white"
                                                        style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}
                                                    >
                                                        <Lock size={16} />
                                                        Send to the Vault
                                                    </motion.button>
                                                </SignedIn>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {error && (
                                    <div className="mt-4 bg-red-50 text-red-500 p-4 rounded-2xl text-sm flex gap-3 border border-red-100 dark:bg-red-950/30 dark:border-red-900/50">
                                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*,video/*,.heic,.heif"
                multiple
                onChange={handleFileChange}
            />
        </>
    );
}
