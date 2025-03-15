"use client";

import React from "react";

import Dashboard from "@/components/MapExplorer";

export default function Home() {
    return (
        <section className="flex flex-col items-center justify-center gap-4">
            <Dashboard />
        </section>
    );
}
