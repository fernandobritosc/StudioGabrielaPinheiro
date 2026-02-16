"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, Phone, Loader2, X, Edit3, Trash2, ClipboardList, AlertTriangle, Send, CheckCircle, ChevronRight, AlertCircle, Eye, User, FileText, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";

// --- Interfaces ---

interface AnamneseCompleta {
    // 1. Pessoal
    data_nascimento: string;
    profissao: string;
    instagram: string;
    endereco: string;

    // 2. Histórico Saúde
    saude_alergias: boolean;
    saude_dermatite: boolean;
    saude_ocular: boolean;
    saude_sensibilidade: boolean;
    saude_herpes: boolean;
    saude_autoimune: boolean;
    saude_diabetes: boolean;
    saude_hipertensao: boolean;
    saude_hormonal: boolean;
    saude_gestante: boolean;
    saude_medicamentos: string;
    saude_outros: string;

    // 3. Histórico Estético
    estetico_extensao: boolean;
    estetico_lash_lifting: boolean;
    estetico_brow_lamination: boolean;
    estetico_design: boolean;
    estetico_dermaplaning: boolean;
    estetico_epilacao: boolean;
    estetico_hidragloss: boolean;
    estetico_reconstrucao: boolean;
    estetico_irritacao_anterior: string;

    // 4. Avaliação Técnica
    tec_tipo_pele: string;
    tec_sensibilidade: string;
    tec_oleosidade: string;
    tec_espessura: string;
    tec_direcao: string;
    tec_falhas: string;
    tec_lesoes: string;
    tec_observacoes: string;

    // 5. Contraindicações (Bandeiras Vermelhas)
    contra_olhos_irritados: boolean;
    contra_conjuntivite: boolean;
    contra_feridas: boolean;
    contra_queimadura: boolean;
    contra_acne: boolean;
    contra_infeccao: boolean;
    contra_quimica_recente: boolean;

    // Termos
    termo_aceito: boolean;
    uso_imagem: boolean;
    data_assinatura: string;

    // Legado (campos antigos para migração suave)
    alergias?: string;
    observacoes_saude?: string;
}

interface Cliente {
    id: string;
    nome: string;
    telefone: string;
    mapeamento_olhar: string;
    anamnese: AnamneseCompleta;
}

const defaultAnamnese: AnamneseCompleta = {
    data_nascimento: "", profissao: "", instagram: "", endereco: "",
    saude_alergias: false, saude_dermatite: false, saude_ocular: false, saude_sensibilidade: false,
    saude_herpes: false, saude_autoimune: false, saude_diabetes: false, saude_hipertensao: false,
    saude_hormonal: false, saude_gestante: false, saude_medicamentos: "", saude_outros: "",
    estetico_extensao: false, estetico_lash_lifting: false, estetico_brow_lamination: false,
    estetico_design: false, estetico_dermaplaning: false, estetico_epilacao: false,
    estetico_hidragloss: false, estetico_reconstrucao: false, estetico_irritacao_anterior: "",
    tec_tipo_pele: "", tec_sensibilidade: "", tec_oleosidade: "", tec_espessura: "",
    tec_direcao: "", tec_falhas: "", tec_lesoes: "", tec_observacoes: "",
    contra_olhos_irritados: false, contra_conjuntivite: false, contra_feridas: false,
    contra_queimadura: false, contra_acne: false, contra_infeccao: false, contra_quimica_recente: false,
    termo_aceito: false, uso_imagem: false, data_assinatura: ""
};

