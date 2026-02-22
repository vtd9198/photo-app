"use client";

import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { SignInButton, SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Calendar, MapPin, Clock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

// Custom Disco Ball Component
const DiscoBall = () => (
    <motion.div
        className="relative w-24 h-24 mb-4"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
        {/* String */}
        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[1px] h-10 bg-[#A62639]/30" />

        {/* Ball */}
        <motion.div
            className="w-full h-full rounded-full bg-[#A62639] relative overflow-hidden shadow-xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%),linear-gradient(-45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]" />

            {/* Light highlights */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
        </motion.div>

        {/* Sparkling points around the ball */}
        {[...Array(6)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full group-hover:scale-150"
                style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                    scale: [0, 1.2, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 90, 180]
                }}
                transition={{
                    duration: 1 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2
                }}
            />
        ))}
    </motion.div>
);

export default function InvitationPage() {
    const { isLoaded } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const [showCalendarHints, setShowCalendarHints] = useState(false);

    // March 20, 2026 at 18:00 (6 PM) Poland time (CET -> UTC+1)
    const eventDate = new Date("2026-03-20T18:00:00+01:00").getTime();

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = eventDate - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000),
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [eventDate]);

    const handleConfetti = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#A62639", "#FDFBF7", "#C19A6B"],
            zIndex: 100,
        });
    };

    const handleCalendarClick = () => {
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Ala%27s+18th+Birthday&dates=20260320T170000Z/20260321T020000Z&details=Party+Time!+A+night+of+memories,+friends,+and+celebration.&location=The+Grand+Ballroom,+Poland`;
        window.open(googleCalendarUrl, "_blank");
    };

    // Magnetic Button Logic
    const buttonRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!buttonRef.current) return;
        const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        x.set((e.clientX - centerX) / 4);
        y.set((e.clientY - centerY) / 4);
    };
    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-[#FDFBF7] flex flex-col items-center justify-center text-[#3E2723]">
            {/* Decorative Grain Overlay handled in layout.tsx */}

            <AnimatePresence mode="wait">
                {!isOpen ? (
                    <motion.div
                        key="envelope-view"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="z-50 cursor-pointer flex flex-col items-center gap-8"
                        onClick={() => {
                            setIsOpen(true);
                            handleConfetti();
                        }}
                    >
                        {/* The Envelope */}
                        <div className="relative group">
                            <motion.div
                                className="w-72 h-52 bg-[#A62639] rounded-lg shadow-[0_20px_50px_rgba(166,38,57,0.3)] relative overflow-hidden border border-white/10"
                                whileHover={{ y: -10 }}
                            >
                                {/* Envelope Flap Appearance */}
                                <div className="absolute inset-0 bg-[#8A1F2F]" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }} />

                                {/* Seal */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#FDFBF7] rounded-full shadow-lg flex items-center justify-center border-4 border-[#A62639]">
                                    <span className="font-serif text-xl font-bold text-[#A62639]">A</span>
                                </div>

                                <div className="absolute bottom-6 w-full text-center">
                                    <p className="text-[#FDFBF7]/60 text-[10px] uppercase tracking-[0.4em] font-medium">Ala's 18th Birthday</p>
                                </div>
                            </motion.div>

                            {/* Shine effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"
                                animate={{ x: [-200, 400] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>

                        <motion.div
                            animate={{ y: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="flex flex-col items-center gap-1"
                        >
                            <span className="text-xs tracking-[0.3em] uppercase font-bold text-[#A62639]">Click to Open</span>
                            <div className="w-1 h-1 bg-[#A62639] rounded-full" />
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="card-view"
                        className="relative w-full max-w-sm flex flex-col items-center px-6"
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    >
                        {/* The Invitation Card with Scalloped Border */}
                        <div
                            className="w-full bg-[#A62639] p-2 relative shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden"
                            style={{
                                clipPath: "polygon(0% 5%, 5% 0%, 10% 5%, 15% 0%, 20% 5%, 25% 0%, 30% 5%, 35% 0%, 40% 5%, 45% 0%, 50% 5%, 55% 0%, 60% 5%, 65% 0%, 70% 5%, 75% 0%, 80% 5%, 85% 0%, 90% 5%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 90% 95%, 85% 100%, 80% 95%, 75% 100%, 70% 95%, 65% 100%, 60% 95%, 55% 100%, 50% 95%, 45% 100%, 40% 95%, 35% 100%, 30% 95%, 25% 100%, 20% 95%, 15% 100%, 10% 95%, 5% 100%, 0% 95%)"
                            }}
                        >
                            <div className="bg-[#FDFBF7] w-full h-full flex flex-col items-center py-12 px-6 overflow-hidden">
                                {/* Graphics */}
                                <div className="flex justify-between w-full absolute top-8 px-8 opacity-20 pointer-events-none">
                                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                                        <Sparkles size={24} className="text-[#A62639]" />
                                    </motion.div>
                                    <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 5 }}>
                                        <Sparkles size={24} className="text-[#A62639]" />
                                    </motion.div>
                                </div>

                                <DiscoBall />

                                <motion.h2
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="font-serif text-[#A62639] text-5xl md:text-6xl font-black italic mb-2 tracking-tight"
                                >
                                    Party
                                </motion.h2>
                                <motion.h2
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="font-serif text-[#A62639] text-4xl mb-4 tracking-[0.1em]"
                                >
                                    TIME
                                </motion.h2>

                                <div className="w-12 h-[2px] bg-[#A62639]/20 mb-6" />

                                <div className="text-center space-y-4 mb-8">
                                    <p className="text-[10px] uppercase tracking-[0.5em] font-black text-[#A62639]/40">Celebrating</p>
                                    <h1 className="font-serif text-2xl text-[#2C1810] font-bold">ALA'S 18TH BIRTHDAY</h1>
                                </div>

                                {/* Event Details Grid */}
                                <div className="grid grid-cols-2 gap-6 w-full mb-8 border-y border-[#A62639]/10 py-6">
                                    <div className="flex flex-col items-center gap-1 border-r border-[#A62639]/10">
                                        <Clock size={16} className="text-[#A62639]/60 mb-1" />
                                        <span className="text-[9px] uppercase tracking-widest text-[#A62639] font-bold">When</span>
                                        <p className="text-xs font-bold text-[#3E2723]">20.03.2026 | 6 PM</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <MapPin size={16} className="text-[#A62639]/60 mb-1" />
                                        <span className="text-[9px] uppercase tracking-widest text-[#A62639] font-bold">Where</span>
                                        <p className="text-xs font-bold text-[#3E2723]">Grand Ballroom</p>
                                    </div>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="flex flex-col items-center gap-1 mb-8"
                                >
                                    <span className="text-[9px] uppercase tracking-widest text-[#A62639]/60 font-bold">Dress Code</span>
                                    <p className="text-xs font-bold text-[#3E2723] uppercase tracking-widest">Glamorous & Festive</p>
                                </motion.div>

                                <div className="mb-8 w-full">
                                    <div className="flex justify-center items-end gap-4 mb-4">
                                        {[
                                            { label: "D", value: timeLeft.days },
                                            { label: "H", value: timeLeft.hours },
                                            { label: "M", value: timeLeft.minutes },
                                            { label: "S", value: timeLeft.seconds },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex flex-col items-center">
                                                <span className="font-serif text-xl text-[#3E2723] font-bold leading-none">
                                                    {item.value.toString().padStart(2, "0")}
                                                </span>
                                                <span className="text-[7px] uppercase tracking-[0.2em] text-[#A62639] mt-1 font-bold">
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleCalendarClick}
                                        onMouseEnter={() => setShowCalendarHints(true)}
                                        onMouseLeave={() => setShowCalendarHints(false)}
                                        className="w-full py-2 rounded-full border border-[#A62639]/20 text-[9px] uppercase tracking-[0.3em] font-bold text-[#A62639] hover:bg-[#A62639] hover:text-[#FDFBF7] transition-all"
                                    >
                                        {showCalendarHints ? "Adding to Calendar..." : "Add to Calendar"}
                                    </button>
                                </div>

                                {/* Magnetic Entry Button */}
                                <div className="w-full mt-auto mb-10">
                                    {!isLoaded ? (
                                        <div className="w-full h-14 bg-[#A62639]/10 rounded-full animate-pulse" />
                                    ) : (
                                        <div
                                            ref={buttonRef}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                            className="relative"
                                        >
                                            <SignedOut>
                                                <SignInButton mode="modal" fallbackRedirectUrl="/feed">
                                                    <motion.button
                                                        style={{ x, y }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="w-full flex items-center justify-center gap-2 bg-[#A62639] text-[#FDFBF7] h-14 rounded-full font-serif text-lg tracking-widest shadow-xl shadow-[#A62639]/20 transition-transform active:scale-95"
                                                    >
                                                        ENTER PARTY
                                                        <ChevronRight size={20} />
                                                    </motion.button>
                                                </SignInButton>
                                            </SignedOut>
                                            <SignedIn>
                                                <Link href="/feed">
                                                    <motion.button
                                                        style={{ x, y }}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="w-full flex items-center justify-center gap-2 bg-[#A62639] text-[#FDFBF7] h-14 rounded-full font-serif text-lg tracking-widest shadow-xl shadow-[#A62639]/20 transition-transform active:scale-95"
                                                    >
                                                        ENTER PARTY
                                                        <ChevronRight size={20} />
                                                    </motion.button>
                                                </Link>
                                            </SignedIn>
                                        </div>
                                    )}
                                </div>

                                {/* Bottom Graphic - Champagne Toast */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 1, duration: 1 }}
                                    className="absolute bottom-4 w-full flex justify-center pointer-events-none"
                                >
                                    <div className="relative w-32 h-20 flex justify-center">
                                        {/* Left Glass */}
                                        <motion.svg
                                            width="60" height="80" viewBox="0 0 60 80"
                                            className="absolute left-0 mt-4"
                                            animate={{ rotate: [0, 5, 0], x: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                        >
                                            <path d="M10 5 Q10 40 30 40 Q50 40 50 5" fill="none" stroke="#A62639" strokeWidth="1.5" />
                                            <line x1="30" y1="40" x2="30" y2="70" stroke="#A62639" strokeWidth="1.5" />
                                            <line x1="20" y1="70" x2="40" y2="70" stroke="#A62639" strokeWidth="1.5" />
                                            <path d="M15 15 L45 15 Q45 35 30 35 Q15 35 15 15" fill="#A62639" opacity="0.3" />
                                        </motion.svg>

                                        {/* Right Glass */}
                                        <motion.svg
                                            width="60" height="80" viewBox="0 0 60 80"
                                            className="absolute right-0 mt-4"
                                            animate={{ rotate: [0, -5, 0], x: [0, -5, 0] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.2 }}
                                        >
                                            <path d="M10 5 Q10 40 30 40 Q50 40 50 5" fill="none" stroke="#A62639" strokeWidth="1.5" />
                                            <line x1="30" y1="40" x2="30" y2="70" stroke="#A62639" strokeWidth="1.5" />
                                            <line x1="20" y1="70" x2="40" y2="70" stroke="#A62639" strokeWidth="1.5" />
                                            <path d="M15 15 L45 15 Q45 35 30 35 Q15 35 15 15" fill="#A62639" opacity="0.3" />
                                        </motion.svg>

                                        {/* Sparkles between glasses */}
                                        <motion.div
                                            className="absolute top-2"
                                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            <Sparkles size={16} className="text-[#A62639]/40" />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-8 text-[10px] uppercase tracking-[0.4em] font-black text-[#A62639]/50 hover:text-[#A62639] transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Return to Envelope
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
