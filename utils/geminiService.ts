import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";

// Type assertion for the GoogleGenAI instance
type GeminiModel = {
  generateContent: (request: any) => Promise<{ response: { text: () => string } }>;
};

interface GoogleGenAIWithModel extends GoogleGenAI {
  getGenerativeModel: (options: { model: string }) => GeminiModel;
}

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error(
    "Gemini API key not found. Please set the API_KEY environment variable."
  );
}

const PROMPT_TEXT = `You are an expert at analyzing images and identifying specific regions.
The user has provided an image with red ink markings (like underlines or circles) to highlight specific parts.
Please provide a concise and informative explanation or meaning of the content indicated by these markings.
Focus only on what is marked. If it's text, explain the text. If it's an object or area, describe it and its context within the markings.
Be descriptive and clear.`;

// Singleton instance
let _ai: GoogleGenAIWithModel | null = null;

// For testing purposes
export const __test = {
  reset: () => {
    _ai = null;
  }
};

export const getGeminiClient = (apiKey: string): GoogleGenAIWithModel => {
  if (!_ai) {
    // Type assertion to include our extended type
    _ai = new GoogleGenAI({ apiKey }) as unknown as GoogleGenAIWithModel;
  }
  return _ai;
};

export const getExplanationForImageRegion = async (
  annotatedImageDataBase64: string,
  apiKey: string = API_KEY || ''
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

  const base64DataWithoutPrefix = annotatedImageDataBase64.split(",")[1];
  if (!base64DataWithoutPrefix) {
    throw new Error("Invalid image data format.");
  }

  const imagePart: Part = {
    inlineData: {
      mimeType: "image/png",
      data: base64DataWithoutPrefix,
    },
  };

  const textPart: Part = {
    text: PROMPT_TEXT,
  };

  try {
    const ai = getGeminiClient(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [imagePart, textPart] }],
    });
    
    const response = result.response;
    const explanation = response.text();
    
    if (!explanation) {
      throw new Error("No explanation received from the API.");
    }
    return explanation;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
        throw new Error("Invalid API Key. Please check your configuration.");
      }
      throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error(
      "An unknown error occurred while communicating with the Gemini API."
    );
  }
};
