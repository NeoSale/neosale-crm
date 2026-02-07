'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutContent({ children }: AdminLayoutProps) {
  const [isInChat, setIsInChat] = useState(false);
  const pathname = usePathname();

  // Escutar mudanças de estado do chat
  useEffect(() => {
    const handleChatStateChange = (event: CustomEvent) => {
      setIsInChat(event.detail.inChat);
    };

    window.addEventListener('chatStateChange', handleChatStateChange as EventListener);

    return () => {
      window.removeEventListener('chatStateChange', handleChatStateChange as EventListener);
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main
        className={`flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 ${isInChat ? 'p-0 md:p-2 md:p-4' : 'p-2 md:p-4'}`}
        suppressHydrationWarning
      >
        <div className={isInChat ? 'h-full' : 'max-w-8xl mx-auto'}>
          {children}
        </div>
      </main>
    </div>
  );
}

// Componente principal com Suspense
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
