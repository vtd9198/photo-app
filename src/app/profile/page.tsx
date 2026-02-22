"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser, UserButton } from "@clerk/nextjs";
import GalleryGrid, { type Post } from "@/components/GalleryGrid";
import MediaModal from "@/components/MediaModal";
import { motion } from "framer-motion";
import { Edit2, Check, X, Heart, Image as ImageIcon, Loader2 } from "lucide-react";

export default function ProfilePage() {
    const { isLoaded: clerkLoaded } = useUser();
    const user = useQuery(api.users.currentUser);
    const stats = useQuery(api.posts.getUserStats);
    const userPosts = useQuery(api.posts.listUserPosts);
    const updateName = useMutation(api.users.updateName);

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!clerkLoaded || user === undefined) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-primary/50" size={40} />
                <p className="text-foreground/40 font-medium">Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <p className="text-foreground/60 mb-4">Please sign in to view your profile.</p>
                <UserButton afterSignOutUrl="/" />
            </div>
        );
    }

    const handleStartEdit = () => {
        setNewName(user.name);
        setIsEditing(true);
    };

    const handleSaveName = async () => {
        if (!newName.trim() || newName === user.name) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await updateName({ name: newName });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update name:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pt-12 pb-24">
            {/* Profile Header */}
            <div className="px-6 mb-10">
                <div className="flex items-center gap-6 mb-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/10 shadow-xl">
                            <img
                                src={user.profileImage}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-900 p-1.5 rounded-full shadow-md border border-primary/5">
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-full">
                                    <input
                                        autoFocus
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="bg-primary/5 border-b-2 border-primary outline-none text-xl font-bold py-1 w-full"
                                        disabled={isSaving}
                                    />
                                    <button
                                        onClick={handleSaveName}
                                        disabled={isSaving}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-foreground truncate max-w-[180px]">
                                        {user.name}
                                    </h1>
                                    <button
                                        onClick={handleStartEdit}
                                        className="p-1.5 text-foreground/30 hover:text-primary transition-colors hover:bg-primary/5 rounded-full"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-sm text-foreground/50 font-medium">Party Guest 🥂</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-neutral-900 p-4 rounded-3xl shadow-sm border border-primary/5 flex flex-col items-center justify-center"
                    >
                        <div className="bg-primary/10 p-2 rounded-full mb-2">
                            <Heart size={20} className="text-primary fill-primary/20" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                            {stats?.totalLikesReceived ?? 0}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-foreground/40">Likes Received</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-neutral-900 p-4 rounded-3xl shadow-sm border border-primary/5 flex flex-col items-center justify-center"
                    >
                        <div className="bg-primary/10 p-2 rounded-full mb-2">
                            <ImageIcon size={20} className="text-primary" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                            {stats?.postCount ?? 0}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-foreground/40">Shared Moments</span>
                    </motion.div>
                </div>
            </div>

            {/* Personal Gallery */}
            <div className="mt-4">
                <div className="px-6 mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">My Memories</h2>
                </div>

                <GalleryGrid
                    posts={userPosts}
                    onSelectPost={setSelectedPost}
                />
            </div>

            <MediaModal
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
            />
        </div>
    );
}
