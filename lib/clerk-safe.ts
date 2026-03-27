"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function useSafeClerkAuth() {
  if (!clerkEnabled) {
    return {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: () => false,
      signOut: async () => undefined,
      getToken: async () => null,
    };
  }

  try {
    return useClerkAuth();
  } catch {
    return {
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      has: () => false,
      signOut: async () => undefined,
      getToken: async () => null,
    };
  }
}

export function useSafeClerkUser() {
  if (!clerkEnabled) {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    };
  }

  try {
    return useUser();
  } catch {
    return {
      isLoaded: true,
      isSignedIn: false,
      user: null,
    };
  }
}
