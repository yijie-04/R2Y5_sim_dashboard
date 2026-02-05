import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// 1. Health Check (This works in your browser!)
app.get('/api/chat', (req, res) => {
  res.send('AI Server is running! Use POST to send messages.');
});

// 2. The Chat Logic (This is what the React app calls)
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant for aUToronto engineers." },
        ...messages
      ],
    });
    res.json(response.choices[0].message);
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));