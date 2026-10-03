'use client';

import * as React from 'react';
import FileUploadComponent from './components/file-upload';
import ChatComponent from './components/chat';

export default function Home() {
  const [isPdfUploaded, setIsPdfUploaded] = React.useState(false);

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <aside className="w-full border-b bg-background p-6 lg:w-[30vw] lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-md lg:sticky lg:top-24">
            <span className="text-sm font-medium text-primary">
              Knowledge base
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Chat with your PDFs
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Upload a PDF and ask questions. The assistant retrieves relevant
              document content before answering.
            </p>

            <div className="mt-6">
              <FileUploadComponent onUploadStatusChange={setIsPdfUploaded} />
            </div>
          </div>
        </aside>

        <section className="min-h-[calc(100vh-4rem)] w-full lg:w-[70vw]">
          <ChatComponent isPdfUploaded={isPdfUploaded} />
        </section>
      </div>
    </main>
  );
}