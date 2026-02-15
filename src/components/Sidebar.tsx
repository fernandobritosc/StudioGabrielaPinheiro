"use client";

import { Home, Calendar, Users, Scissors, DollarSign, MessageCircle, Settings, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { icon: Home, label: "Painel", href: "/" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: Users, label: "Clientes", href: "/clientes" },
  { icon: Scissors, label: "Serviços", href: "/servicos" },
  { icon: DollarSign, label: "Financeiro", href: "/financeiro" },
  { icon: MessageCircle, label: "WhatsApp", href: "/whatsapp" },
  { icon: Settings, label: "Configurações", href: "/config" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  if (pathname === '/login') return null;

  return (
    <>
      {/* Overlay para Mobile */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-white h-screen border-r border-border flex flex-col p-6 shadow-sm shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="mb-12 px-2 flex flex-col gap-6">
          <div className="relative w-20 h-20 bg-gradient-to-tr from-primary/10 via-primary/5 to-white rounded-[2rem] flex items-center justify-center p-4 border border-primary/20 shadow-sm group">
            <svg viewBox="0 0 24 24" className="w-full h-full text-primary fill-none stroke-current stroke-[1.2] transition-transform group-hover:scale-110 duration-500" strokeLinecap="round" strokeLinejoin="round">
              {/* Sobrancelha arqueada e fina */}
              <path d="M4 8c4-3 12-3 16 0" className="stroke-[1.5]" />
              {/* Linha dos cílios (olho fechado zen) */}
              <path d="M6 14c3 2 9 2 12 0" className="stroke-[1.5]" />
              {/* Cílios delicados e longos */}
              <path d="M8 15l-0.5 2" />
              <path d="M10.5 15.5l0 2.5" />
              <path d="M13.5 15.5l0 2.5" />
              <path d="M16 15l0.5 2" />
            </svg>
            <div className="absolute -top-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-border">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xs font-black uppercase tracking-[0.5em] text-primary/70">Studio</h1>
            <div className="flex flex-col -space-y-1">
              <span className="text-3xl font-black text-foreground tracking-tighter leading-none">Gabriela</span>
              <span className="text-xl font-black title-gold tracking-tight uppercase italic ml-0.5">Pinheiro</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-300 group ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <IconComponent className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-primary'}`} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-border space-y-4">
          <div className="px-4 py-3 bg-muted/30 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">GP</div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-foreground truncate">ESTÚDIO ATIVO</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all group"
          >
            <div className="bg-muted group-hover:bg-red-100 p-2 rounded-xl transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
}
