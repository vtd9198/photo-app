"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, Loader2, AlertCircle, LogIn } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function UploadPage() {
    const { user, isLoaded } = useUser();
    const [file, setFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const generateUploadUrl = useMutation(api.posts.generateUploadUrl);
    const sendPost = useMutation(api.posts.sendPost);

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary/50" size={40} />
                <p className="text-foreground/40 font-medium">Loading session...</p>
            </div>
        );
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewURL(URL.createObjectURL(selectedFile));
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) {
            console.log("⚠️ Upload blocked: File or User missing", { hasFile: !!file, hasUser: !!user });
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            console.log("🚀 Starting upload process...", { name: file.name, type: file.type });

            // 1. Get a temporary upload URL from Convex
            const postUrl = await generateUploadUrl();
            console.log("✅ Got upload URL");

            // 2. Upload the file to Convex Storage
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) {
                const errorText = await result.text();
                throw new Error(`Failed to upload to storage: ${result.status} ${errorText}`);
            }

            const { storageId } = await result.json();
            console.log("✅ File uploaded to storage, storageId:", storageId);

            // 3. Save metadata to the Convex Database
            const mediaType = file.type.startsWith("video/") ? "video" : "image";
            await sendPost({
                storageId,
                caption: caption,
                mediaType,
            });
            console.log("✅ Data saved to Convex database");

            // Success
            console.log("🎉 Post successful! Redirecting...");
            router.push("/");
            // Force a small delay to ensure the query updates
            setTimeout(() => {
                router.refresh();
            }, 500);
        } catch (err: any) {
            console.error("❌ Upload Error Details:", err);
            setError(err.message || "An error occurred during upload.");
        } finally {
            setIsUploading(false);
        }
    };

    const clearSelection = () => {
        setFile(null);
        setPreviewURL(null);
        setCaption("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="pt-6 px-6 pb-32">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-foreground">New Memory</h1>
                <button onClick={() => router.back()} className="p-2 bg-white dark:bg-neutral-900 rounded-full shadow-sm text-foreground/60">
                    <X size={20} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.div
                        key="upload-prompt"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-2 border-dashed border-primary/30 rounded-3xl bg-primary/5 h-64 flex flex-col items-center justify-center cursor-pointer mb-6 active:bg-primary/10 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="bg-primary/20 p-4 rounded-full mb-4">
                            <UploadCloud size={32} className="text-primary" />
                        </div>
                        <p className="font-semibold text-foreground/80">Tap to select a photo or video</p>
                        <p className="text-sm text-foreground/50 mt-1">PNG, JPG, MP4 up to 50MB</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-6"
                    >
                        <div className="relative rounded-3xl overflow-hidden bg-black aspect-[4/5] shadow-xl w-full flex items-center justify-center">
                            {file.type.startsWith("video/") ? (
                                <video src={previewURL!} className="w-full h-full object-cover" controls playsInline />
                            ) : (
                                <img src={previewURL!} className="w-full h-full object-cover" alt="Preview" />
                            )}

                            <button
                                onClick={clearSelection}
                                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/70 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6">
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption... (optional)"
                                className="w-full bg-white dark:bg-neutral-900 border border-primary/10 py-4 px-5 rounded-2xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*,video/*"
                onChange={handleFileChange}
            />

            {error && (
                <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm flex flex-col gap-2 border border-red-100 dark:bg-red-950/30 dark:border-red-900/50">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {file && (
                <div className="space-y-4">
                    <SignedOut>
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-6 rounded-2xl text-center">
                            <h3 className="text-amber-900 dark:text-amber-100 font-bold mb-2">Identify Yourself! 🥂</h3>
                            <p className="text-amber-800 dark:text-amber-200 text-sm mb-6">We need to know who shared this memory. Sign in to post!</p>
                            <SignInButton mode="modal">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                                >
                                    <LogIn size={20} />
                                    Sign In with Socials
                                </motion.button>
                            </SignInButton>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl shadow-lg shadow-primary/30 flex justify-center items-center disabled:opacity-70 transition-all font-sans"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={20} />
                                    Uploading to Party Server...
                                </>
                            ) : (
                                "Share Memory"
                            )}
                        </motion.button>
                    </SignedIn>
                </div>
            )}
        </div>
    );
}



