'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@base-ui/react';
import * as React from 'react'

interface Doc {
    pageContent? : string,
    metaData? : {
        loc ? : {
            pageNumber ? :number;
        };
    source? : string,
    }
}


interface IMessage {
    role : 'assistant' | 'user',
    content? : string,
    document ? : Doc[];
}

export default function ChatComponent() {
    const [message, setMessage] = React.useState<string>('');
    const [messages, setMessages] = React.useState<IMessage[]>([])

    const handleChatMessage = async () =>{
         const userMessage = message.trim();

  if (!userMessage) return;

  setMessages((prev) => [
    ...prev,
    { role: 'user', content: userMessage },
  ]);

  setMessage('');

  const res = await fetch(
    `http://localhost:8000/chat?message=${encodeURIComponent(userMessage)}`,
  );

  const data = await res.json();
        console.log({data});
        setMessages(prev => [...prev, {role : 'assistant', content : data?.message, documents : data?.docs}])
    }
  return (
    <div className="p-4">
        <div>
            {messages.map((message, index) =><pre key={index}>{JSON.stringify(message, null, 2)}</pre> )}
        </div>
        <div className='fixed bottom-4 w-100 flex gap-3'>
      <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message here" />
      <Button onClick={handleChatMessage} disabled= {!message.trim()}>Send</Button>
      </div>
    </div>
  );
}