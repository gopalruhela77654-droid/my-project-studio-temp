import { GoogleGenAI } from "@google/genai";

async function findId() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "What is the YouTube video ID for 'Samjho Na - Aditya Rikhari (Unplugged)'? Just the ID, please.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  console.log(response.text);
}

findId();
