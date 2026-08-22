import { unlink } from 'node:fs/promises';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import dotenv from 'dotenv';

dotenv.config({
  path:
    process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env.local',
});

class GeminiEmbeddings extends GoogleGenerativeAIEmbeddings {
  async embedDocuments(texts) {
    const vectors = [];

    for (const text of texts) {
      vectors.push(await this.embedQuery(text));
    }

    return vectors;
  }
}

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const embeddings = new GeminiEmbeddings({
  model: process.env.GEMINI_EMBEDDING_MODEL,
});

const testVector = await embeddings.embedQuery('embedding health check');

if (testVector.length === 0) {
  throw new Error('Gemini returned an empty embedding vector.');
}

console.log(`Gemini embedding dimensions: ${testVector.length}`);

const qdrantConfig = {
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY || undefined,
  collectionName: process.env.QDRANT_COLLECTION,
};

const worker = new Worker(
  'file-upload-queue',
  async (job) => {
    try {
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

      await QdrantVectorStore.fromDocuments(chunks,embeddings,qdrantConfig,);

      try {
        await unlink(data.path);
        console.log(`Deleted uploaded PDF: ${data.path}`);
      } catch (cleanupError) {
        console.warn(`Could not delete ${data.path}:`, cleanupError);
      }

      console.log(`Added ${chunks.length} chunks to Qdrant.`);

      return {
        success: true,
        chunksAdded: chunks.length,
      };
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 1,
    lockDuration: 600_000,
    maxStalledCount: 2,
  },
);

worker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id ?? 'unknown'} failed:`, error.message);
});

worker.on('error', (error) => {
  console.error('Worker error:', error);
});

console.log('PDF worker is running.');