export default function ClientsPage() {
    const [clients, setClients] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState("pessoal");
    const [saving, setSaving] = useState(false);

    const [formClient, setFormClient] = useState<Partial<Cliente>>({
        nome: "", telefone: "", mapeamento_olhar: "", anamnese: defaultAnamnese
    });

    // --- Helpers ---
    function formatTelefone(val: string) {
        const cleaned = val.replace(/\D/g, "");
        if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
        return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
    }

    async function fetchClients() {
        setLoading(true);
        const { data, error } = await supabase.from("clientes").select("*").order("nome");
        if (!error) setClients(data || []);
        setLoading(false);
    }

    useEffect(() => { fetchClients(); }, []);

    // --- Handlers ---
    function handleOpenModal(client?: Cliente) {
        if (client) {
            // Merge anamnese atual com default para garantir que novos campos existam
            setFormClient({
                ...client,
                anamnese: { ...defaultAnamnese, ...(client.anamnese || {}) }
            });
        } else {
            setFormClient({ nome: "", telefone: "", mapeamento_olhar: "", anamnese: defaultAnamnese });
        }
        setActiveTab("pessoal");
        setShowModal(true);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome: formClient.nome,
            telefone: formClient.telefone,
            mapeamento_olhar: formClient.mapeamento_olhar,
            anamnese: formClient.anamnese
        };

        const { error } = formClient.id
            ? await supabase.from("clientes").update(payload).eq("id", formClient.id)
            : await supabase.from("clientes").insert([payload]);

        if (error) {
            alert("Erro ao salvar: " + error.message);
        } else {
            setShowModal(false);
            fetchClients();
        }
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (confirm("Tem certeza que deseja excluir esta cliente?")) {
            await supabase.from("clientes").delete().eq("id", id);
            fetchClients();
        }
    }

    function sendAnamnese(client: Cliente) {
        const url = `https://api.whatsapp.com/send?phone=55${client.telefone.replace(/\D/g, '')}&text=Olá ${encodeURIComponent(client.nome)}! Poderia vir até o estúdio para preenchermos sua ficha de anamnese?`;
        window.open(url, '_blank');
    }

    // --- Components ---
    const TabButton = ({ id, icon: Icon, label }: any) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-bold text-sm flex-1 justify-center
                ${activeTab === id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
        >
            <Icon className="w-4 h-4" /> <span className="hidden md:inline">{label}</span>
        </button>
    );

    const CheckField = ({ label, checked, onChange, alert }: any) => (
        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? (alert ? 'bg-red-50 border-red-200' : 'bg-primary/5 border-primary/20') : 'bg-white border-border hover:border-primary/50'}`}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="w-5 h-5 accent-primary rounded-lg" />
            <span className={`font-medium text-sm ${alert && checked ? 'text-red-600 font-bold' : 'text-foreground'}`}>{label}</span>
            {alert && checked && <AlertTriangle className="w-4 h-4 text-red-500 ml-auto animate-pulse" />}
        </label>
    );

    const updateAnamnese = (field: keyof AnamneseCompleta, value: any) => {
        setFormClient(prev => ({
            ...prev,
            anamnese: { ...prev.anamnese!, [field]: value }
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tight">Clientes & Anamneses</h2>
                    <p className="text-muted-foreground font-medium">Gestão completa de fichas e histórico.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Nova Cliente
                </button>
            </header>

            {/* Lista de Clientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <div key={client.id} className="bg-white p-6 rounded-[2rem] border border-border hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => handleDelete(client.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-lg">
                                {client.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">{client.nome}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                                    <Phone className="w-3 h-3" /> {client.telefone}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {client.anamnese?.saude_alergias && (
                                <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                    <AlertCircle className="w-3 h-3" /> Possui Alergias
                                </div>
                            )}
                            {client.anamnese?.saude_gestante && (
                                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 px-3 py-2 rounded-lg border border-purple-100">
                                    <Activity className="w-3 h-3" /> Gestante
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => handleOpenModal(client)}
                                className="flex-1 bg-foreground text-white py-3 rounded-xl font-bold text-sm hover:bg-primary transition-colors flex items-center justify-center gap-2"
                            >
                                <ClipboardList className="w-4 h-4" /> Abrir Prontuário
                            </button>
                            <a
                                href={`https://api.whatsapp.com/send?phone=55${client.telefone.replace(/\D/g, '')}`}
                                target="_blank"
                                className="p-3 border border-border rounded-xl text-green-600 hover:bg-green-50 transition-colors"
                            >
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Completo */}
            {showModal && formClient.anamnese && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Header Modal */}
                        <div className="p-8 border-b border-border flex justify-between items-center bg-muted/20 rounded-t-[2.5rem]">
                            <div>
                                <h3 className="text-2xl font-black text-foreground">Ficha de Anamnese</h3>
                                <p className="text-muted-foreground font-medium text-sm">Prontuário Digital • {formClient.nome || "Nova Cliente"}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-all"><X className="w-6 h-6 text-muted-foreground" /></button>
                        </div>

                        {/* Tabs */}
                        <div className="px-8 pt-6 flex gap-2 overflow-x-auto pb-2">
                            <TabButton id="pessoal" icon={User} label="Pessoal" />
                            <TabButton id="saude" icon={Activity} label="Saúde" />
                            <TabButton id="estetica" icon={Eye} label="Estética & Olhar" />
                            <TabButton id="termos" icon={FileText} label="Termos" />
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <form id="anamneseForm" onSubmit={handleSave} className="space-y-8">

                                {/* TAB: PESSOAL */}
                                {activeTab === "pessoal" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Nome Completo</label>
                                                <input required value={formClient.nome} onChange={e => setFormClient({ ...formClient, nome: e.target.value })} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/10" placeholder="Nome da cliente" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Telefone</label>
                                                <input required value={formClient.telefone} onChange={e => setFormClient({ ...formClient, telefone: formatTelefone(e.target.value) })} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/10" placeholder="(00) 00000-0000" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Data de Nascimento</label>
                                                <input type="date" value={formClient.anamnese.data_nascimento} onChange={e => updateAnamnese("data_nascimento", e.target.value)} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/10" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Profissão</label>
                                                <input value={formClient.anamnese.profissao} onChange={e => updateAnamnese("profissao", e.target.value)} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/10" placeholder="Ex: Advogada" />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Endereço</label>
                                                <input value={formClient.anamnese.endereco} onChange={e => updateAnamnese("endereco", e.target.value)} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/10" placeholder="Rua, Número, Bairro..." />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Instagram</label>
                                                <input value={formClient.anamnese.instagram} onChange={e => updateAnamnese("instagram", e.target.value)} className="w-full p-4 bg-muted/30 border border-border rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/10" placeholder="@usuario" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: SAUDE */}
                                {activeTab === "saude" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-800 text-sm font-medium">
                                            <AlertCircle className="w-5 h-5" />
                                            Marque todas as condições que se aplicam. Itens em vermelho são de atenção!
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <CheckField label="Alergias" checked={formClient.anamnese.saude_alergias} onChange={(v: boolean) => updateAnamnese("saude_alergias", v)} alert />
                                            <CheckField label="Dermatite" checked={formClient.anamnese.saude_dermatite} onChange={(v: boolean) => updateAnamnese("saude_dermatite", v)} alert />
                                            <CheckField label="Problemas Oculares" checked={formClient.anamnese.saude_ocular} onChange={(v: boolean) => updateAnamnese("saude_ocular", v)} alert />
                                            <CheckField label="Sensibilidade na Pele" checked={formClient.anamnese.saude_sensibilidade} onChange={(v: boolean) => updateAnamnese("saude_sensibilidade", v)} />
                                            <CheckField label="Herpes" checked={formClient.anamnese.saude_herpes} onChange={(v: boolean) => updateAnamnese("saude_herpes", v)} alert />
                                            <CheckField label="Doenças Autoimunes" checked={formClient.anamnese.saude_autoimune} onChange={(v: boolean) => updateAnamnese("saude_autoimune", v)} />
                                            <CheckField label="Diabetes" checked={formClient.anamnese.saude_diabetes} onChange={(v: boolean) => updateAnamnese("saude_diabetes", v)} />
                                            <CheckField label="Hipertensão" checked={formClient.anamnese.saude_hipertensao} onChange={(v: boolean) => updateAnamnese("saude_hipertensao", v)} />
                                            <CheckField label="Problemas Hormonais" checked={formClient.anamnese.saude_hormonal} onChange={(v: boolean) => updateAnamnese("saude_hormonal", v)} />
                                            <CheckField label="Gravidez / Amamentando" checked={formClient.anamnese.saude_gestante} onChange={(v: boolean) => updateAnamnese("saude_gestante", v)} alert />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Medicamentos em uso</label>
                                                <textarea value={formClient.anamnese.saude_medicamentos} onChange={e => updateAnamnese("saude_medicamentos", e.target.value)} className="w-full p-4 bg-muted/30 border border-border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 h-24" placeholder="Lista de medicamentos e ácidos..." />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Observações / Outros</label>
                                                <textarea value={formClient.anamnese.saude_outros} onChange={e => updateAnamnese("saude_outros", e.target.value)} className="w-full p-4 bg-muted/30 border border-border rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 h-24" placeholder="Detalhes adicionais de saúde..." />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: ESTETICA & TECNICA */}
                                {activeTab === "estetica" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                                        <div>
                                            <h4 className="text-lg font-black text-foreground mb-4 flex items-center gap-2"><Eye className="w-5 h-5 text-primary" /> Histórico Estético</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-6 rounded-[2rem]">
                                                <CheckField label="Extensão de Cílios" checked={formClient.anamnese.estetico_extensao} onChange={(v: boolean) => updateAnamnese("estetico_extensao", v)} />
                                                <CheckField label="Lash Lifting" checked={formClient.anamnese.estetico_lash_lifting} onChange={(v: boolean) => updateAnamnese("estetico_lash_lifting", v)} />
                                                <CheckField label="Brow Lamination" checked={formClient.anamnese.estetico_brow_lamination} onChange={(v: boolean) => updateAnamnese("estetico_brow_lamination", v)} />
                                                <CheckField label="Design Sobranc." checked={formClient.anamnese.estetico_design} onChange={(v: boolean) => updateAnamnese("estetico_design", v)} />
                                                <CheckField label="Dermaplaning" checked={formClient.anamnese.estetico_dermaplaning} onChange={(v: boolean) => updateAnamnese("estetico_dermaplaning", v)} />
                                                <CheckField label="Epilação Facial" checked={formClient.anamnese.estetico_epilacao} onChange={(v: boolean) => updateAnamnese("estetico_epilacao", v)} />
                                                <CheckField label="Hidragloss" checked={formClient.anamnese.estetico_hidragloss} onChange={(v: boolean) => updateAnamnese("estetico_hidragloss", v)} />
                                                <CheckField label="Reconstrução" checked={formClient.anamnese.estetico_reconstrucao} onChange={(v: boolean) => updateAnamnese("estetico_reconstrucao", v)} />
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-black text-foreground mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Avaliação Técnica (Profissional)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-border p-6 rounded-[2rem] shadow-sm">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Tipo de Pele</label>
                                                    <input value={formClient.anamnese.tec_tipo_pele} onChange={e => updateAnamnese("tec_tipo_pele", e.target.value)} className="w-full p-3 bg-muted/30 border border-border rounded-xl font-bold text-sm" placeholder="Ex: Oleosa, Mista..." />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Espessura do Fio</label>
                                                    <input value={formClient.anamnese.tec_espessura} onChange={e => updateAnamnese("tec_espessura", e.target.value)} className="w-full p-3 bg-muted/30 border border-border rounded-xl font-bold text-sm" placeholder="Ex: Fino, Médio, Grosso" />
                                                    <span className="text-[10px] text-muted-foreground ml-1">ℹ️ Importante para definir o peso da extensão</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Direção de Crescimento</label>
                                                    <input value={formClient.anamnese.tec_direcao} onChange={e => updateAnamnese("tec_direcao", e.target.value)} className="w-full p-3 bg-muted/30 border border-border rounded-xl font-bold text-sm" placeholder="Ex: Reto, Descendente" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Falhas / Assimetria</label>
                                                    <input value={formClient.anamnese.tec_falhas} onChange={e => updateAnamnese("tec_falhas", e.target.value)} className="w-full p-3 bg-muted/30 border border-border rounded-xl font-bold text-sm" placeholder="Ex: Falha no final da cauda esq." />
                                                </div>
                                                <div className="space-y-1 md:col-span-2">
                                                    <label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Contraindicações Presentes</label>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                                                        <CheckField label="Olhos Irritados" checked={formClient.anamnese.contra_olhos_irritados} onChange={(v: boolean) => updateAnamnese("contra_olhos_irritados", v)} alert />
                                                        <CheckField label="Conjuntivite" checked={formClient.anamnese.contra_conjuntivite} onChange={(v: boolean) => updateAnamnese("contra_conjuntivite", v)} alert />
                                                        <CheckField label="Feridas" checked={formClient.anamnese.contra_feridas} onChange={(v: boolean) => updateAnamnese("contra_feridas", v)} alert />
                                                        <CheckField label="Química Recente" checked={formClient.anamnese.contra_quimica_recente} onChange={(v: boolean) => updateAnamnese("contra_quimica_recente", v)} alert />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: TERMOS */}
                                {activeTab === "termos" && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 text-center py-8">
                                        <div className="max-w-md mx-auto space-y-6">
                                            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                                            <h3 className="text-xl font-bold text-foreground">Termo de Consentimento</h3>
                                            <p className="text-muted-foreground text-sm">
                                                Declaro que informei corretamente meu histórico de saúde, estou ciente dos cuidados pré e pós procedimento e autorizo a realização do procedimento escolhido.
                                            </p>

                                            <div className="bg-muted/30 p-6 rounded-2xl text-left space-y-4">
                                                <label className="flex items-center gap-4 cursor-pointer">
                                                    <input type="checkbox" className="w-6 h-6 accent-primary" checked={formClient.anamnese.termo_aceito} onChange={e => updateAnamnese("termo_aceito", e.target.checked)} />
                                                    <span className="font-bold text-sm">Li e concordo com os termos de serviço e cuidados.</span>
                                                </label>
                                                <label className="flex items-center gap-4 cursor-pointer">
                                                    <input type="checkbox" className="w-6 h-6 accent-primary" checked={formClient.anamnese.uso_imagem} onChange={e => updateAnamnese("uso_imagem", e.target.checked)} />
                                                    <span className="font-bold text-sm">Autorizo o uso de imagens (fotos/vídeos) para divulgação.</span>
                                                </label>
                                            </div>

                                            <div className="pt-4">
                                                <label className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1 block">Assinado em</label>
                                                <input type="date" className="p-3 bg-white border border-border rounded-xl font-bold text-center w-full" value={formClient.anamnese.data_assinatura} onChange={e => updateAnamnese("data_assinatura", e.target.value)} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </form>
                        </div>

                        {/* Footer Fixo */}
                        <div className="p-6 border-t border-border bg-white rounded-b-[2.5rem] flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden md:block">
                                Passo {["pessoal", "saude", "estetica", "termos"].indexOf(activeTab) + 1} de 4
                            </span>
                            <div className="flex gap-4 w-full md:w-auto">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-4 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="anamneseForm"
                                    disabled={saving}
                                    className="flex-1 md:flex-none px-8 py-4 bg-primary text-white rounded-xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                    {saving ? "Salvando..." : "Salvar Prontuário"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
