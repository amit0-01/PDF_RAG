'use client';

import * as React from 'react';
import { CheckCircle2, FileText, LoaderCircle, Sparkles, Upload } from 'lucide-react';
import { apiUrl } from '../lib/api';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface FileUploadProps {
  onUploadStatusChange: (uploaded: boolean) => void;
}

const FileUploadComponent: React.FC<FileUploadProps> = ({
  onUploadStatusChange,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadedFile, setUploadedFile] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setUploading(true);
    setUploadedFile(null);
    setError(null);
    onUploadStatusChange(false);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch(apiUrl('/uploads/pdf'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      setUploadedFile(file.name);
      onUploadStatusChange(true);
    } catch {
      setError('Upload failed. Please try again.');
      onUploadStatusChange(false);
    } finally {
      setUploading(false);
    }
  };

  const chooseFile = () => fileInputRef.current?.click();

  return (
    <Card>
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FileText className="size-5" />
        </div>

        <CardTitle>
          {uploadedFile ? 'Your PDF is uploaded' : 'Upload a PDF'}
        </CardTitle>
        <CardDescription>
          {uploadedFile
            ? 'Your document is ready. Ask your question in the chat.'
            : 'Add a document to make its content searchable in your chat.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="sr-only"
          tabIndex={-1}
          aria-label="Choose a PDF file"
        />

        {uploading ? (
          <div
            className="space-y-3 rounded-md bg-muted p-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              <LoaderCircle className="size-5 animate-spin text-primary" />
              Uploading your PDF...
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          </div>
        ) : uploadedFile ? (
          <div className="space-y-3">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-green-600" />
              <span className="truncate">{uploadedFile}</span>
            </div>
            <Button
              type="button"
              onClick={chooseFile}
              className="w-full"
              size="lg"
            >
              <Upload className="size-4" />
              Upload another PDF
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={chooseFile}
            className="w-full"
            size="lg"
          >
            <Upload className="size-4" />
            Choose PDF file
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {!uploadedFile && !uploading && (
          <div className="flex gap-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Your document is processed and indexed so you can ask questions
              about its content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadComponent;