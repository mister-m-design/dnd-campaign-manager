import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopHeader from "@/components/TopHeader";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MythicTable | D&D Campaign Manager",
  description: "A comprehensive tool for D&D campaigns, characters, and adventures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#090C12" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-display antialiased text-foreground flex flex-col min-h-screen`}
        style={{ background: 'var(--background)' }}
      >
        <Providers>
          <TopHeader />
          <main className="flex-grow flex flex-col overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(226,183,71,0.05),transparent_70%)] pointer-events-none" />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
