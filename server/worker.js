import 'dotenv/config';

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';

class GeminiEmbeddings extends GoogleGenerativeAIEmbeddings {
  async embedDocuments(texts) {
    const vectors = [];

    for (const text of texts) {
      vectors.push(await this.embedQuery(text));
    }

    return vectors;
  }
}

const connection = new IORedis({
  host: '127.0.0.1',
  port: 6397,
  maxRetriesPerRequest: null,
});

const embeddings = new GeminiEmbeddings({
  model: 'gemini-embedding-001',
});

const testVector = await embeddings.embedQuery('embedding health check');

if (testVector.length === 0) {
  throw new Error('Gemini returned an empty embedding vector.');
}

console.log(`Gemini embedding dimensions: ${testVector.length}`);

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    const data =
    typeof job.data === 'string'
      ? JSON.parse(job.data)
      : job.data;

    if (!data?.path) {
      throw new Error('PDF path is missing from job data.');
    }

    console.log(`Processing job ${job.id}: ${data.path}`);

    const loader = new PDFLoader(data.path);
    const docs = await loader.load();

    const splitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });

    const chunks = await splitter.splitDocuments(docs);

    if (chunks.length === 0) {
      throw new Error('No text could be extracted from this PDF.');
    }

    await QdrantVectorStore.fromDocuments(chunks, embeddings, {
      url: 'http://127.0.0.1:6333',
      collectionName: 'pdf-docs-v2',
    });

    console.log(`Added ${chunks.length} chunks to Qdrant.`);
  },
  {
    connection,
    concurrency: 1,
    lockDuration: 600_000,
    maxStalledCount: 2,
  },
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed.`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id ?? 'unknown'} failed:`, error.message);
});

console.log('PDF worker is running.');