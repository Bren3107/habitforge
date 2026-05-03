import type { Metadata } from "next";
import { Fraunces, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HabitForge — Forge Your Future, One Habit at a Time",
  description: "AI-powered habit formation grounded in behavioral psychology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg-base text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
