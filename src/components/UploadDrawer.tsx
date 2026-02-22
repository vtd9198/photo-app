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

export default function UploadDrawer() {
    const { isOpen, closeDrawer } = useUploadDrawer();
    const { user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    if (pathname === "/" || pathname === "/passcode") return null;

    const [file, setFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
    const sendPost = useMutation(api.posts.sendPost);

    // Reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setFile(null);
                setPreviewURL(null);
                setCaption("");
                setIsProcessing(false);
                setIsUploading(false);
                setProgress(0);
                setError(null);
                setIsSuccess(false);
            }, 300);
        }
    }, [isOpen]);

    if (pathname === "/") return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validation
            const validTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
            if (!validTypes.includes(selectedFile.type)) {
                setError("Please select a standard image (JPG, PNG, WebP) or video (MP4, MOV, WebM) format.");
                return;
            }

            setFile(selectedFile);
            setPreviewURL(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setPreviewURL(null);
        setCaption("");
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
            onProgress: (p: number) => setProgress(p * 0.9), // Keep 10% for upload
        };
        try {
            return await imageCompression(imageFile, options);
        } catch (error) {
            console.error("Image compression error:", error);
            return imageFile;
        }
    };

    const compressVideo = async (videoFile: File) => {
        const ffmpeg = await loadFFmpeg();
        const inputName = "input.mp4";
        const outputName = "output.mp4";

        await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

        ffmpeg.on("progress", ({ progress }) => {
            setProgress(progress * 100 * 0.9); // Keep 10% for upload
        });

        // Basic compression: resize to 720p and use crf 28
        await ffmpeg.exec([
            "-i", inputName,
            "-vcodec", "libx264",
            "-crf", "28",
            "-preset", "faster",
            "-vf", "scale=-2:720",
            outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        // data can be a string or Uint8Array, and might use SharedArrayBuffer which causes TS issues
        const blobPart = typeof data === "string" ? data : new Uint8Array(data as Uint8Array);
        return new File([blobPart], videoFile.name, { type: "video/mp4" });
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);

        try {
            let processedFile = file;

            if (file.type.startsWith("image/")) {
                processedFile = await compressImage(file);
            } else if (file.type.startsWith("video/")) {
                processedFile = await compressVideo(file);
            }

            setIsProcessing(false);
            setIsUploading(true);
            setProgress(90);

            // 1. Get a temporary upload URL from Convex
            const postUrl = await generateUploadUrl();

            // 2. Upload the file to Convex Storage
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": processedFile.type },
                body: processedFile,
            });

            if (!result.ok) throw new Error("Failed to upload to storage");

            const { storageId } = await result.json();
            setProgress(100);

            // 3. Save metadata to the Convex Database
            const mediaType = file.type.startsWith("video/") ? "video" : "image";
            await sendPost({
                storageId,
                caption: caption,
                mediaType,
                authorName: user.fullName || user.username || "Party Guest",
            });


            // Success!
            setIsUploading(false);
            setIsSuccess(true);

            // Celebration!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#FFD700", "#FF69B4", "#00CED1", "#9400D3"]
            });

            // Redirect after a short delay
            setTimeout(() => {
                closeDrawer();
                router.push("/");
                router.refresh();
            }, 3000);

        } catch (err) {
            console.error("Upload Error:", err);
            setError(err instanceof Error ? err.message : "An error occurred during upload.");
            setIsProcessing(false);
            setIsUploading(false);
        }
    };

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

                            {!file ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border-2 border-dashed border-primary/30 rounded-3xl bg-primary/5 h-64 flex flex-col items-center justify-center cursor-pointer mb-6 hover:bg-primary/10 transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="bg-primary/20 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud size={32} className="text-primary" />
                                    </div>
                                    <p className="font-semibold text-foreground/80">Tap to select a photo or video</p>
                                    <p className="text-sm text-foreground/50 mt-1">Images and videos are compressed locally</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/5] shadow-xl w-full flex items-center justify-center">
                                        {file.type.startsWith("video/") ? (
                                            <video src={previewURL!} className="w-full h-full object-cover" controls playsInline />
                                        ) : (
                                            <img src={previewURL!} className="w-full h-full object-cover" alt="Preview" />
                                        )}

                                        {!isProcessing && !isUploading && !isSuccess && (
                                            <button
                                                onClick={clearSelection}
                                                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                                            >
                                                <X size={18} />
                                            </button>
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
                                                    {isProcessing ? "Optimizing your media for the best quality" : "Uploading to the party server"}
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
                                                <h3 className="text-3xl font-serif font-bold mb-2">Memory Shared!</h3>
                                                <p className="opacity-90">Your contribution to the party has been posted.</p>
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
                                                    Share Memory
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
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
