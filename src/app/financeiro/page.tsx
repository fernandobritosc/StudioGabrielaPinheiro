"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Printer, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function FinancialPage() {
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [pendingRevenue, setPendingRevenue] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);

    async function fetchFinancialData() {
        setLoading(true);

        // Criar datas de início e fim do mês
        const startDate = new Date(viewYear, viewMonth, 1).toISOString();
        const endDate = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();

        // Buscar agendamentos do mês selecionado
        const { data: apps, error } = await supabase
            .from("agendamentos")
            .select("*, clientes(nome, telefone), servicos(nome, preco)")
            .gte('horario', startDate)
            .lte('horario', endDate);

        if (!error && apps) {
            // 1. Total Recebido = Sinais pagos + Saldo de serviços concluídos e pagos
            const totalSinais = apps.filter(a => a.sinal_pago).reduce((acc, current) => acc + (Number(current.sinal_valor) || 0), 0);
            const totalSaldosFinalizados = apps.filter(a => a.status === 'concluido' && a.pago).reduce((acc, current) => {
                const resto = (Number(current.valor_final) || 0) - (Number(current.sinal_valor) || 0);
                return acc + (resto > 0 ? resto : 0);
            }, 0);

            // 2. A Receber = Saldo de serviços concluídos mas com pagamento agendado
            const pending = apps.filter(a => a.status === 'concluido' && !a.pago).reduce((acc, current) => {
                const resto = (Number(current.valor_final) || 0) - (Number(current.sinal_valor) || 0);
                return acc + (resto > 0 ? resto : 0);
            }, 0);

            setTotalRevenue(totalSinais + totalSaldosFinalizados);
            setPendingRevenue(pending);

            // Filtrar para mostrar no histórico tudo que teve movimentação no mês
            const timelineApps = apps.filter(a => a.sinal_pago || a.status === 'concluido').sort((a, b) => new Date(b.data_pagamento || b.horario).getTime() - new Date(a.data_pagamento || a.horario).getTime());
            setTransactions(timelineApps);
        }
        setLoading(false);
    }

    useEffect(() => { fetchFinancialData(); }, [viewMonth, viewYear]);

    function handleWhatsAppCobrar(t: any) {
        const telRaw = t.clientes?.telefone || "";
        const tel = String(telRaw).replace(/\D/g, "");
        const valorRestante = (Number(t.valor_final) || 0) - (Number(t.sinal_valor) || 0);
        const msg = `Olá, ${t.clientes?.nome}! \uD83C\uDF38\nTudo bem? Passando para lembrar do seu pagamento pendente ref. ao serviço de ${t.servicos?.nome} no valor de R$ ${valorRestante.toFixed(2)}.\n\nQualquer dúvida estou à disposição! \u2728`;
        window.open(`https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(msg)}`, '_blank');
    }

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Financeiro</h2>
                    <p className="text-muted-foreground">Acompanhe o crescimento real do estúdio Gabriela Pinheiro.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-border shadow-sm">
                    <select
                        value={viewMonth}
                        onChange={(e) => setViewMonth(Number(e.target.value))}
                        className="bg-transparent font-bold text-sm outline-none px-4 py-2 cursor-pointer"
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <div className="w-px h-6 bg-border" />
                    <select
                        value={viewYear}
                        onChange={(e) => setViewYear(Number(e.target.value))}
                        className="bg-transparent font-bold text-sm outline-none px-4 py-2 cursor-pointer"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </header>

            {loading ? <div className="flex flex-col items-center justify-center p-32 gap-4"><Loader2 className="animate-spin text-primary w-12 h-12" /><p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Calculando fechamento...</p></div> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
                            <div className="p-3 bg-green-50 rounded-2xl w-fit mb-4"><TrendingUp className="text-green-600 w-6 h-6" /></div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Total Recebido</p>
                            <p className="text-3xl font-black mt-1 text-green-600">R$ {totalRevenue.toFixed(2)}</p>
                            <p className="text-[10px] text-green-600/60 font-bold mt-2 uppercase">Entradas Confirmadas</p>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
                            <div className="p-3 bg-orange-50 rounded-2xl w-fit mb-4"><TrendingDown className="text-orange-600 w-6 h-6" /></div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">A Receber</p>
                            <p className="text-3xl font-black mt-1 text-orange-600">R$ {pendingRevenue.toFixed(2)}</p>
                            <p className="text-[10px] text-orange-600/60 font-bold mt-2 uppercase">Pendentes ou Agendados</p>
                        </div>
                        <div className="bg-primary p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 text-white relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-8 opacity-10"><DollarSign className="w-24 h-24" /></div>
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md w-fit mb-4"><DollarSign className="text-white w-6 h-6" /></div>
                            <p className="text-[10px] text-white/60 uppercase font-black tracking-[0.2em]">Previsão Mensal</p>
                            <p className="text-3xl font-black mt-1">R$ {(totalRevenue + pendingRevenue).toFixed(2)}</p>
                            <p className="text-[10px] text-white/60 font-bold mt-2 uppercase">Fechamento Estimado</p>
                        </div>
                    </div>

                    <section className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-border flex justify-between items-center">
                            <h3 className="font-black text-foreground uppercase tracking-widest text-xs">Histórico de Movimentação ({months[viewMonth]})</h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:opacity-70 transition-all"><Printer className="w-4 h-4" /> Exportar PDF</button>
                        </div>
                        <div className="divide-y divide-border">
                            {transactions.length === 0 ? (
                                <div className="p-24 text-center">
                                    <div className="p-4 bg-muted/20 rounded-full w-fit mx-auto mb-4 text-muted-foreground/30"><DollarSign className="w-12 h-12" /></div>
                                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Nenhuma venda registrada em {months[viewMonth]}.</p>
                                </div>
                            ) : (
                                transactions.map((t) => {
                                    const hasSinal = t.sinal_pago;
                                    const isConcluido = t.status === 'concluido';
                                    const valorRestante = (Number(t.valor_final) || 0) - (Number(t.sinal_valor) || 0);

                                    return (
                                        <div key={t.id} className="divide-y divide-border/50">
                                            {/* Mostrar o sinal se ele existir */}
                                            {hasSinal && (
                                                <div className="p-8 flex items-center justify-between hover:bg-muted/30 transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="p-4 rounded-2xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                                                            <ArrowUpRight className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-lg flex items-center gap-3">
                                                                Sinal: {t.servicos?.nome}
                                                                <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-[0.1em] bg-purple-100 text-purple-700">
                                                                    {t.sinal_metodo || 'Pix'}
                                                                </span>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground font-bold mt-1">Cliente: {t.clientes?.nome} • {new Date(t.horario).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-xl text-purple-600">+ R$ {Number(t.sinal_valor || 0).toFixed(2)}</p>
                                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mt-1">Sinal Recebido</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mostrar o saldo final se o serviço estiver concluído */}
                                            {isConcluido && (
                                                <div className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-muted/30 transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${t.pago ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                                            <ArrowUpRight className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <p className="font-black text-lg">Saldo: {t.servicos?.nome}</p>
                                                                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-[0.1em] ${t.metodo_pagamento === 'Pix' ? 'bg-purple-100 text-purple-700' :
                                                                    t.metodo_pagamento === 'Agendado' ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-primary/10 text-primary'
                                                                    }`}>
                                                                    {t.metodo_pagamento || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground font-bold italic">Cliente: {t.clientes?.nome} • {new Date(t.data_pagamento || t.horario).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        {!t.pago && (
                                                            <button
                                                                onClick={() => handleWhatsAppCobrar(t)}
                                                                className="flex flex-col items-center gap-1 group/wa"
                                                            >
                                                                <div className="p-3 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm">
                                                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                                                                </div>
                                                                <span className="text-[8px] font-black uppercase text-green-600 transition-all opacity-0 group-hover/wa:opacity-100">Cobrar</span>
                                                            </button>
                                                        )}
                                                        <div className="text-right">
                                                            <p className={`font-black text-xl ${t.pago ? 'text-green-600' : 'text-orange-600'}`}>
                                                                + R$ {valorRestante.toFixed(2)}
                                                            </p>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{t.pago ? 'Saldo Recebido' : 'Aguardando'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
