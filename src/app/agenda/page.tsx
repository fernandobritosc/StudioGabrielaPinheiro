"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, X, Clock as ClockIcon, Trash2, Edit3, AlertCircle, CheckCircle, Sparkles, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Agendamento {
    id: string;
    horario: string;
    status: string;
    cliente_id: string;
    servico_id: string;
    clientes: { nome: string };
    servicos: { nome: string, duracao_minutos: number, preco: number };
    valor_final?: number;
}

export default function CalendarPage() {
    const [appointments, setAppointments] = useState<Agendamento[]>([]);
    const [monthAppointments, setMonthAppointments] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMonth, setViewMonth] = useState(new Date());
    const [newApp, setNewApp] = useState({ cliente_id: "", servico_id: "", data: "", hora: "" });
    const [clientAlert, setClientAlert] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Estados para o Sinal
    const [receiveSignal, setReceiveSignal] = useState(false);
    const [signalForm, setSignalForm] = useState({ valor: 0, metodo: "Pix" });

    // Estados para o Financeiro
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAppForPayment, setSelectedAppForPayment] = useState<any>(null);
    const [paymentForm, setPaymentForm] = useState({ valor_final: 0, metodo: "Pix", data_pagamento: new Date().toISOString().split('T')[0] });

    async function fetchData() {
        setLoading(true);
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Busca agendamentos do dia selecionado
        const { data: apps } = await supabase
            .from("agendamentos")
            .select("*, clientes(nome, telefone), servicos(nome, duracao_minutos, preco)")
            .gte("horario", dayStart.toISOString())
            .lte("horario", dayEnd.toISOString())
            .order("horario");

        // Busca agendamentos do mês inteiro para os indicadores
        const startOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
        const endOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        const { data: monthApps } = await supabase
            .from("agendamentos")
            .select("horario")
            .gte("horario", startOfMonth.toISOString())
            .lte("horario", endOfMonth.toISOString());

        const { data: cls } = await supabase.from("clientes").select("id, nome").order("nome");
        const { data: svs } = await supabase.from("servicos").select("id, nome, duracao_minutos, preco").order("nome");

        const diaSemana = selectedDate.getDay();
        const { data: conf } = await supabase.from("horario_funcionamento").select("*").eq("dia_semana", diaSemana).single();

        setAppointments(apps || []);
        setMonthAppointments(monthApps || []);
        setClients(cls || []);
        setServices(svs || []);
        setConfig(conf);
        setLoading(false);
    }

    async function checkClientHistory(clientId: string) {
        if (!clientId) {
            setClientAlert(null);
            return;
        }
        const { data } = await supabase
            .from("agendamentos")
            .select("id")
            .eq("cliente_id", clientId)
            .eq("status", "faltou");

        if (data && data.length > 0) {
            setClientAlert("⚠️ ESTA CLIENTE POSSUI HISTÓRICO DE FALTAS! Solicitar pagamento antecipado de 50% para confirmar.");
        } else {
            setClientAlert(null);
        }
    }

    function handleConfirmHorario(app: any) {
        const telRaw = app.clientes?.telefone || "";
        const tel = String(telRaw).replace(/\D/g, "");
        const msg = `Olá, ${app.clientes?.nome}! \uD83C\uDF38\nConfirmado seu horário de hoje às ${new Date(app.horario).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} para ${app.servicos?.nome}? \u2728`;
        window.open(`https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(msg)}`, '_blank');
    }

    function handleAnticiparHorario(app: any) {
        const telRaw = app.clientes?.telefone || "";
        const tel = String(telRaw).replace(/\D/g, "");
        const msg = `Olá, ${app.clientes?.nome}! \u2728\nTerminei meu atendimento anterior um pouco mais cedo. Se você quiser adiantar o seu horário de hoje, já estou disponível! \uD83C\uDF38`;
        window.open(`https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(msg)}`, '_blank');
    }

    async function updateStatus(app: any, newStatus: string) {
        if (newStatus === 'concluido') {
            setSelectedAppForPayment(app);
            // Se já foi pago um sinal, deduzir do valor final mostrado
            const vFinal = (app.servicos?.preco || 0) - (app.sinal_valor || 0);
            setPaymentForm({
                valor_final: vFinal > 0 ? vFinal : 0,
                metodo: "Pix",
                data_pagamento: new Date().toISOString().split('T')[0]
            });
            setShowPaymentModal(true);
            return;
        }
        const { error } = await supabase.from("agendamentos").update({ status: newStatus }).eq("id", app.id);
        if (!error) fetchData();
    }

    async function handleFinalizePayment(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedAppForPayment) return;

        setIsSaving(true);
        // O valor final no banco será a soma do sinal + o pago no dia
        const totalPago = (selectedAppForPayment.sinal_valor || 0) + paymentForm.valor_final;

        const { error } = await supabase.from("agendamentos").update({
            status: "concluido",
            pago: paymentForm.metodo !== "Agendado",
            valor_final: totalPago,
            metodo_pagamento: paymentForm.metodo,
            data_pagamento: paymentForm.data_pagamento
        }).eq("id", selectedAppForPayment.id);

        if (!error) {
            setShowPaymentModal(false);
            fetchData();
        } else {
            alert("Erro ao salvar: " + error.message);
        }
        setIsSaving(false);
    }

    useEffect(() => {
        fetchData();
        setNewApp(prev => ({ ...prev, data: selectedDate.toISOString().split('T')[0] }));
    }, [selectedDate, viewMonth]);

    const timelineData = useMemo(() => {
        if (!config || !config.aberto) return [];

        const buffer = 15;
        const [startH, startM] = config.hora_inicio.split(':').map(Number);
        const [endH, endM] = config.hora_fim.split(':').map(Number);

        const dayStart = new Date(selectedDate);
        dayStart.setHours(startH, startM, 0, 0);
        const dayEnd = new Date(selectedDate);
        dayEnd.setHours(endH, endM, 0, 0);

        const items: any[] = [];
        let cursor = new Date(dayStart);

        // Adicionar Agendamentos e Horários Livres na sequência
        // Filtramos os 'desmarcou' para liberar o espaço na timeline visual
        const validApps = appointments.filter(a => a.status !== 'desmarcou');
        const sortedApps = [...validApps].sort((a, b) => new Date(a.horario).getTime() - new Date(b.horario).getTime());

        sortedApps.forEach(app => {
            const appStart = new Date(app.horario);

            // Se houver espaço entre o cursor e o início deste agendamento
            if (appStart > cursor) {
                const diff = (appStart.getTime() - cursor.getTime()) / 60000;
                if (diff >= 1) {
                    items.push({
                        type: 'free',
                        start: new Date(cursor),
                        end: new Date(appStart),
                        duration: diff
                    });
                }
            }

            const appEnd = new Date(appStart.getTime() + app.servicos.duracao_minutos * 60000);
            items.push({
                type: 'busy',
                data: app,
                start: appStart,
                end: appEnd,
                duration: app.servicos.duracao_minutos
            });

            // O cursor pula para o fim do agendamento + buffer
            cursor = new Date(appEnd.getTime() + buffer * 60000);
        });

        // Espaço livre até o fim do expediente
        if (cursor < dayEnd) {
            const diff = (dayEnd.getTime() - cursor.getTime()) / 60000;
            if (diff >= 1) {
                items.push({
                    type: 'free',
                    start: new Date(cursor),
                    end: new Date(dayEnd),
                    duration: diff
                });
            }
        }

        return items;
    }, [appointments, config, selectedDate]);

    // Lógica para Sugestão de Horários Disponíveis
    const availableStaffSlots = useMemo(() => {
        if (!config || !config.aberto || !newApp.servico_id) return [];

        const selectedService = services.find(s => s.id === newApp.servico_id);
        if (!selectedService) return [];

        const duration = selectedService.duracao_minutos;
        const slots: string[] = [];

        // Percorre cada slot livre da timeline e extrai os horários possíveis
        timelineData.filter(item => item.type === 'free').forEach(slot => {
            if (slot.duration >= duration) { // O serviço cabe
                let current = new Date(slot.start);
                const limit = new Date(slot.end.getTime() - duration * 60000);

                while (current <= limit) {
                    slots.push(current.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
                    current = new Date(current.getTime() + 15 * 60000); // Sugere de 15 em 15 min
                }
            }
        });

        return slots;
    }, [timelineData, newApp.servico_id, services, config]);

    async function handleAddAppointment(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        const localDateTime = new Date(`${newApp.data}T${newApp.hora}:00`);
        const isoString = localDateTime.toISOString();

        const selectedService = services.find(s => s.id === newApp.servico_id);
        const duration = selectedService?.duracao_minutos || 60;
        const buffer = 15;
        const newStart = localDateTime.getTime();
        const newEnd = newStart + (duration + buffer) * 60000;

        const hasOverlap = appointments.some(app => {
            if (editingId && app.id === editingId) return false;
            // Ignorar agendamentos desmarcados para permitir encaixe
            if (app.status === 'desmarcou') return false;

            const appStart = new Date(app.horario).getTime();
            const appEnd = appStart + (app.servicos?.duracao_minutos + buffer) * 60000;
            return (newStart < appEnd && newEnd > appStart);
        });

        if (hasOverlap) {
            alert("⚠️ CONFLITO DE HORÁRIO! O sistema reserva 15min entre clientes.");
            setIsSaving(false);
            return;
        }

        const { error } = editingId
            ? await supabase.from("agendamentos").update({
                cliente_id: newApp.cliente_id,
                servico_id: newApp.servico_id,
                horario: isoString
            }).eq("id", editingId)
            : await supabase.from("agendamentos").insert([{
                cliente_id: newApp.cliente_id,
                servico_id: newApp.servico_id,
                horario: isoString,
                status: 'pendente',
                sinal_valor: receiveSignal ? signalForm.valor : 0,
                sinal_metodo: receiveSignal ? signalForm.metodo : null,
                sinal_pago: receiveSignal
            }]);

        if (!error) {
            setShowModal(false);
            setEditingId(null);
            setClientAlert(null);
            setReceiveSignal(false);
            fetchData();
        }
        else alert("Erro: " + error.message);
        setIsSaving(false);
    }

    function handleEdit(app: any) {
        const dateObj = new Date(app.horario);
        const dataStr = dateObj.toISOString().split('T')[0];
        const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        setEditingId(app.id);
        setNewApp({
            cliente_id: app.cliente_id,
            servico_id: app.servico_id,
            data: dataStr,
            hora: horaStr
        });
        setReceiveSignal(false); // Reseta o sinal para não cobrar de novo no reagendamento por padrão
        setClientAlert(null);
        setShowModal(true);
    }

    async function handleDelete(id: string) {
        if (confirm("Deseja excluir?")) {
            await supabase.from("agendamentos").delete().eq("id", id);
            fetchData();
        }
    }

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
    const calendarDays = [];
    const totalDays = daysInMonth(viewMonth.getFullYear(), viewMonth.getMonth());
    const startDay = firstDayOfMonth(viewMonth.getFullYear(), viewMonth.getMonth());
    for (let i = 0; i < startDay; i++) calendarDays.push(null);
    for (let i = 1; i <= totalDays; i++) calendarDays.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-[2.5rem] border border-border/50 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                        <CalendarIcon className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-foreground tracking-tight">Agenda</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Controle Profissional • Gabriela Pinheiro</p>
                    </div>
                </div>
                <button onClick={() => { setEditingId(null); setClientAlert(null); setReceiveSignal(false); setShowModal(true); }} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 flex items-center gap-2 group">
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Novo Horário
                </button>
            </header>

            {/* Modal de Agendamento */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 border border-white/20 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-foreground tracking-tight">{editingId ? "Reagendar Cliente" : "Agendar Cliente"}</h3>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-6 h-6 text-muted-foreground" /></button>
                        </div>
                        <form onSubmit={handleAddAppointment} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cliente</label>
                                <select required className="w-full p-4 rounded-2xl border border-border outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white font-bold" value={newApp.cliente_id} onChange={e => { setNewApp({ ...newApp, cliente_id: e.target.value }); checkClientHistory(e.target.value); }}>
                                    <option value="">Selecionar Cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>

                            {clientAlert && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-4 animate-shake">
                                        <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
                                        <p className="text-xs text-red-700 font-black leading-relaxed">{clientAlert}</p>
                                    </div>

                                    <div className={`p-6 rounded-3xl border-2 transition-all ${receiveSignal ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-2 border-primary text-primary focus:ring-primary transition-all cursor-pointer"
                                                checked={receiveSignal}
                                                onChange={(e) => {
                                                    setReceiveSignal(e.target.checked);
                                                    if (e.target.checked) {
                                                        const s = services.find(sv => sv.id === newApp.servico_id);
                                                        setSignalForm(prev => ({ ...prev, valor: (s?.preco || 0) / 2 }));
                                                    }
                                                }}
                                            />
                                            <span className="font-black text-sm text-foreground group-hover:text-primary transition-colors">Receber 50% de Sinal agora?</span>
                                        </label>

                                        {receiveSignal && (
                                            <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black uppercase text-primary tracking-widest">Valor do Sinal</label>
                                                    <input
                                                        type="number"
                                                        className="w-full p-3 rounded-xl border border-primary/20 bg-white font-bold text-sm outline-none"
                                                        value={signalForm.valor}
                                                        onChange={e => setSignalForm({ ...signalForm, valor: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-black uppercase text-primary tracking-widest">Método</label>
                                                    <select
                                                        className="w-full p-3 rounded-xl border border-primary/20 bg-white font-bold text-sm outline-none"
                                                        value={signalForm.metodo}
                                                        onChange={e => setSignalForm({ ...signalForm, metodo: e.target.value })}
                                                    >
                                                        <option value="Pix">Pix</option>
                                                        <option value="Dinheiro">Dinheiro</option>
                                                        <option value="Cartão">Cartão</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Serviço</label>
                                <select required className="w-full p-4 rounded-2xl border border-border outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white font-bold" value={newApp.servico_id} onChange={e => setNewApp({ ...newApp, servico_id: e.target.value })}>
                                    <option value="">Selecionar Serviço...</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.duracao_minutos}min)</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data</label>
                                    <input type="date" required className="w-full p-4 rounded-2xl border border-border outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white font-bold" value={newApp.data} onChange={e => setNewApp({ ...newApp, data: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Horário Sugerido</label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full p-4 rounded-2xl border border-border outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary bg-white font-bold appearance-none cursor-pointer"
                                            value={newApp.hora}
                                            onChange={e => setNewApp({ ...newApp, hora: e.target.value })}
                                        >
                                            <option value="">Escolha...</option>
                                            {availableStaffSlots.length === 0 ? (
                                                <option disabled>Sem horários para este serviço</option>
                                            ) : (
                                                availableStaffSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)
                                            )}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                            <ClockIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full bg-primary text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group">
                                {isSaving ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                    <>
                                        <span>Confirmar Agendamento</span>
                                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Pagamento (Financeiro) */}
            {showPaymentModal && selectedAppForPayment && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground tracking-tight">Finalizar Atendimento</h3>
                            <p className="text-sm text-muted-foreground font-bold mt-1 uppercase tracking-widest">Registrar pagamento de {selectedAppForPayment.clientes?.nome}</p>
                        </div>

                        <form onSubmit={handleFinalizePayment} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Valor Total (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full p-4 rounded-2xl border border-border outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 bg-white font-bold text-2xl text-green-600"
                                    value={paymentForm.valor_final}
                                    onChange={e => setPaymentForm({ ...paymentForm, valor_final: Number(e.target.value) })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Forma de Pagamento</label>
                                    <select
                                        className="w-full p-4 rounded-2xl border border-border bg-white font-bold text-sm"
                                        value={paymentForm.metodo}
                                        onChange={e => setPaymentForm({ ...paymentForm, metodo: e.target.value })}
                                    >
                                        <option value="Pix">Pix</option>
                                        <option value="Débito">Cartão de Débito</option>
                                        <option value="Crédito">Cartão de Crédito</option>
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Agendado">Pagar depois (Dia tal)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{paymentForm.metodo === 'Agendado' ? 'Data Prometida' : 'Data Recebimento'}</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 rounded-2xl border border-border bg-white font-bold text-sm"
                                        value={paymentForm.data_pagamento}
                                        onChange={e => setPaymentForm({ ...paymentForm, data_pagamento: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-green-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                {isSaving ? <Loader2 className="animate-spin w-6 h-6" /> : (
                                    <>
                                        <span>Concluir e Salvar no Financeiro</span>
                                        <DollarSign className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                            <button type="button" onClick={() => setShowPaymentModal(false)} className="w-full text-muted-foreground font-bold text-xs uppercase tracking-widest hover:text-foreground transition-colors">Cancelar</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
                <aside className="space-y-8">
                    {/* Mini Calendário */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))} className="p-2 hover:bg-muted rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-primary" /></button>
                            <h3 className="font-black capitalize text-foreground font-sans text-sm tracking-tight">
                                {viewMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))} className="p-2 hover:bg-muted rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-primary" /></button>
                        </div>
                        <div className="grid grid-cols-7 text-center gap-y-1 text-[10px] font-black uppercase tracking-tighter mb-4 text-muted-foreground">
                            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i} className="pb-2">{d}</span>)}
                            {calendarDays.map((date, i) => {
                                if (!date) return <div key={i} />;
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                const isToday = date.toDateString() === new Date().toDateString();

                                // Verificar se o dia está vago (sem nenhum agendamento no mês)
                                const hasApps = monthAppointments.some(app => new Date(app.horario).toDateString() === date.toDateString());

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs transition-all relative ${isSelected ? 'bg-primary text-white font-black shadow-lg shadow-primary/30 scale-110 z-10' :
                                            isToday ? 'text-primary border-2 border-primary/20 font-black' :
                                                hasApps ? 'border-2 border-green-500/50 text-green-700 font-black' :
                                                    'hover:bg-muted text-foreground font-bold opacity-60'
                                            }`}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-lg border-2 border-green-500/50 bg-green-50" />
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Dias com Agendamento</p>
                            </div>
                        </div>
                    </div>

                    {/* Dica */}
                    <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
                        <h4 className="font-black text-primary text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Dica Profissional
                        </h4>
                        <p className="text-xs text-primary/80 font-medium leading-relaxed">
                            A linha do tempo reserva automaticamente 15 min entre clientes para limpeza e organização.
                        </p>
                    </div>
                </aside>

                <div className="xl:col-span-3 space-y-6">
                    {/* Header da Timeline */}
                    <div className="bg-white px-8 py-6 rounded-[2.5rem] border border-border flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <ClockIcon className="text-primary w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-foreground tracking-tight">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                {config && config.aberto ? (
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Atendimento: {config.hora_inicio.slice(0, 5)} — {config.hora_fim.slice(0, 5)}</p>
                                ) : <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Estúdio Fechado</p>}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Vertical */}
                    <div className="relative pl-12 space-y-4 pb-10">
                        {/* Linha Vertical Base */}
                        <div className="absolute left-[23px] top-6 bottom-6 w-1 bg-gradient-to-b from-primary/5 via-primary/20 to-primary/5 rounded-full" />

                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-40 gap-4"><Loader2 className="animate-spin text-primary w-12 h-12" /><p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Sincronizando...</p></div>
                        ) : !config || !config.aberto ? (
                            <div className="bg-red-50/50 border-2 border-dashed border-red-200 rounded-[3rem] py-24 flex flex-col items-center gap-4">
                                <div className="p-4 bg-white rounded-full shadow-lg border border-red-100"><X className="w-10 h-10 text-red-400" /></div>
                                <p className="text-red-600 font-black uppercase tracking-widest text-sm italic">Estúdio Fechado</p>
                            </div>
                        ) : timelineData.length === 0 ? (
                            <div className="bg-white/40 border-2 border-dashed border-border/60 rounded-[3rem] py-32 flex flex-col items-center gap-6">
                                <CalendarIcon className="w-16 h-16 text-muted-foreground/20" />
                                <p className="text-muted-foreground font-black text-lg italic text-center px-10">Nenhum atendimento marcado.<br /><span className="text-xs uppercase tracking-widest opacity-50 block mt-2">Clique nos espaços livres para agendar</span></p>
                            </div>
                        ) : (
                            timelineData.map((item, idx) => (
                                <div key={idx} className="relative group">
                                    {/* Marcador de Hora na Linha */}
                                    <div className="absolute -left-12 top-0 bg-white border-2 border-primary/20 px-2 py-1 rounded-lg text-[10px] font-black text-primary shadow-sm z-10">
                                        {item.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="absolute -left-[9.5px] top-2.5 w-5 h-5 bg-white border-4 border-primary rounded-full shadow-md z-10" />

                                    {item.type === 'busy' ? (
                                        <div className="ml-6 bg-white p-7 rounded-[2.5rem] border border-border shadow-sm flex items-center justify-between hover:border-primary/40 transition-all duration-300">
                                            <div className="flex items-center gap-8">
                                                <div className="h-12 w-px bg-primary/20 rounded-full" />
                                                <div>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <p className="font-black text-2xl text-foreground tracking-tight">{item.data.clientes?.nome}</p>
                                                        <select
                                                            value={item.data.status}
                                                            onChange={(e) => updateStatus(item.data, e.target.value)}
                                                            className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border-0 outline-none cursor-pointer transition-all ${item.data.status === 'concluido' ? 'bg-green-100 text-green-700' :
                                                                item.data.status === 'confirmado' ? 'bg-blue-100 text-blue-700' :
                                                                    item.data.status === 'faltou' ? 'bg-red-100 text-red-700 animate-pulse' :
                                                                        item.data.status === 'desmarcou' ? 'bg-orange-100 text-orange-700' :
                                                                            'bg-primary/10 text-primary'
                                                                }`}
                                                        >
                                                            <option value="pendente">Pendente</option>
                                                            <option value="confirmado">Confirmado</option>
                                                            <option value="concluido">Concluído (Pagar)</option>
                                                            <option value="desmarcou">Desmarcou</option>
                                                            <option value="faltou">Faltou (Ausente)</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">
                                                        <span>{item.data.servicos?.nome}</span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span>{item.duration} min</span>
                                                        {item.data.status === 'concluido' && (
                                                            <>
                                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                                <span className="text-green-600 font-black">R$ {item.data.valor_final || item.data.servicos?.preco}</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Novas Ações Rápidas */}
                                                    <div className="flex items-center gap-3 mt-4">
                                                        {item.data.status === 'pendente' && (
                                                            <button
                                                                onClick={() => handleConfirmHorario(item.data)}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all group/btn"
                                                            >
                                                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Confirmar</span>
                                                            </button>
                                                        )}
                                                        {item.data.status !== 'concluido' && (
                                                            <button
                                                                onClick={() => handleAnticiparHorario(item.data)}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-600 hover:text-white transition-all group/btn"
                                                            >
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Antecipar</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEdit(item.data)} className="p-4 bg-muted/20 text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-3xl transition-all" title="Reagendar">
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(item.data.id)} className="p-4 bg-muted/20 text-muted-foreground hover:bg-red-50 hover:text-red-500 rounded-3xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingId(null);
                                                setNewApp({ ...newApp, hora: item.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
                                                setClientAlert(null);
                                                setShowModal(true);
                                            }}
                                            className="ml-6 flex items-center gap-4 p-5 rounded-[2rem] border-2 border-dashed border-green-200/50 bg-green-50/10 hover:bg-green-50 transition-all w-full text-left group/btn"
                                        >
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-green-100">
                                                <Plus className="w-4 h-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-green-600/60 uppercase tracking-widest mb-0.5">Horário Disponível</p>
                                                <p className="text-sm font-black text-green-700">Até {item.end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({item.duration} min livres)</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Link de saída para o próximo item */}
                                    <div className="h-4" />
                                </div>
                            ))
                        )}

                        {/* Marcador de Fim de Expediente */}
                        {config && config.aberto && timelineData.length > 0 && (
                            <div className="relative group">
                                <div className="absolute -left-12 top-0 bg-muted border border-border px-2 py-1 rounded-lg text-[10px] font-black text-muted-foreground shadow-sm">
                                    {config.hora_fim.slice(0, 5)}
                                </div>
                                <div className="absolute -left-[7px] top-2 w-4 h-4 bg-muted border-2 border-white rounded-full shadow-sm" />
                                <div className="ml-6 py-2 px-6 rounded-full border border-border bg-muted/20 text-[10px] font-black text-muted-foreground uppercase tracking-widest inline-block italic">
                                    Fim do Expediente
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
