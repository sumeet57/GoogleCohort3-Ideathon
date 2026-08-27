import type { ChatMessage, EntrySynthesis, ReflectionMode } from "../types";

export interface ReflectResponse {
  reflection: string;
  modelUsed: string;
  timestamp: string;
}

export interface SummarizeResponse {
  synthesis: EntrySynthesis;
  modelUsed: string;
  timestamp: string;
}

export async function askGeminiReflection(params: {
  prompt: string;
  history?: ChatMessage[];
  mode?: ReflectionMode;
  entryContext?: string;
}): Promise<ReflectResponse> {
  const response = await fetch("/api/gemini/reflect", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorDetail = "Failed to communicate with Gemini service";
    try {
      const errJson = await response.json();
      errorDetail = errJson.details || errJson.error || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function askGeminiSummarize(params: {
  text: string;
  title?: string;
}): Promise<SummarizeResponse> {
  const response = await fetch("/api/gemini/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    let errorDetail = "Failed to generate synthesis";
    try {
      const errJson = await response.json();
      errorDetail = errJson.details || errJson.error || errorDetail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
