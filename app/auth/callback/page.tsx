"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(
          String(window.location.search)
        );

        if (error) {
          console.error('Authentication error:', error);
          router.push('/');
          return;
        }

        // Redirect to the main application page on successful authentication
        router.push('/');
      } catch (err) {
        console.error('Unexpected error during authentication:', err);
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="p-8 rounded-lg bg-gray-900 text-white text-center">
        <h1 className="text-3xl mb-6">Authenticating</h1>
        <div className="animate-pulse">
          <div className="h-2 bg-gray-700 rounded w-48 mx-auto mb-4"></div>
          <div className="h-2 bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
