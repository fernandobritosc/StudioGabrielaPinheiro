"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, Calendar, TrendingUp, Clock, MessageSquare, Loader2, Sparkles, DollarSign, Target, ChevronRight, AlertCircle, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
    const [stats, setStats] = useState({
        clients: 0,
        appsToday: 0,
        revenuePaid: 0,
        revenuePredicted: 0,
        occupationRate: 0,
        pendingConfirmations: 0
    });
    const [nextApps, setNextApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchDashboardData() {
        setLoading(true);
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // 1. Contar Clientes
        const { count: clientCount } = await supabase.from("clientes").select("*", { count: 'exact', head: true });

        // 2. Agendamentos de Hoje
        const { data: appsToday } = await supabase
            .from("agendamentos")
            .select("*, clientes(nome), servicos(nome, preco, duracao_minutos)")
            .gte("horario", startOfToday)
            .lte("horario", endOfToday)
            .order("horario");

        // 3. Agendamentos do Mês (Para Faturamento Previsto vs Realizado)
        const { data: monthApps } = await supabase
            .from("agendamentos")
            .select("*, servicos(preco)")
            .gte("horario", startOfMonth)
            .lte("horario", endOfMonth);

        // Cálculos Financeiros
        const revPaid = monthApps?.filter(a => a.pago).reduce((acc, curr) => acc + (Number(curr.valor_final) || Number(curr.servicos?.preco) || 0), 0) || 0;
        const revPredicted = monthApps?.filter(a => a.status !== 'desmarcou').reduce((acc, curr) => acc + (Number(curr.servicos?.preco) || 0), 0) || 0;

        // Cálculo de Ocupação (Baseado em 8h de trabalho = 480 min)
        const totalMinutesWorked = appsToday?.filter(a => a.status !== 'desmarcou').reduce((acc, curr) => acc + (curr.servicos?.duracao_minutos || 0), 0) || 0;
        const occRate = Math.min(Math.round((totalMinutesWorked / 480) * 100), 100);

        // Pendências de Hoje
        const pending = appsToday?.filter(a => a.status === 'pendente').length || 0;

        setStats({
            clients: clientCount || 0,
            appsToday: appsToday?.length || 0,
            revenuePaid: revPaid,
            revenuePredicted: revPredicted,
            occupationRate: occRate,
            pendingConfirmations: pending
        });
        setNextApps(appsToday || []);
        setLoading(false);
    }

    useEffect(() => { fetchDashboardData(); }, []);

    // Encontra o próximo agendamento (o primeiro que ainda não passou da hora atual)
    const nextAppointment = useMemo(() => {
        const now = new Date();
        return nextApps.find(app => new Date(app.horario) > now && app.status !== 'desmarcou');
    }, [nextApps]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-6 text-muted-foreground animate-in fade-in duration-700">
            <div className="relative">
                <Loader2 className="animate-spin w-16 h-16 text-primary/40" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="font-black text-primary uppercase tracking-[0.3em] text-xs">Preparando seu Studio Premium...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20">
            {/* Header Executivo */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none">
                        Olá, <span className="text-primary italic">Gabriela</span> ✨
                    </h2>
                    <p className="text-muted-foreground font-medium text-lg">Seu negócio está brilhando hoje. Veja os indicadores.</p>
                </div>

                <div className="flex gap-4">
                    <Link href="/agenda" className="bg-white p-4 rounded-2xl border border-border hover:shadow-xl transition-all flex flex-col items-center gap-1 group">
                        <Calendar className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Agenda</span>
                    </Link>
                    <Link href="/whatsapp" className="bg-white p-4 rounded-2xl border border-border hover:shadow-xl transition-all flex flex-col items-center gap-1 group">
                        <MessageSquare className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground">WhatsApp</span>
                    </Link>
                </div>
            </header>

            {/* Cards de Métricas Premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign className="w-20 h-20 text-green-600" /></div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" /> Faturamento Mês
                    </p>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tighter">R$ {stats.revenuePaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground font-bold">Previsto: <span className="text-primary">R$ {stats.revenuePredicted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Target className="w-20 h-20 text-primary" /></div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> Ocupação Hoje
                    </p>
                    <div className="space-y-2">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stats.occupationRate}%</p>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${stats.occupationRate}%` }} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Users className="w-20 h-20 text-blue-500" /></div>
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" /> Clientes Ativas
                    </p>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stats.clients}</p>
                        <p className="text-xs text-muted-foreground font-bold">Base de dados premium</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-border relative overflow-hidden group border-l-8 border-l-orange-500">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle className="w-20 h-20 text-orange-500" /></div>
                    <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-4 flex items-center gap-2 font-bold">
                        <MessageSquare className="w-4 h-4" /> Ações Pendentes
                    </p>
                    <div className="space-y-1">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stats.pendingConfirmations}</p>
                        <Link href="/whatsapp" className="text-xs text-orange-600 font-black flex items-center gap-1 hover:underline">
                            Confirmar na Central <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Grid Principal: Próximo Atendimento e Atalhos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Destaque: Próximo Atendimento */}
                <section className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                            <Clock className="w-6 h-6 text-primary" /> Próxima na Fila
                        </h3>
                        <Link href="/agenda" className="text-primary text-sm font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                            Ver Escala <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {nextAppointment ? (
                        <div className="bg-gradient-to-br from-white to-primary/5 p-10 rounded-[3rem] border border-primary/20 shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="space-y-4 text-center md:text-left">
                                    <div className="bg-primary text-white font-black text-xl px-8 py-3 rounded-full shadow-lg shadow-primary/30 inline-block">
                                        {new Date(nextAppointment.horario).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <h4 className="text-4xl font-black text-foreground tracking-tighter">{nextAppointment.clientes?.nome}</h4>
                                    <div className="flex items-center justify-center md:justify-start gap-3">
                                        <span className="bg-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-border shadow-sm">
                                            {nextAppointment.servicos?.nome}
                                        </span>
                                        <span className="text-muted-foreground font-bold italic">≈ {nextAppointment.servicos?.duracao_minutos} min</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 w-full md:w-fit">
                                    <Link
                                        href="/whatsapp"
                                        className="bg-green-500 text-white font-black px-10 py-5 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all text-lg"
                                    >
                                        <MessageSquare className="w-6 h-6" /> Chamar WhatsApp
                                    </Link>
                                    <p className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        Clique para confirmar presença agora
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-muted/10 p-20 rounded-[3rem] border-2 border-dashed border-border flex flex-col items-center gap-4 text-muted-foreground">
                            <Sparkles className="w-12 h-12 opacity-20" />
                            <p className="font-black text-sm uppercase tracking-widest italic">Nenhum atendimento próximo na fila</p>
                        </div>
                    )}
                </section>

                {/* Atalhos Rápidos e Gestão */}
                <section className="lg:col-span-4 space-y-6">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight px-2 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary" /> Gestão Estúdio
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/clientes" className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 text-center group">
                            <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Users className="w-6 h-6" /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Novas Clientes</span>
                        </Link>
                        <Link href="/financeiro" className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 text-center group">
                            <div className="p-4 bg-green-50 rounded-2xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors"><DollarSign className="w-6 h-6" /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Relatório Financeiro</span>
                        </Link>
                        <Link href="/servicos" className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 text-center group">
                            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Target className="w-6 h-6" /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Meus Serviços</span>
                        </Link>
                        <Link href="/config" className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all flex flex-col items-center gap-4 text-center group">
                            <div className="p-4 bg-muted rounded-2xl text-muted-foreground group-hover:bg-foreground group-hover:text-white transition-colors"><Clock className="w-6 h-6" /></div>
                            <span className="text-xs font-black uppercase tracking-widest text-foreground">Expediente</span>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
