import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/lib/auth-context";
import ClientLayout from "@/components/ClientLayout";

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
      <body className="antialiased font-sans text-foreground bg-background min-h-screen">
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
