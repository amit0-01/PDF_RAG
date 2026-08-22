import express from 'express';
import cors from 'cors';
import multer from 'multer';
import {Queue} from "bullmq"
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.local';

const envPath = path.join(__dirname, envFile);

const result = dotenv.config({
  path: envPath,
});

const app = express();

const model = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL,
  temperature: 0.2,
});

const connection = new IORedis(process.env.REDIS_URL);

const queue = new Queue('file-upload-queue', {connection,});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },

    filename: function (req, file, cb) {
        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);

        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage
});


const qdrantConfig = {
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY || undefined,
  collectionName: process.env.QDRANT_COLLECTION,
};


app.use(cors({origin: process.env.CLIENT_ORIGIN,}),);


app.get('/', (req, res) => {
    return res.json({
        status: 'All Good!'
    });
});

app.post('/uploads/pdf', upload.single('pdf'),async (req, res) => {

    console.log('File:', req.file);
    await queue.add('file-ready', JSON.stringify({
        filename : req.file.originalname,
        source : req.file.destination,
        path : req.file.path
    }))
    return res.json({message: 'uploaded',file: req.file});
});

app.get('/chat', async (req,res) =>{
    const userQuery = req.query.message;
    const embeddings = new GoogleGenerativeAIEmbeddings({
    model: 'gemini-embedding-001',
    });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings,qdrantConfig);
    const retriever = vectorStore.asRetriever({ k: 2 });
    const docs = await retriever.invoke(userQuery);

    const context = docs
      .map((document) => document.pageContent)
      .join('\n\n---\n\n');

    const chatResult = await model.invoke(`
You are a helpful AI assistant. Answer only using the PDF context below.
If the answer is not present, say: "I could not find that in the uploaded PDF."

PDF context:
${context}

User question: ${userQuery}
`);

    return res.json({
      message: chatResult.content,
      docs,
    });
  } 
)

app.listen(process.env.PORT || 8000, () => {
  console.log(`Server started on PORT ${process.env.PORT || 8000}`);
});