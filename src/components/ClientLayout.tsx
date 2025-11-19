'use client';

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import VersionLoggerComponent from "./VersionLogger";
import ApiConfigChecker from "./ApiConfigChecker";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ClienteProvider } from "../contexts/ClienteContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  
  // Páginas que não devem ter o AdminLayout (menu lateral)
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/reset-password') ||
                     pathname?.startsWith('/auth/');

  return (
    <ThemeProvider>
      <AuthProvider>
        <ClienteProvider>
          {isAuthPage ? (
            // Páginas de autenticação: sem menu
            children
          ) : (
            // Páginas normais: com menu
            <AdminLayout>
              {children}
            </AdminLayout>
          )}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 8000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {/* Version logger - exibe versão no console */}
          <VersionLoggerComponent />
          {/* API config checker - verifica configuração da API */}
          <ApiConfigChecker />
        </ClienteProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}