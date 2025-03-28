"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const Page: React.FC = () => {
  const [status, setStatus] = useState("Authenticating...");
  const [dotCount, setDotCount] = useState(0);
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 500);

    const handleAuth = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        // Explicitly reference sessionError to avoid ESLint warning
        if (sessionError) {
          console.warn('Session error:', sessionError);
        }
        
        if (data.session) {
          setStatus("Authentication successful!");
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        const { error: authError } = await supabase.auth.getOAuthResponse();
        
        if (authError) {
          setStatus("Authentication failed. Redirecting...");
          console.warn('Authentication error:', authError);
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        setStatus("Finalizing authentication...");
        setTimeout(() => router.push('/'), 1500);
      } catch (error) {
        // Handle any unexpected errors
        setStatus("An unexpected error occurred.");
        console.error('Unexpected authentication error:', error);
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleAuth();

    return () => clearInterval(dotInterval);
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
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(10px);
          z-index: 9999;
        }
        .auth-card {
          background: rgba(30, 30, 30, 0.7);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.1);
          max-width: 400px;
          width: 90%;
        }
        .status-text {
          color: #fff;
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }
        .loading-dots {
          display: inline-block;
          color: #fff;
        }
        .glitch {
          animation: glitch 1s infinite;
        }
        @keyframes glitch {
          0%, 100% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
        }
      `}</style>
      <div className="auth-container">
        <div className="auth-card">
          <div className="status-text glitch">
            {status}
            <span className="loading-dots">
              {Array(dotCount).fill('.').join('')}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
