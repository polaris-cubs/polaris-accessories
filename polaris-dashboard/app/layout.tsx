import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Inter } from "next/font/google";

import { Providers } from "./providers";

import Sidebar from "@/components/sidebar/sidebar";
import { Navbar } from "@/components/navbar/navbar";
import { fontSans } from "@/config/fonts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Polaris Dashboard",
    description: "Dashboard for Polaris Accessories",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "white" },
        { media: "(prefers-color-scheme: dark)", color: "black" },
    ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html suppressHydrationWarning lang="en">
            <head />
            <body className={clsx("min-h-screen bg-background font-sans antialiased", fontSans.variable, inter.className)}>
                <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
                    <Navbar />
                    <div className="app-container">
                        <Sidebar />
                        <main className="main-content">
                            {children}
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    );
}
