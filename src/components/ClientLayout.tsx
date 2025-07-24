'use client';

import { Toaster } from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import VersionLoggerComponent from "./VersionLogger";
import ApiConfigChecker from "./ApiConfigChecker";
import { ThemeProvider } from "../contexts/ThemeContext";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
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
    </ThemeProvider>
  );
}