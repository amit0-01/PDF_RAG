import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import {Queue} from "bullmq"
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import 'dotenv/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  temperature: 0.2,
});

const app = express();

const queue = new Queue('file-upload-queue', {
  connection: {
    host: '127.0.0.1',
    port: 6397,
  },
});


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

app.use(cors());

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
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: 'http://127.0.0.1:6333',
        collectionName: 'pdf-docs',
      },
    );
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

app.listen(8000, () => {
    console.log(`Server started on PORT ${8000}`);
});