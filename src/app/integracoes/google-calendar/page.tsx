'use client';

import { useEffect, useState } from 'react';
import GoogleCalendarManager from '../../../components/GoogleCalendarManager';

export default function GoogleCalendarPage() {
  const [clienteId, setClienteId] = useState<string>('');

  useEffect(() => {
    // Aqui você pode obter o cliente_id do contexto, localStorage, ou de onde for apropriado
    // Por exemplo, do localStorage ou de um contexto de autenticação
    const storedClienteId = localStorage.getItem('cliente_id') || '';
    setClienteId(storedClienteId);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <GoogleCalendarManager cliente_id={clienteId} />
      </div>
    </div>
  );
}