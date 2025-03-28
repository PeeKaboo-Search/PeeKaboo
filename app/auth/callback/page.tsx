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

        // Fallback redirect if no session is found
        setStatus("Authentication incomplete");
        setTimeout(() => router.push('/'), 2000);
      } catch (error) {
        console.error('Unexpected authentication error:', error);
        setStatus("An error occurred");
        setTimeout(() => router.push('/'), 2000);
      }
    };

    handleAuth();
  }, [router, supabase]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      color: 'white',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif',
      fontSize: '1.5rem',
      textAlign: 'center'
    }}>
      {status}
    </div>
  );
};

export default Page;
