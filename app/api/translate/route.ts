import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the workspace secrets.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, lang, tone, model, industry } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required for translation." }, { status: 400 });
    }

    if (!lang) {
      return NextResponse.json({ error: "Target language is required." }, { status: 400 });
    }

    // Map user settings to actual Gemini models supported by our SDK rules
    // User selected "Gemini 2.0 Flash" (default), "Gemini 2.5 Flash", or "Gemini 3.0 Flash"
    let apiModel = "gemini-2.5-flash"; // default fallback
    if (model === "gemini-3.0-flash") {
      apiModel = "gemini-3.5-flash";
    } else if (model === "gemini-2.5-flash" || model === "gemini-2.0-flash") {
      apiModel = "gemini-2.5-flash";
    }

    // Construct custom terminology guideline if selected
    let industryInstruction = "";
    if (industry && industry !== "General") {
      switch (industry) {
        case "Medical":
          industryInstruction = "\nSpecific instruction: Translate using highly accurate medical, clinical, and healthcare terminology appropriate for professionals.";
          break;
        case "Legal":
          industryInstruction = "\nSpecific instruction: Translate using formal legal, judicial, and legislative terminology with contractual precision.";
          break;
        case "IT & Software":
          industryInstruction = "\nSpecific instruction: Translate using modern software engineering, computer science, and IT terminology. Keep technical command names, variables, and code-like structures untranslated.";
          break;
        case "Finance & Business":
          industryInstruction = "\nSpecific instruction: Translate using corporate, financial, accounting, and general business terms appropriate for executive reports.";
          break;
        case "Engineering":
          industryInstruction = "\nSpecific instruction: Translate using accurate scientific, mechanical, electrical, or structural engineering terminology.";
          break;
        default:
          break;
      }
    }

    // Build the master prompt exactly as requested by the user
    const masterPrompt = `You are an expert translator. Your task is to translate the entire text block below to ${lang} with a ${tone} tone.${industryInstruction}

Ensure the translation accurately conveys the meaning and intent of the original text while adhering to the specified tone. 
Consider cultural nuances and idiomatic expressions where appropriate.
Provide the translated text only, without any surrounding commentary or explanations.
                                                
Original Text:
${text}`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: apiModel,
      contents: masterPrompt,
    });

    if (!response || !response.text) {
      throw new Error("Received an empty response from the translation model.");
    }

    return NextResponse.json({ translation: response.text });
  } catch (error: any) {
    console.error("Translation error in API route:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during translation." },
      { status: 500 }
    );
  }
}
