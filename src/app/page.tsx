"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Calendar, MapPin, Sparkles } from "lucide-react";

export default function InvitationPage() {
  const { isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  // Parallax setup
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.2]);

  const handleEnterGallery = async () => {
    if (!isLoaded) return;

    if (isSignedIn) {
      setIsNavigating(true);
      setTimeout(() => {
        router.push("/feed");
      }, 800);
    } else {
      clerk.openSignIn({
        afterSignInUrl: "/feed",
        afterSignUpUrl: "/feed",
      });
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      handleEnterGallery();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#3E2723] overflow-hidden relative">
      {/* Subtle Grainy Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Intro Section */}
      <section className="h-screen w-full flex flex-col items-center justify-center relative px-6 z-10">
        <motion.div
          style={{ y: y1, opacity }}
          className="text-center space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <span className="text-secondary font-medium tracking-[0.2em] text-sm uppercase block mb-4">
              You are invited
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-[#3E2723]"
          >
            Ala is turning 18
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-xl font-light text-foreground/70 italic mt-6"
          >
            A night of memories, friends, and celebration.
          </motion.p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-foreground/50">Scroll Detail</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-0.5 h-12 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>
      </section>

      {/* Details Section */}
      <section className="min-h-screen py-24 px-6 flex flex-col items-center justify-center relative z-10 bg-gradient-to-b from-[#F5F5DC] to-[#FFFDD0]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-md w-full bg-white/40 backdrop-blur-xl border border-primary/10 rounded-[2rem] p-10 shadow-2xl relative"
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary/10 p-3 rounded-full text-secondary">
            <Sparkles size={24} />
          </div>

          <h2 className="font-serif text-3xl font-bold text-center mb-10 text-[#3E2723]">
            The Details
          </h2>

          <div className="space-y-8">
            <div className="flex items-start gap-5">
              <div className="mt-1 bg-white/60 p-2.5 rounded-full shadow-sm text-primary">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-bold text-foreground tracking-wide uppercase text-sm mb-1">When</p>
                <p className="text-foreground/80 font-serif text-lg">Saturday, October 28th</p>
                <p className="text-foreground/60 text-sm">8:00 PM until late</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="mt-1 bg-white/60 p-2.5 rounded-full shadow-sm text-primary">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-bold text-foreground tracking-wide uppercase text-sm mb-1">Where</p>
                <p className="text-foreground/80 font-serif text-lg">The Glasshouse Venue</p>
                <p className="text-foreground/60 text-sm">123 Celebration Ave, City</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="mt-1 bg-white/60 p-2.5 rounded-full shadow-sm text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="font-bold text-foreground tracking-wide uppercase text-sm mb-1">Dress Code</p>
                <p className="text-foreground/80 font-serif text-lg">Elegant & Chic</p>
                <p className="text-foreground/60 text-sm">Be comfortable, but make it memorable.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RSVP Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-20 w-full max-w-sm"
        >
          <button
            onClick={handleEnterGallery}
            className="group relative w-full flex items-center justify-center overflow-hidden rounded-full bg-[#3E2723] px-8 py-5 text-lg font-bold text-[#F5F5DC] transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-[#3E2723]/20"
          >
            <span className="relative z-10 flex items-center gap-3 tracking-wide">
              {isLoaded && !isSignedIn ? "RSVP / Sign In" : "Enter the Memory Gallery"}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
        </motion.div>
      </section>

      {/* Transition Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 bg-[#F5F5DC] flex flex-col items-center justify-center"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-serif text-3xl font-bold text-[#3E2723] mb-4"
            >
              Unlocking Memories...
            </motion.h2>
            <motion.div
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="h-1 bg-primary rounded-full"
              style={{ width: "200px" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
