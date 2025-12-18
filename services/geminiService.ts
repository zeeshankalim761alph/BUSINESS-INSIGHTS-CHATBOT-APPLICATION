import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are BizInsight, an expert business consultant and strategic advisor. 
Your goal is to provide intelligent, professional, and actionable business insights. 
You cover topics like marketing, finance, operations, strategy, and startups. 

Guidelines:
- Format your responses using clear headings, bullet points, and concise paragraphs for readability.
- Use professional yet accessible business terminology.
- Provide structured analysis (e.g., when asked for a plan, break it down into steps).
- If asked about harmful, illegal, or unethical business practices, strictly refuse and pivot to ethical alternatives.
- Do not provide specific legal or financial advice that requires a license (e.g., "buy this specific stock", "file this specific tax form"); instead, provide general educational guidance.
- Keep responses focused on business value and growth.
`;

let ai: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getAiClient = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const initializeChat = () => {
  const client = getAiClient();
  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7, // Balance creativity with professionalism
    },
  });
};

export const sendMessageStream = async function* (message: string) {
  if (!chatSession) {
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session.");
  }

  try {
    const streamResult = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of streamResult) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const resetChat = () => {
  chatSession = null;
  initializeChat();
};