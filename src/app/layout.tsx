import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gabriela Pinheiro | Gestão de Estética",
  description: "Sistema premium de gestão para o estúdio Gabriela Pinheiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased font-sans text-foreground bg-background min-h-screen flex">
        <AuthProvider>
          <div className="flex w-full">
            <Sidebar />
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto max-h-screen">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
