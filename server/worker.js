import { Worker } from "bullmq";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    console.log(`JOB:`, job.data);
    const data = JSON.parse(job.data);
    // Load the PDF
    const loader = new PDFLoader(data.path);
    const docs = await loader.load();
    // Split the PDF into smaller chunks
    const splitter = new CharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    const embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: "",
      model: "sentence-transformers/all-MiniLM-L6-v2",
    });
    await QdrantVectorStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        url: 'http://localhost:6333',
        collectionName: 'pdf-upload',
      }
    );
    console.log(`All docs are added to vector store`);
  },
  {
    concurrency: 100,
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
);
