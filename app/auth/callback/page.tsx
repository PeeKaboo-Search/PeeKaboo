"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const [status, setStatus] = useState("Authenticating...");
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus("Authentication failed");
          setTimeout(() => router.push('/'), 2000);
          return;
        }
        
        if (data.session) {
          setStatus("Authentication successful");
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        // Attempt to complete the OAuth flow
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Authentication error:', authError);
          setStatus("Authentication failed");
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        if (authData.user) {
          setStatus("Authentication successful");
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        // If no session or user found
        setStatus("Unable to authenticate");
        setTimeout(() => router.push('/'), 2000);
      } catch (error) {
        console.error('Unexpected authentication error:', error);
        setStatus("An unexpected error occurred");
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <>
      <style jsx>{`
        .auth-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        .auth-card {
          background: rgba(20,20,20,0.8);
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          color: white;
          font-size: 1.2rem;
        }
        .spinner {
          border: 4px solid rgba(255,255,255,0.2);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="auth-container">
        <div className="auth-card">
          <div>{status}</div>
          <div className="spinner"></div>
        </div>
      </div>
    </>
  );
};

export default Page;
