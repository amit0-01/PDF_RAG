import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PDF Assistant',
  description: 'Chat with your PDF documents',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-muted/20">
          <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">PDF Assistant</p>
                  <p className="text-xs text-muted-foreground">
                    Search and chat with your documents
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Show when="signed-out">
                  <SignInButton>
                    <Button variant="ghost">Sign in</Button>
                  </SignInButton>

                  <SignUpButton>
                    <Button>Get started</Button>
                  </SignUpButton>
                </Show>

                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}