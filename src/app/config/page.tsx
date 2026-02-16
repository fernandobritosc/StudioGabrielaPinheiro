"use client";

import { useEffect, useState } from "react";
import { Save, Clock, Calendar, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const diasLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function ConfigPage() {
    const [horarios, setHorarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [excecoes, setExcecoes] = useState<any[]>([]);
    const [novaExcecao, setNovaExcecao] = useState({ data: "", motivo: "" });

    async function fetchConfig() {
        setLoading(true);
        const { data: hor } = await supabase.from("horario_funcionamento").select("*").order("dia_semana");
        const { data: exc } = await supabase.from("excecoes_horario").select("*").order("data");
        setHorarios(hor || []);
        setExcecoes(exc || []);
        setLoading(false);
    }

    useEffect(() => { fetchConfig(); }, []);

    async function handleSave() {
        setSaving(true);
        const { error } = await supabase.from("horario_funcionamento").upsert(horarios);
        setSaving(false);
        if (!error) {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } else {
            alert("Erro ao salvar: " + error.message);
        }
    }

    async function handleAddExcecao() {
        if (!novaExcecao.data) return;
        const { error } = await supabase.from("excecoes_horario").insert([novaExcecao]);
        if (!error) {
            setNovaExcecao({ data: "", motivo: "" });
            fetchConfig();
        } else {
            console.error("Erro ao salvar feriado:", error);
            alert("Erro ao salvar feriado: " + error.message);
        }
    }

    async function handleRemoveExcecao(id: string) {
        await supabase.from("excecoes_horario").delete().eq("id", id);
        fetchConfig();
    }

    const updateDay = (dia: number, field: string, value: any) => {
        setHorarios(horarios.map(h => h.dia_semana === dia ? { ...h, [field]: value } : h));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <p className="text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-xs">Sincronizando Configurações...</p>
        </div>
    );

    return (
        <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="space-y-2">
                <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">Ajustes Studio</span>
                <h2 className="text-4xl font-black text-foreground tracking-tight">Configurações Gerais</h2>
                <p className="text-muted-foreground font-medium">Controle seu horário de padrão e defina seus dias de descanso. ✨</p>
            </header>

            {/* Horário Semanal */}
            <section className="bg-white rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
                <div className="p-8 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><Clock className="w-5 h-5" /></div>
                        <h3 className="font-black text-foreground uppercase tracking-tight">Horário de Funcionamento</h3>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : (success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                        {saving ? "Gravando..." : (success ? "Salvo com Sucesso!" : "Salvar Horários")}
                    </button>
                </div>

                <div className="divide-y divide-border">
                    {horarios.map(h => (
                        <div key={h.dia_semana} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${h.aberto ? 'bg-white' : 'bg-muted/50 grayscale'}`}>
                            <div className="flex items-center gap-4 w-40">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={h.aberto}
                                        onChange={e => updateDay(h.dia_semana, 'aberto', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <span className={`font-black ${h.aberto ? 'text-foreground' : 'text-muted-foreground'}`}>{diasLabels[h.dia_semana]}</span>
                            </div>

                            {h.aberto ? (
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Início</span>
                                        <input
                                            type="time"
                                            value={h.hora_inicio}
                                            onChange={e => updateDay(h.dia_semana, 'hora_inicio', e.target.value)}
                                            className="p-3 bg-muted/30 border border-border rounded-xl font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                    <div className="h-8 w-px bg-border mt-4 hidden md:block"></div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Fim</span>
                                        <input
                                            type="time"
                                            value={h.hora_fim}
                                            onChange={e => updateDay(h.dia_semana, 'hora_fim', e.target.value)}
                                            className="p-3 bg-muted/30 border border-border rounded-xl font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-500 font-bold italic bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-in slide-in-from-right-2 duration-300">
                                    <AlertCircle className="w-4 h-4" /> Estúdio Fechado
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Exceções: Feriados e Folgas */}
            <section className="bg-white rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
                <div className="p-8 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-100"><Calendar className="w-5 h-5" /></div>
                        <h3 className="font-black text-foreground uppercase tracking-tight">Feriados e Exceções</h3>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/10 p-6 rounded-[2rem] border border-dashed border-border">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Nova Data</span>
                            <input
                                type="date"
                                value={novaExcecao.data}
                                onChange={e => setNovaExcecao({ ...novaExcecao, data: e.target.value })}
                                className="p-3 bg-white border border-border rounded-xl font-bold outline-none"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Motivo / Nome</span>
                            <input
                                type="text"
                                placeholder="Ex: Feriado Pascal"
                                value={novaExcecao.motivo}
                                onChange={e => setNovaExcecao({ ...novaExcecao, motivo: e.target.value })}
                                className="p-3 bg-white border border-border rounded-xl font-bold outline-none"
                            />
                        </div>
                        <button
                            onClick={handleAddExcecao}
                            className="bg-foreground text-white font-black rounded-xl hover:bg-primary transition-all self-end h-[50px] active:scale-95"
                        >
                            Bloquear Agenda
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {excecoes.length === 0 ? (
                            <p className="col-span-2 text-center text-muted-foreground italic py-4">Nenhuma exceção cadastrada.</p>
                        ) : (
                            excecoes.map(exc => (
                                <div key={exc.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl group transition-all">
                                    <div>
                                        <p className="font-black text-orange-950 uppercase text-xs tracking-widest">
                                            {exc.data.split('-').reverse().join('/')}
                                        </p>
                                        <p className="font-bold text-orange-800">{exc.motivo || "Sem motivo"}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveExcecao(exc.id)}
                                        className="p-2 text-orange-300 hover:text-red-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
