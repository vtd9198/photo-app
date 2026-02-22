import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "18th Birthday Memories",
  description: "Share your photos and videos from the party!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { UploadDrawerProvider } from "@/providers/UploadDrawerProvider";
import UploadDrawer from "@/components/UploadDrawer";
import SyncUser from "@/components/SyncUser";
import { LenisProvider } from "@/providers/LenisProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-background`}
      >
        <div className="grain-overlay mix-blend-multiply opacity-[0.08] dark:opacity-[0.05]" />

        <LenisProvider>
          <ConvexClientProvider>
            <UploadDrawerProvider>
              <SyncUser />
              <div className="max-w-md mx-auto min-h-[100dvh] bg-background shadow-2xl relative flex flex-col overflow-x-hidden">
                <main className="flex-1 pb-24">
                  {children}
                </main>
                <BottomNav />
                <UploadDrawer />
              </div>
            </UploadDrawerProvider>
          </ConvexClientProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
