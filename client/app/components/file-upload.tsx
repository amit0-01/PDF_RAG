'use client';

import * as React from 'react';
import { FileText, Sparkles, Upload } from 'lucide-react';
import { apiUrl } from '../lib/api';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const handleFileUploadButtonClient = () => {
  const el = document.createElement('input');

  el.setAttribute('type', 'file');
  el.setAttribute('accept', 'application/pdf');

  el.addEventListener('change', async () => {
    if (el.files && el.files.length > 0) {
      const file = el.files.item(0);

      if (file) {
        const formData = new FormData();
        formData.append('pdf', file);

        await fetch(apiUrl('/uploads/pdf'), {
          method: 'POST',
          body: formData,
        });

        console.log('file uploaded');
      }
    }
  });

  el.click();
};

const FileUploadComponent: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-5" />
        </div>

        <CardTitle>Upload a PDF</CardTitle>
        <CardDescription>
          Add a document to make its content searchable in your chat.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={handleFileUploadButtonClient}
          className="w-full"
          size="lg"
        >
          <Upload className="size-4" />
          Choose PDF file
        </Button>

        <div className="flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Your document is processed and indexed so you can ask questions
            about its content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadComponent;