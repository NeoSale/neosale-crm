'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: {
    recurso: string;
    acao: string;
  };
  adminOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, hasPermission, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Aguardar o carregamento inicial
    if (loading) return;

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Se requer permissão de admin e usuário não é admin
    if (adminOnly && !isAdmin()) {
      router.push('/unauthorized');
      return;
    }

    // Se requer permissão específica e usuário não tem
    if (requiredPermission && !hasPermission(requiredPermission.recurso, requiredPermission.acao)) {
      router.push('/unauthorized');
      return;
    }
  }, [loading, isAuthenticated, user, pathname, router, adminOnly, requiredPermission, hasPermission, isAdmin]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado ou não tem permissão, não renderizar nada
  // (o useEffect já está redirecionando)
  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && !isAdmin()) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission.recurso, requiredPermission.acao)) {
    return null;
  }

  // Renderizar children se tudo estiver ok
  return <>{children}</>;
}
