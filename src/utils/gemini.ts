import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const apiKey = process.env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
const apiPass = process.env.API_PASS || import.meta.env.API_PASS || '';
const modelName = (import.meta.env.GEMINI_MODEL_NAME) || 'gemini-2.5-flash'

let apiBaseUrl = (process.env.API_BASE_URL || import.meta.env.API_BASE_URL || '')
  .trim()
  .replace(/\/$/, '');

if (apiBaseUrl && !apiBaseUrl.startsWith('http')) {
  apiBaseUrl = `https://${apiBaseUrl}`;
}



const genAI = new GoogleGenerativeAI(apiKey);

export const getModel = () => {
  const fetchOptions: any = {};

  if (apiBaseUrl) {
    fetchOptions.baseUrl = apiBaseUrl;

    if (apiPass) {
      fetchOptions.customHeaders = {
        'x-auth-code': apiPass
      };
    }
  }

  return genAI.getGenerativeModel(
    { model: modelName },
    apiBaseUrl ? fetchOptions : undefined
  );
};


export const startChatAndSendMessageStream = async (
  history: ChatMessage[],
  newMessage: { parts: { text: string }[] }
) => {

  const model = getModel();

  const chat = model.startChat({

    history: history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts.map((p) => ({ text: p.text })),
    })),
    generationConfig: {
      maxOutputTokens: 8000,
    },

    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  });


  const result = await chat.sendMessageStream(newMessage.parts);


  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          const encoded = encoder.encode(text);
          controller.enqueue(encoded);
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
};