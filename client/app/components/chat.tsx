'use client';

import * as React from 'react';
import { Bot, FileText, Send, User } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiUrl } from '../lib/api';

interface Doc {
  pageContent?: string;
  metadata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}

interface IMessage {
  role: 'assistant' | 'user';
  content?: string;
  documents?: Doc[];
}

export default function ChatComponent() {
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<IMessage[]>([]);

  const handleChatMessage = async () => {
    const userMessage = message.trim();

    if (!userMessage) return;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage },
    ]);

    setMessage('');

    const res = await fetch(
    apiUrl(`/chat?message=${encodeURIComponent(userMessage)}`),
  );

    const data = await res.json();

    console.log({ data });

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: data?.message,
        documents: data?.docs,
      },
    ]);
  };

  return (
    <section className="flex h-screen flex-col bg-muted/20">
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2 text-primary-foreground">
            <Bot className="size-5" />
          </div>

          <div>
            <h1 className="font-semibold">PDF Assistant</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your uploaded documents
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <FileText className="size-8" />
            </div>

            <h2 className="text-lg font-semibold">Start a conversation</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Upload a PDF, then ask a question to search its contents.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.map((item, index) => {
              const isUser = item.role === 'user';

              return (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {isUser ? (
                      <User className="size-4" />
                    ) : (
                      <Bot className="size-4" />
                    )}
                  </div>

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      isUser
                        ? 'rounded-tr-sm bg-primary text-primary-foreground'
                        : 'rounded-tl-sm border bg-background text-foreground shadow-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{item.content}</p>

                    {!isUser && item.documents && item.documents.length > 0 && (
                      <details className="mt-3 border-t pt-3">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                          Sources used ({item.documents.length})
                        </summary>

                        <div className="mt-3 space-y-2">
                          {item.documents.map((doc, documentIndex) => (
                            <div
                              key={documentIndex}
                              className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
                            >
                              <div className="flex items-center gap-2 font-medium text-foreground">
                                <FileText className="size-3.5" />
                                PDF source
                              </div>

                              <p className="mt-1 truncate">
                                {doc.metadata?.source ?? 'Uploaded PDF'}
                              </p>

                              {doc.metadata?.loc?.pageNumber && (
                                <p className="mt-1">
                                  Page {doc.metadata.loc.pageNumber}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t bg-background p-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleChatMessage();
            }}
            placeholder="Ask a question about your PDF..."
          />

          <Button
            onClick={handleChatMessage}
            disabled={!message.trim()}
            className="shrink-0"
          >
            <Send className="size-4" />
            Send
          </Button>
        </div>
      </footer>
    </section>
  );
}