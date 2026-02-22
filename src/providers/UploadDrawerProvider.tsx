"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface UploadDrawerContextType {
    isOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

const UploadDrawerContext = createContext<UploadDrawerContextType | undefined>(undefined);

export function UploadDrawerProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openDrawer = () => setIsOpen(true);
    const closeDrawer = () => setIsOpen(false);

    return (
        <UploadDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer }}>
            {children}
        </UploadDrawerContext.Provider>
    );
}

export function useUploadDrawer() {
    const context = useContext(UploadDrawerContext);
    if (context === undefined) {
        throw new Error("useUploadDrawer must be used within an UploadDrawerProvider");
    }
    return context;
}
