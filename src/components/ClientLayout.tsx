"use client";

import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth();
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading && !session) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Se estiver na página de login, não mostra o sidebar
    if (isLoginPage || !session) {
        return (
            <main className="flex-1 min-h-screen">
                {children}
            </main>
        );
    }

    return (
        <div className="flex w-full min-h-screen">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header Mobile */}
                <header className="lg:hidden p-4 bg-white border-b border-border flex items-center justify-between sticky top-0 z-30 shadow-sm safe-top">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="bg-primary/10 p-2 rounded-xl active:scale-95 transition-transform"
                        >
                            <Menu className="w-6 h-6 text-primary" />
                        </button>
                        <span className="font-bold text-lg title-gold">Studio GP</span>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-12 overflow-y-auto max-h-[calc(100vh-73px)] lg:max-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
