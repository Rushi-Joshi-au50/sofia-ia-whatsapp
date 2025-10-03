
import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { useSocket } from '../lib/socket';

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
  type: 'incoming' | 'outgoing';
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useSocket();

  useEffect(() => {
    socket.on('whatsapp:message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    // Fetch existing messages
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data));

    return () => {
      socket.off('whatsapp:message');
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Painel de Mensagens</h1>
      <Card className="bg-white">
        <ScrollArea className="h-[600px] p-4">
          {messages.map(msg => (
            <div key={msg.id} className={`mb-4 p-3 rounded-lg ${
              msg.type === 'incoming' ? 'bg-blue-50' : 'bg-green-50'
            }`}>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{msg.from}</span>
                <span>{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-1">{msg.content}</p>
            </div>
          ))}
        </ScrollArea>
      </Card>
    </div>
  );
}
