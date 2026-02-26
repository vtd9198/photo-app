"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image as ImageIcon, Plus, User } from "lucide-react";
import { motion } from "framer-motion";
import { useUploadDrawer } from "@/providers/UploadDrawerProvider";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function BottomNav() {
    const pathname = usePathname();
    const { openDrawer } = useUploadDrawer();

    // Hide nav on passcode screen and root invitation page
    if (pathname === "/passcode" || pathname === "/") return null;

    const isGalleryActive = pathname === "/photos" || pathname === "/feed";

    return (
        <div className="fixed bottom-0 w-full max-w-md mx-auto bg-background/70 backdrop-blur-xl border-t border-primary/20 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 px-6 z-50">

            <div className="flex justify-between items-center h-14">
                <NavItem href="/photos" icon={<ImageIcon size={24} />} isActive={isGalleryActive} label="Gallery" />

                {/* Upload FAB trigger */}
                <div className="relative -top-5">
                    <SignedIn>
                        <motion.button
                            onClick={openDrawer}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center border-4 border-background"
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </motion.button>
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-primary text-white p-4 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center border-4 border-background"
                            >
                                <Plus size={28} strokeWidth={2.5} />
                            </motion.button>
                        </SignInButton>
                    </SignedOut>
                </div>

                <SignedIn>
                    <NavItem href="/profile" icon={<User size={24} />} isActive={pathname === "/profile"} label="Profile" />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal">
                        <button className="flex flex-col items-center justify-center w-16 gap-1">
                            <div className="text-foreground/40">
                                <User size={24} />
                            </div>
                            <span className="text-[10px] font-medium text-foreground/40">
                                Profile
                            </span>
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </div>
    );
}


function NavItem({ href, icon, isActive, label }: { href: string; icon: React.ReactNode; isActive: boolean; label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center w-16 gap-1">
            <div className={cn("transition-colors duration-200", isActive ? "text-primary" : "text-foreground/40")}>
                {icon}
            </div>
            <span className={cn("text-[10px] font-medium transition-colors duration-200", isActive ? "text-primary" : "text-foreground/40")}>
                {label}
            </span>
        </Link>
    );
}
