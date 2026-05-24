import { GoogleGenAI } from "@google/genai";

async function findId() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "What is the YouTube video ID for 'Samjho Na - Aditya Rikhari (Unplugged)'? I need the 11-character ID that follows 'v=' in the URL.",
  });
  console.log(response.text);
}

findId();
