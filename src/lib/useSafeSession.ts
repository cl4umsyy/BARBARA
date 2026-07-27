import { useSession } from "next-auth/react";

/**
 * Custom wrapper around next-auth useSession hook that gracefully handles
 * cases where SessionProvider is unmounted, re-building during Turbopack HMR,
 * or not present in the React tree.
 */
export function useSafeSession() {
  try {
    return useSession();
  } catch (error) {
    return {
      data: null,
      status: "unauthenticated" as const,
      update: async () => null,
    };
  }
}
