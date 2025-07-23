'use client';

import { Toaster } from "react-hot-toast";
import AdminLayout from "./AdminLayout";
import RuntimeConfigDebug from "./RuntimeConfigDebug";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
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
      {/* Debug component - remover em produção */}
      <RuntimeConfigDebug show={process.env.NODE_ENV === 'development'} />
    </>
  );
}