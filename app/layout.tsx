'use client'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useStore } from "./store/use-store";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, setUserId } = useStore();

  useEffect(() => {
    // Using a fixed ID for all users to ensure everyone sees the same data
    const fixedUserId = "shared-user-12345";
    setUserId(fixedUserId);
    localStorage.setItem("userId", fixedUserId);
  }, [userId]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
