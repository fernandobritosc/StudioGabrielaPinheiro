"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, Phone, Loader2, X, Edit3, Trash2, ClipboardList, AlertTriangle, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Cliente {
    id: string;
    nome: string;
    telefone: string;
    mapeamento_olhar: string;
    anamnese?: {
        alergias: string;
        problemas_oculares: string;
        gestante: boolean;
        lentes_contato: boolean;
        dorme_lado: string;
        observacoes_saude: string;
    };
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Função para formatar telefone em tempo real
    function formatTelefone(val: string) {
        const cleaned = val.replace(/\D/g, "");
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
        }
        return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
    }

    // Buscar clientes do banco
    async function fetchClients() {
        setLoading(true);
        const { data, error } = await supabase
            .from("clientes")
            .select("*")
            .order("nome");

        if (error) {
            console.error("Erro ao buscar clientes:", error);
        } else {
            setClients(data || []);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchClients();
    }, []);

    const [showModal, setShowModal] = useState(false);
    const [showAnamneseModal, setShowAnamneseModal] = useState(false);
    const [selectedClientForAnamnese, setSelectedClientForAnamnese] = useState<Cliente | null>(null);

    const [newClient, setNewClient] = useState({
        nome: "",
        telefone: "",
        mapeamento_olhar: "",
        anamnese: {
            alergias: "",
            problemas_oculares: "",
            gestante: false,
            lentes_contato: false,
            dorme_lado: "",
            observacoes_saude: ""
        }
    });

    // Salvar ou Atualizar cliente
    async function handleAddClient(e: React.FormEvent) {
        e.preventDefault();

        const { error } = editingId
            ? await supabase.from("clientes").update(newClient).eq("id", editingId)
            : await supabase.from("clientes").insert([newClient]);

        if (error) {
            alert("Erro ao salvar cliente: " + error.message);
        } else {
            setShowModal(false);
            setEditingId(null);
            resetForm();
            fetchClients();
        }
    }

    function resetForm() {
        setNewClient({
            nome: "",
            telefone: "",
            mapeamento_olhar: "",
            anamnese: {
                alergias: "",
                problemas_oculares: "",
                gestante: false,
                lentes_contato: false,
                dorme_lado: "",
                observacoes_saude: ""
            }
        });
    }

    function handleEdit(client: Cliente) {
        setEditingId(client.id);
        setNewClient({
            nome: client.nome,
            telefone: client.telefone,
            mapeamento_olhar: client.mapeamento_olhar || "",
            //@ts-ignore
            anamnese: client.anamnese || {
                alergias: "",
                problemas_oculares: "",
                gestante: false,
                lentes_contato: false,
                dorme_lado: "",
                observacoes_saude: ""
            }
        });
        setShowModal(true);
    }

    async function handleDelete(id: string) {
        if (confirm("Deseja excluir esta cliente?")) {
            await supabase.from("clientes").delete().eq("id", id);
            fetchClients();
        }
    }

    function sendAnamnese(client: Cliente) {
        const quest = `Olá ${client.nome}! ✨ Para garantir o melhor resultado e sua segurança, poderia preencher estas informações rapidinho? 😊
        
1. Possui alergias? (Esmalte, maquiagem, adesivos, etc)
2. Algum problema ocular recente?
3. Está gestante?
4. Usa lentes de contato?
5. Dorme de qual lado?
6. Alguma outra observação de saúde?

É só responder aqui embaixo! Muito obrigada! 💖`;
        const url = `https://api.whatsapp.com/send?phone=55${client.telefone.replace(/\D/g, '')}&text=${encodeURIComponent(quest)}`;
        window.open(url, '_blank');
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Clientes</h2>
                    <p className="text-muted-foreground">Gerencie sua lista de clientes e histórias reais.</p>
                </div>
                <button
                    onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <UserPlus className="w-5 h-5" />
                    Nova Cliente
                </button>
            </header>

            {/* Modal de Cadastro/Edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">{editingId ? "Editar Cliente" : "Cadastrar Nova Cliente"}</h3>
                            <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddClient} className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold block mb-1">Nome Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={newClient.nome}
                                    onChange={e => setNewClient({ ...newClient, nome: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="Ex: Maria dos Santos"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-1">Telefone / WhatsApp</label>
                                <input
                                    required
                                    type="text"
                                    value={newClient.telefone}
                                    onChange={e => setNewClient({ ...newClient, telefone: formatTelefone(e.target.value) })}
                                    className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-1 text-primary">Alergias (Importante 🚨)</label>
                                <input
                                    type="text"
                                    value={newClient.anamnese.alergias}
                                    onChange={e => setNewClient({ ...newClient, anamnese: { ...newClient.anamnese, alergias: e.target.value } })}
                                    className={`w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all ${newClient.anamnese.alergias ? 'border-red-200 bg-red-50 focus:ring-red-500' : 'border-border focus:ring-primary'}`}
                                    placeholder="Ex: Nenhuma ou Alergia a maquiagem"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold block mb-1">Observações (Lash Map)</label>
                                <textarea
                                    value={newClient.mapeamento_olhar}
                                    onChange={e => setNewClient({ ...newClient, mapeamento_olhar: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all h-20"
                                    placeholder="Ex: Tamanho 12, curvatura D..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
                            >
                                {editingId ? "Salvar Alterações" : "Salvar Cadastro"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border bg-muted/20 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-muted-foreground animate-pulse font-medium">Carregando suas clientes...</p>
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="p-12 text-center space-y-2">
                            <p className="text-lg font-bold text-muted-foreground">Nenhuma cliente cadastrada ainda.</p>
                            <p className="text-sm text-muted-foreground">Comece clicando no botão "Nova Cliente" lá em cima!</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-muted/10">
                                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Nome</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Telefone</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Histórico / Obs</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-muted-foreground text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4 font-medium">{client.nome}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{client.telefone}</td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className="text-xs bg-secondary/50 text-foreground px-3 py-1 rounded-full font-medium block w-fit">
                                                    {client.mapeamento_olhar || "Sem histórico"}
                                                </span>
                                                {client.anamnese?.alergias && (
                                                    <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-lg font-black uppercase flex items-center gap-1 w-fit border border-red-200 animate-pulse">
                                                        <AlertTriangle className="w-3 h-3" /> Alergia: {client.anamnese.alergias}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <a
                                                    href={`https://api.whatsapp.com/send?phone=55${client.telefone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={() => { setSelectedClientForAnamnese(client); setShowAnamneseModal(true); }}
                                                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Ficha Health"
                                                >
                                                    <ClipboardList className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => sendAnamnese(client)}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Enviar Anamnese"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Anamnese Detalhada */}
            {showAnamneseModal && selectedClientForAnamnese && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground tracking-tight">Ficha de Saúde</h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{selectedClientForAnamnese.nome}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAnamneseModal(false)} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-xl transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary accent-primary"
                                            checked={selectedClientForAnamnese.anamnese?.gestante || false}
                                            onChange={async (e) => {
                                                const updated = { ...selectedClientForAnamnese, anamnese: { ...selectedClientForAnamnese.anamnese, gestante: e.target.checked } };
                                                //@ts-ignore
                                                await supabase.from("clientes").update(updated).eq("id", selectedClientForAnamnese.id);
                                                setSelectedClientForAnamnese(updated);
                                                fetchClients();
                                            }}
                                        />
                                        <span className="font-bold text-sm text-foreground">Gestante</span>
                                    </label>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-lg border-border text-primary focus:ring-primary accent-primary"
                                            checked={selectedClientForAnamnese.anamnese?.lentes_contato || false}
                                            onChange={async (e) => {
                                                const updated = { ...selectedClientForAnamnese, anamnese: { ...selectedClientForAnamnese.anamnese, lentes_contato: e.target.checked } };
                                                //@ts-ignore
                                                await supabase.from("clientes").update(updated).eq("id", selectedClientForAnamnese.id);
                                                setSelectedClientForAnamnese(updated);
                                                fetchClients();
                                            }}
                                        />
                                        <span className="font-bold text-sm text-foreground">Lentes de Contato</span>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lado que Dorme</label>
                                <select
                                    className="w-full p-4 rounded-2xl border border-border bg-white font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10"
                                    value={selectedClientForAnamnese.anamnese?.dorme_lado || ""}
                                    onChange={async (e) => {
                                        const updated = { ...selectedClientForAnamnese, anamnese: { ...selectedClientForAnamnese.anamnese, dorme_lado: e.target.value } };
                                        //@ts-ignore
                                        await supabase.from("clientes").update(updated).eq("id", selectedClientForAnamnese.id);
                                        setSelectedClientForAnamnese(updated);
                                        fetchClients();
                                    }}
                                >
                                    <option value="">Não informado</option>
                                    <option value="Direito">Direito</option>
                                    <option value="Esquerdo">Esquerdo</option>
                                    <option value="Costas">Costas</option>
                                    <option value="Barriga">Barriga</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alergias e Restrições 🚨</label>
                                <textarea
                                    className="w-full p-4 p-4 rounded-2xl border border-border bg-red-50/30 font-bold text-sm text-red-600 outline-none focus:ring-4 focus:ring-red-500/10 placeholder:text-red-300"
                                    placeholder="Descreva aqui qualquer alergia..."
                                    value={selectedClientForAnamnese.anamnese?.alergias || ""}
                                    onChange={async (e) => {
                                        const updated = { ...selectedClientForAnamnese, anamnese: { ...selectedClientForAnamnese.anamnese, alergias: e.target.value } };
                                        //@ts-ignore
                                        await supabase.from("clientes").update(updated).eq("id", selectedClientForAnamnese.id);
                                        setSelectedClientForAnamnese(updated);
                                        fetchClients();
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Outras Obs. de Saúde</label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border border-border bg-white font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 h-24"
                                    placeholder="Problemas oculares, irritações, etc..."
                                    value={selectedClientForAnamnese.anamnese?.observacoes_saude || ""}
                                    onChange={async (e) => {
                                        const updated = { ...selectedClientForAnamnese, anamnese: { ...selectedClientForAnamnese.anamnese, observacoes_saude: e.target.value } };
                                        //@ts-ignore
                                        await supabase.from("clientes").update(updated).eq("id", selectedClientForAnamnese.id);
                                        setSelectedClientForAnamnese(updated);
                                        fetchClients();
                                    }}
                                />
                            </div>
                        </div>

                        <button onClick={() => setShowAnamneseModal(false)} className="w-full bg-foreground text-white font-black py-4 rounded-2xl hover:bg-primary transition-all flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Finalizar e Fechar Prontuário
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
