"use client";

import { useEffect, useState, useMemo } from "react";
import { MessageCircle, Send, Clock, Calendar, Search, Loader2, Sparkles, User, ChevronRight, MessageSquarePlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function WhatsAppPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [customMessage, setCustomMessage] = useState("");

    async function fetchData() {
        setLoading(true);
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        // 1. Busca agendamentos de hoje
        const { data: apps } = await supabase
            .from("agendamentos")
            .select("*, clientes(nome, telefone), servicos(nome)")
            .gte("horario", startOfDay)
            .lte("horario", endOfDay)
            .order("horario");

        // 2. Busca lista geral de clientes para o "Novo Chamado"
        const { data: allClients } = await supabase
            .from("clientes")
            .select("*")
            .order("nome");

        setAppointments(apps || []);
        setClients(allClients || []);
        setLoading(false);
    }

    useEffect(() => { fetchData(); }, []);

    // Lógica de WhatsApp Blindada (Unicode Emojis + API Oficial)
    function handleSendMessage(telRaw: string, nome: string, msg: string) {
        const tel = String(telRaw).replace(/\D/g, "");
        if (!tel) {
            alert("⚠️ Cliente sem telefone cadastrado!");
            return;
        }
        window.open(`https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(msg)}`, '_blank');
    }

    function handleConfirm(app: any) {
        const msg = `Olá, ${app.clientes?.nome}! \uD83C\uDF38\nConfirmado seu horário de hoje às ${new Date(app.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} para ${app.servicos?.nome}? \u2728`;
        handleSendMessage(app.clientes?.telefone, app.clientes?.nome, msg);
    }

    function handleAnticipate(app: any) {
        const msg = `Olá, ${app.clientes?.nome}! \u2728\nTerminei meu atendimento anterior um pouco mais cedo. Se você quiser adiantar o seu horário de hoje, já estou disponível! \uD83C\uDF38`;
        handleSendMessage(app.clientes?.telefone, app.clientes?.nome, msg);
    }

    const filteredClients = clients.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    const pendingConfirmations = appointments.filter(a => a.status === 'pendente');
    const upcomingToday = appointments.filter(a => a.status !== 'concluido' && a.status !== 'desmarcou');

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <h2 className="text-4xl font-black text-foreground tracking-tight">Central de Confirmação</h2>
                    <p className="text-muted-foreground font-medium">Gerencie a comunicação e o fluxo do seu estúdio em tempo real. ✨</p>
                </div>
                <div className="bg-primary/5 px-6 py-3 rounded-3xl border border-primary/10 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-black text-primary uppercase tracking-widest text-xs">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

                {/* Coluna de Operação: Agenda de Hoje */}
                <div className="xl:col-span-8 space-y-10">

                    {/* Seção 1: Confirmar Pendentes */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-200">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Confirmar Hoje ({pendingConfirmations.length})</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? <div className="col-span-2 h-32 flex items-center justify-center bg-muted/10 rounded-[2rem] animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> :
                                pendingConfirmations.length === 0 ? (
                                    <div className="col-span-2 p-8 bg-green-50/50 border border-green-100 rounded-[2rem] text-center">
                                        <p className="text-green-700 font-bold">✨ Todas as clientes de hoje estão confirmadas!</p>
                                    </div>
                                ) : (
                                    pendingConfirmations.map(app => (
                                        <div key={app.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl transition-all group border-l-8 border-l-blue-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-black text-lg text-foreground tracking-tight">{app.clientes?.nome}</p>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{app.servicos?.nome}</p>
                                                </div>
                                                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl font-black text-sm">
                                                    {new Date(app.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleConfirm(app)}
                                                className="w-full bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 active:scale-95"
                                            >
                                                <Send className="w-4 h-4" /> Solicitar Confirmação
                                            </button>
                                        </div>
                                    ))
                                )}
                        </div>
                    </section>

                    {/* Seção 2: Antecipação de Agenda */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-xl shadow-lg shadow-green-200">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Antecipar Atendimento</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? <div className="col-span-2 h-32 bg-muted/10 rounded-[2rem] animate-pulse" /> :
                                upcomingToday.length === 0 ? (
                                    <div className="col-span-2 p-8 bg-muted/20 rounded-[2rem] text-center italic text-muted-foreground">Nenhuma cliente próxima para antecipar.</div>
                                ) : (
                                    upcomingToday.map(app => (
                                        <div key={app.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm hover:shadow-lg transition-all border-l-8 border-l-green-500">
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="font-black text-foreground tracking-tight">{app.clientes?.nome}</p>
                                                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-widest border border-green-100">
                                                    {new Date(app.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAnticipate(app)}
                                                className="w-full bg-green-50 text-green-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all border border-green-200"
                                            >
                                                <Clock className="w-4 h-4" /> Avisar Adiantamento
                                            </button>
                                        </div>
                                    ))
                                )}
                        </div>
                    </section>
                </div>

                {/* Coluna de Apoio: Busca e Novo Chamado */}
                <div className="xl:col-span-4 space-y-8">

                    {/* Novo Chamado Personalizado */}
                    <div className="bg-white p-8 rounded-[3rem] border border-border shadow-xl space-y-6 sticky top-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <MessageSquarePlus className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Novo Chamado</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Buscar qualquer cliente..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-muted/5 font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-border rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden">
                                        {filteredClients.length === 0 ? (
                                            <div className="p-4 text-sm text-center text-muted-foreground">Nenhuma cliente encontrada.</div>
                                        ) : (
                                            filteredClients.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => { setSelectedClient(c); setSearchTerm(""); }}
                                                    className="w-full text-left p-4 hover:bg-primary/5 transition-colors border-b border-border/50 flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="font-bold text-sm text-foreground">{c.nome}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black">{c.telefone}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedClient && (
                                <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm"><User className="w-5 h-5 text-primary" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Enviar para:</p>
                                            <p className="text-sm font-black text-foreground tracking-tight">{selectedClient.nome}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedClient(null)} className="absolute top-4 right-4 text-primary hover:scale-110 transition-all font-black">X</button>
                                    <div className="mt-4">
                                        <textarea
                                            placeholder="Digite sua mensagem aqui..."
                                            className="w-full p-4 rounded-2xl border border-border bg-white h-32 outline-none focus:ring-4 focus:ring-primary/10 font-medium text-sm transition-all"
                                            value={customMessage}
                                            onChange={e => setCustomMessage(e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleSendMessage(selectedClient.telefone, selectedClient.nome, customMessage)}
                                            disabled={!customMessage}
                                            className="w-full mt-3 bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                                        >
                                            <Send className="w-4 h-4" /> Enviar Mensagem
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!selectedClient && (
                                <div className="p-8 text-center bg-muted/5 border-2 border-dashed border-border rounded-[2.5rem]">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                                        Busque uma cliente acima para<br />iniciar um novo chamado
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
