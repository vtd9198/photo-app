"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export default function SyncUser() {
    const { isLoaded, user } = useUser();
    const syncUser = useMutation(api.users.syncUser);

    useEffect(() => {
        if (isLoaded && user) {
            syncUser({
                externalId: user.id,
                name: user.fullName || user.username || "Party Guest",
                profileImage: user.imageUrl,
            }).catch((err) => {
                console.error("Failed to sync user to Convex:", err);
            });
        }
    }, [isLoaded, user, syncUser]);

    return null;
}
