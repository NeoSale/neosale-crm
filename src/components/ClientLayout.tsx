'use client';

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import VersionLoggerComponent from "./VersionLogger";
import ApiConfigChecker from "./ApiConfigChecker";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ClienteProvider } from "../contexts/ClienteContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

function ProtectedContent({ children, isAuthPage }: { children: React.ReactNode; isAuthPage: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redireciona para login se não autenticado (fallback do middleware)
  useEffect(() => {
    if (!isAuthPage && !loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, isAuthPage, router]);

  // Mostra loading inicial em páginas protegidas
  if (!isAuthPage && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado após loading, não renderiza (aguarda redirecionamento)
  if (!isAuthPage && !user) {
    return null;
  }

  return (
    <>
      {isAuthPage ? (
        // Páginas de autenticação: sem menu
        children
      ) : (
        // Páginas normais: com menu
        <AdminLayout>
          {children}
        </AdminLayout>
      )}
    </>
  );
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
          <ProtectedContent isAuthPage={isAuthPage}>
            {children}
          </ProtectedContent>
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