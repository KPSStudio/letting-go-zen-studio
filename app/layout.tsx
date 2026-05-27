// app/layout.tsx
// This wraps every single page on the site
// Anything here appears on ALL pages — nav, utility bar, footer etc.

import type { Metadata } from "next";
import { Cinzel, Raleway } from "next/font/google";
import "./globals.css";
import UtilityBar from "@/components/layout/UtilityBar";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";

const cinzel = Cinzel({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

const raleway = Raleway({
    variable: "--font-raleway",
    subsets: ["latin"],
    weight: ["200", "300", "400"],
});

export const metadata: Metadata = {
    title: "Letting Go Zen Studio",
    description: "Ciało · Umysł · Dusza — Holistyczne sesje terapeutyczne w UK",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl" className={`${cinzel.variable} ${raleway.variable} h-full`}>
        <body className="min-h-full flex flex-col">
        <UtilityBar />
        <Nav />
        <main className="flex-1">
            {children}
        </main>
        <Footer/>
        </body>
        </html>
    );
}