'use client';

import { useSearchParams } from 'next/navigation';
import ChatManager from '@/components/ChatManager';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');

  return (
    <div className="h-[calc(100vh-120px)]">
      <ChatManager initialLeadId={leadId} />
    </div>
  );
}