"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, Scissors, Sparkles } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError("E-mail ou senha incorretos. Tente novamente.");
            setLoading(false);
        } else {
            router.push("/");
        }
    }

    return (
        <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-4">
            {/* Background Decorativo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                <div className="text-center space-y-4">
                    <div className="inline-flex p-4 bg-white rounded-3xl shadow-xl shadow-primary/10 border border-primary/10">
                        <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary fill-none stroke-current stroke-[1.5]" strokeLinecap="round" strokeLinejoin="round">
                            {/* Cílios/Olho estilizado */}
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                            <path d="M5 19l2-2" />
                            <path d="M19 19l-2-2" />
                            <path d="M12 21v-2" />
                            {/* Sobrancelha */}
                            <path d="M7 5c2-1 5-1 10 0" className="opacity-60" />
                        </svg>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black title-gold tracking-tight">Studio Gabriela Pinheiro</h1>
                        <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest bg-primary/5 py-1 px-4 rounded-full w-fit mx-auto">Luxury Lash & Beauty</p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-primary/5 border border-white/50 space-y-6">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">E-mail</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    required
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-border outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-border outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <p className="text-sm text-red-600 font-bold">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                        >
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                <>
                                    <span>Entrar no Sistema</span>
                                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">
                            Acesso restrito à profissional Gabriela Pinheiro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
