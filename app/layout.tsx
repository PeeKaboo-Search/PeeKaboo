"use client";
import React, { useState, useEffect } from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; 
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { SideHistory } from "@/app/components/SideHistory";
import { Menu, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import "@/styles/global.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Create a context for sharing user state and save functionality
export const LayoutContext = React.createContext<{
  user: User | null;
  handleSave: (() => Promise<void>) | null;
  setSaveHandler: (handler: () => Promise<void>) => void;
}>({
  user: null,
  handleSave: null,
  setSaveHandler: () => {},
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [isSideHistoryOpen, setIsSideHistoryOpen] = useState(false);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    // Add scroll listener
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      authListener?.subscription?.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSave = async () => {
    if (saveHandler) {
      await saveHandler();
    }
  };

  const setSaveHandlerWrapper = (handler: () => Promise<void>) => {
    setSaveHandler(() => handler);
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutContext.Provider value={{ 
          user, 
          handleSave: user ? handleSave : null, 
          setSaveHandler: setSaveHandlerWrapper 
        }}>
          {/* Fixed floating sidebar and save buttons - only visible when logged in */}
          {user && (
            <>
              {/* Side History Component */}
              <SideHistory 
                isOpen={isSideHistoryOpen} 
                onClose={() => setIsSideHistoryOpen(false)}
                user={user}
                onSignOut={handleSignOut}
              />
              
              {/* Fixed floating menu button */}
              {!isSideHistoryOpen && (
                <button 
                  onClick={() => setIsSideHistoryOpen(!isSideHistoryOpen)}
                  className="absolute z-[9999] bg-white/20 backdrop-blur-sm p-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out hover:bg-white/30"
                  style={{ 
                    left: '16px',
                    top: `${scrollY + 16}px`,
                    position: 'absolute'
                  }}
                  aria-label="Open history menu"
                >
                  <Menu className="text-white w-6 h-6" />
                </button>
              )}

              {/* Fixed floating save button */}
              <button 
                onClick={handleSave} 
                className="
                  absolute z-[9999]
                  bg-white/10 hover:bg-white/20 
                  backdrop-blur-md 
                  p-3 rounded-full 
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 ease-in-out
                  flex items-center justify-center
                  border border-white/10 hover:border-white/30"
                style={{ 
                  right: '16px',
                  top: `${scrollY + 16}px`,
                  position: 'absolute'
                }}
                aria-label="Save current search"
              >
                <Save className="text-white/80 hover:text-white w-6 h-6" />
              </button>
            </>
          )}
          
          {children}
        </LayoutContext.Provider>
      </body>
    </html>
  );
}