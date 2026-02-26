"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUploadDrawer } from "@/providers/UploadDrawerProvider";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import imageCompression from "browser-image-compression";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import confetti from "canvas-confetti";

// A Live Photo pair: the still image + its matching .mov video
type LivePhotoPair = {
    image: File;
    video: File;
};

// Strip extension and lowercase, to detect pairs
const baseName = (f: File) => f.name.replace(/\.[^.]+$/, "").toLowerCase();

export default function UploadDrawer() {
    const { isOpen, closeDrawer } = useUploadDrawer();
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    if (pathname === "/" || pathname === "/passcode") return null;

    const [isMounted, setIsMounted] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previewURLs, setPreviewURLs] = useState<string[]>([]);
    const [caption, setCaption] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [livePhotoPairs, setLivePhotoPairs] = useState<LivePhotoPair[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
    const sendPost = useMutation(api.posts.sendPost);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setFiles([]);
                setPreviewURLs([]);
                setCaption("");
                setIsProcessing(false);
                setIsUploading(false);
                setProgress(0);
                setError(null);
                setIsSuccess(false);
                setLivePhotoPairs([]);
            }, 300);
        }
    }, [isOpen]);

    if (!isMounted) return null;
    if (pathname === "/" || pathname === "/passcode") return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = Array.from(e.target.files);

            const validTypes = [
                "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
                "video/mp4", "video/quicktime", "video/webm",
            ];
            const invalidFiles = selected.filter(f => !validTypes.includes(f.type));
            if (invalidFiles.length > 0) {
                setError(`${invalidFiles.length} file(s) have unsupported formats.`);
                return;
            }

            // Detect Live Photo pairs: same base name, one image + one .mov/quicktime
            const images = selected.filter(f => f.type.startsWith("image/"));
            const videos = selected.filter(f => f.type.startsWith("video/"));

            const pairs: LivePhotoPair[] = [];
            const pairedImageNames = new Set<string>();
            const pairedVideoNames = new Set<string>();

            for (const img of images) {
                const match = videos.find(v => baseName(v) === baseName(img));
                if (match) {
                    pairs.push({ image: img, video: match });
                    pairedImageNames.add(img.name);
                    pairedVideoNames.add(match.name);
                }
            }

            // Files that are NOT part of a live photo pair
            const standaloneFiles = selected.filter(
                f => !pairedImageNames.has(f.name) && !pairedVideoNames.has(f.name)
            );

            setLivePhotoPairs(prev => [...prev, ...pairs]);
            setFiles(prev => [...prev, ...standaloneFiles]);

            // Previews: show live photo images first, then standalone
            const livePreviews = pairs.map(p => URL.createObjectURL(p.image));
            const standalonePreviews = standaloneFiles.map(f => URL.createObjectURL(f));
            setPreviewURLs(prev => [...prev, ...livePreviews, ...standalonePreviews]);
            setError(null);
        }
    };

    const clearSelection = () => {
        setFiles([]);
        setPreviewURLs([]);
        setCaption("");
        setLivePhotoPairs([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const loadFFmpeg = async () => {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg();
        }
        const ffmpeg = ffmpegRef.current;
        if (ffmpeg.loaded) return ffmpeg;
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        return ffmpeg;
    };

    const compressImage = async (imageFile: File) => {
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            onProgress: (p: number) => setProgress(p * 0.9),
        };
        try {
            return await imageCompression(imageFile, options);
        } catch {
            return imageFile;
        }
    };

    const compressVideo = async (videoFile: File) => {
        const ffmpeg = await loadFFmpeg();
        const inputName = "input.mp4";
        const outputName = "output.mp4";
        await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
        ffmpeg.on("progress", ({ progress }) => {
            setProgress(progress * 100 * 0.9);
        });
        await ffmpeg.exec([
            "-i", inputName,
            "-vcodec", "libx264",
            "-crf", "28",
            "-preset", "faster",
            "-vf", "scale=-2:720",
            outputName
        ]);
        const data = await ffmpeg.readFile(outputName);
        const blobPart = typeof data === "string" ? data : new Uint8Array(data as Uint8Array);
        return new File([blobPart], videoFile.name, { type: "video/mp4" });
    };

    const getDimensions = (file: File): Promise<{ width?: number; height?: number }> => {
        return new Promise((resolve) => {
            if (file.type.startsWith("image/")) {
                const img = new Image();
                img.onload = () => resolve({ width: img.width, height: img.height });
                img.onerror = () => resolve({});
                img.src = URL.createObjectURL(file);
            } else if (file.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
                video.onerror = () => resolve({});
                video.src = URL.createObjectURL(file);
            } else {
                resolve({});
            }
        });
    };

    const uploadFile = async (file: File): Promise<string> => {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
        });
        if (!result.ok) throw new Error(`Upload failed for ${file.name}`);
        const { storageId } = await result.json();
        return storageId;
    };

    const handleUpload = async () => {
        const totalItems = livePhotoPairs.length + files.length;
        if (totalItems === 0 || !user) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            let itemIndex = 0;

            // Upload Live Photo pairs first
            for (const pair of livePhotoPairs) {
                const baseP = (itemIndex / totalItems) * 100;
                const scale = 1 / totalItems;

                setIsProcessing(true);
                const dimensions = await getDimensions(pair.image);
                const compressedImage = await compressImage(pair.image);

                setIsProcessing(false);
                setIsUploading(true);
                setProgress(baseP + 45 * scale);

                // Upload image and video in sequence
                const imageStorageId = await uploadFile(compressedImage);
                setProgress(baseP + 70 * scale);

                // For the live video, keep it under 3s — skip compression to keep it fast
                const videoStorageId = await uploadFile(pair.video);
                setProgress(baseP + 90 * scale);

                await sendPost({
                    storageId: imageStorageId as any,
                    livePhotoVideoId: videoStorageId as any,
                    caption,
                    mediaType: "image",
                    authorName: user.fullName || user.username || "Party Guest",
                    width: dimensions.width,
                    height: dimensions.height,
                });

                setProgress(baseP + 100 * scale);
                itemIndex++;
            }

            // Upload standalone files
            for (const file of files) {
                const baseP = (itemIndex / totalItems) * 100;
                const scale = 1 / totalItems;

                setIsProcessing(true);
                const dimensions = await getDimensions(file);
                let processedFile = file;

                if (file.type.startsWith("image/")) {
                    processedFile = await compressImage(file);
                } else if (file.type.startsWith("video/")) {
                    processedFile = await compressVideo(file);
                }

                setIsProcessing(false);
                setIsUploading(true);
                setProgress(baseP + 90 * scale);

                const storageId = await uploadFile(processedFile);
                const mediaType = file.type.startsWith("video/") ? "video" : "image";

                await sendPost({
                    storageId: storageId as any,
                    caption,
                    mediaType,
                    authorName: user.fullName || user.username || "Party Guest",
                    width: dimensions.width,
                    height: dimensions.height,
                });

                setProgress(baseP + 100 * scale);
                itemIndex++;
            }

            setIsUploading(false);
            setIsSuccess(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#FFD700", "#FF69B4", "#00CED1", "#9400D3"]
            });

            setTimeout(() => {
                closeDrawer();
                router.push("/photos");
            }, 2000);

        } catch (err) {
            console.error("Upload Error:", err);
            setError(err instanceof Error ? err.message : "An error occurred during upload.");
            setIsProcessing(false);
            setIsUploading(false);
        }
    };

    const totalCount = livePhotoPairs.length + files.length;
    const firstPreview = previewURLs[0];
    const firstIsLive = livePhotoPairs.length > 0 && previewURLs[0] === URL.createObjectURL(livePhotoPairs[0].image);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background rounded-t-[32px] shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Handle */}
                        <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mt-4 mb-2" />

                        <div className="px-6 pb-10 pt-2 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-serif font-bold">New Memory</h2>
                                <button
                                    onClick={closeDrawer}
                                    className="p-2 bg-foreground/5 rounded-full text-foreground/60 hover:bg-foreground/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {totalCount === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border-2 border-dashed border-primary/30 rounded-3xl bg-primary/5 h-64 flex flex-col items-center justify-center cursor-pointer mb-6 hover:bg-primary/10 transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="bg-primary/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={32} className="text-primary" />
                                    </div>
                                    <p className="font-semibold text-foreground/80">Tap to select photos or videos</p>
                                    <p className="text-sm text-foreground/50 mt-1">Live Photos supported · Multi-select enabled</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="relative rounded-3xl overflow-hidden bg-black/5 min-h-[300px] max-h-[60vh] shadow-xl w-full flex items-center justify-center border border-foreground/5">
                                        {firstPreview && (
                                            <img src={firstPreview} className="max-w-full max-h-[60vh] object-contain" alt="Preview" />
                                        )}

                                        {/* Live photo indicator on preview */}
                                        {livePhotoPairs.length > 0 && (
                                            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/20">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                                </span>
                                                <span className="text-white text-[9px] font-black uppercase tracking-widest">
                                                    {livePhotoPairs.length === 1 ? "Live Photo detected" : `${livePhotoPairs.length} Live Photos`}
                                                </span>
                                            </div>
                                        )}

                                        {totalCount > 1 && (
                                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/10">
                                                +{totalCount - 1} more selected
                                            </div>
                                        )}

                                        {(isProcessing || isUploading) && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center">
                                                <div className="relative w-20 h-20 mb-6">
                                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                                        <circle
                                                            className="text-white/20 stroke-current"
                                                            strokeWidth="4"
                                                            fill="transparent"
                                                            r="38"
                                                            cx="50"
                                                            cy="50"
                                                        />
                                                        <motion.circle
                                                            className="text-primary stroke-current"
                                                            strokeWidth="4"
                                                            strokeLinecap="round"
                                                            fill="transparent"
                                                            r="38"
                                                            cx="50"
                                                            cy="50"
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: progress / 100 }}
                                                            transition={{ duration: 0.5 }}
                                                            style={{ rotate: -90, transformOrigin: "50% 50%" }}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white font-bold text-lg">{Math.round(progress)}%</span>
                                                    </div>
                                                </div>
                                                <h3 className="text-white font-bold text-xl mb-2">
                                                    {isProcessing ? "Processing..." : "Sharing Memory..."}
                                                </h3>
                                                <p className="text-white/70 text-sm">
                                                    {isProcessing ? "Optimising your media for the best quality" : "Uploading to the party server"}
                                                </p>
                                            </div>
                                        )}

                                        {isSuccess && (
                                            <div className="absolute inset-0 bg-primary/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", damping: 12 }}
                                                >
                                                    <CheckCircle2 size={80} className="mb-6" />
                                                </motion.div>
                                                <h3 className="text-3xl font-serif font-bold mb-2">
                                                    {totalCount > 1 ? "Memories Shared!" : "Memory Shared!"}
                                                </h3>
                                                <p className="opacity-90">
                                                    {totalCount > 1
                                                        ? `${totalCount} contributions to the party have been posted.`
                                                        : "Your contribution to the party has been posted."}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {!isProcessing && !isUploading && !isSuccess && (
                                        <div className="space-y-4">
                                            <textarea
                                                value={caption}
                                                onChange={(e) => setCaption(e.target.value)}
                                                placeholder="Add a caption... (optional)"
                                                className="w-full bg-foreground/5 border border-foreground/10 py-4 px-5 rounded-2xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                                            />

                                            <SignedOut>
                                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-6 rounded-2xl text-center">
                                                    <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">Sign in to share this memory!</p>
                                                    <SignInButton mode="modal">
                                                        <button className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl">Sign In</button>
                                                    </SignInButton>
                                                </div>
                                            </SignedOut>

                                            <SignedIn>
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleUpload}
                                                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 flex justify-center items-center gap-2"
                                                >
                                                    Share {totalCount > 1 ? "Memories" : "Memory"}
                                                </motion.button>
                                            </SignedIn>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {error && (
                                <div className="mt-4 bg-red-50 text-red-500 p-4 rounded-2xl text-sm flex gap-3 border border-red-100 dark:bg-red-950/30 dark:border-red-900/50">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        accept="image/*,video/*,.heic,.heif"
                        multiple
                        onChange={handleFileChange}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
