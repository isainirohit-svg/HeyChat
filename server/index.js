import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import path from "path";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { QdrantVectorStore } from "@langchain/qdrant";
import { InferenceClient } from "@huggingface/inference";

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: 6379,
  },
});

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: "",
  model: "sentence-transformers/all-MiniLM-L6-v2",
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix} - ${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());

app.post("/uload-pdf", upload.single("pdf"), (req, res) => {
  queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    })
  );
  return res.json({ message: "PDF Uploaded." });
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "pdf-upload",
    }
  );
  const ret = vectorStore.asRetriever({
    k: 2,
  });
  const result = await ret.invoke(userQuery);

  const SYSTEM_PROMPT = `You are a helpful AI assistant who answers the user Query based on the context from PDF file. CONTEXT: ${JSON.stringify(
    { result }
  )}`;

  const client = new InferenceClient("");
  const chatCompletion = await client.chatCompletion({
    model: "deepseek-ai/DeepSeek-V3-0324",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userQuery },
    ],
  });

  return res.json({
    message: chatCompletion.choices?.[0]?.message?.content || chatCompletion,
    docs: result,
  });
});

app.get("/", (req, res) => {
  return res.json({ status: "All Good.!" });
});

app.listen(8000, () => console.log(`Server is running on PORT:8000`));
