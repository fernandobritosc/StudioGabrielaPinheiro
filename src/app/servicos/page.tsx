"use client";

import { useEffect, useState } from "react";
import { Scissors, Plus, Clock, DollarSign, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number;
  descricao: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newService, setNewService] = useState({ nome: "", duracao_minutos: 60, preco: 0, descricao: "" });

  async function fetchServices() {
    setLoading(true);
    const { data, error } = await supabase.from("servicos").select("*").order("nome");
    if (!error) setServices(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchServices(); }, []);

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("servicos").insert([newService]);
    if (!error) {
      setShowModal(false);
      setNewService({ nome: "", duracao_minutos: 60, preco: 0, descricao: "" });
      fetchServices();
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Catálogo de Serviços</h2>
          <p className="text-muted-foreground">Defina os procedimentos técnicos e valores do seu estúdio.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </button>
      </header>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Cadastrar Novo Serviço</h3>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-1">Nome do Procedimento</label>
                <input required type="text" value={newService.nome} onChange={e => setNewService({ ...newService, nome: e.target.value })} className="w-full p-3 rounded-xl border border-border" placeholder="Ex: Volume Russo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Duração (minutos)</label>
                  <input required type="number" value={newService.duracao_minutos} onChange={e => setNewService({ ...newService, duracao_minutos: parseInt(e.target.value) })} className="w-full p-3 rounded-xl border border-border" />
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-1">Preço (R$)</label>
                  <input required type="number" value={newService.preco} onChange={e => setNewService({ ...newService, preco: parseFloat(e.target.value) })} className="w-full p-3 rounded-xl border border-border" step="0.01" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1">Descrição</label>
                <textarea value={newService.descricao} onChange={e => setNewService({ ...newService, descricao: e.target.value })} className="w-full p-3 rounded-xl border border-border h-24" />
              </div>
              <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-2xl">Salvar Serviço</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Scissors className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-bold text-primary">{service.nome}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{service.descricao}</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-medium"><Clock className="w-4 h-4" /><span>{service.duracao_minutos} min</span></div>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground"><DollarSign className="w-4 h-4 text-primary" /><span>R$ {Number(service.preco).toFixed(2)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
