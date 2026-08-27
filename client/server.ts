import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Standard Resilient Gemini Fallback Ladder
const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

// Lazy-initialize Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not set. Using fallback or environment variable if configured.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// Resilient Generation Helper with Automated Fallback Ladder
async function generateContentWithFallback(
  params: {
    contents: Array<{ role: string; parts: Array<{ text: string }> } | string> | string;
    systemInstruction?: string;
  }
): Promise<{ text: string; modelUsed: string }> {
  const client = getAIClient();
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: params.contents as any,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "";
      if (responseText.trim().length > 0) {
        return { text: responseText, modelUsed: model };
      }
    } catch (err: any) {
      console.warn(`[Gemini Fallback] Model ${model} failed with:`, err?.message || err);
      lastError = err;
      // Continue to next model in the fallback ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || "Unknown error"}`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Mandatory Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Public Firebase Client Config endpoint
  app.get("/api/firebase-config", (_req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw);
        return res.json(parsed);
      }
      return res.status(404).json({ error: "Firebase config not found" });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to read Firebase config", details: err?.message });
    }
  });

  // POST /api/gemini/reflect - Conversational reflection & brainstorming
  app.post("/api/gemini/reflect", async (req, res) => {
    try {
      // Defensive payload ingestion
      const body = (req.body && typeof req.body === "object") ? req.body : {};
      const { prompt, history, mode, entryContext } = body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ error: "A valid 'prompt' string is required." });
      }

      // Sanitize length
      const sanitizedPrompt = prompt.slice(0, 10000);
      const modeKey = typeof mode === "string" ? mode.toLowerCase() : "reflect";

      let systemInstruction = `You are a thoughtful, empathetic, and intellectually curious AI Journaling Companion & Reflection Partner.
Your goal is to help the user unpack their thoughts, gain clarity, identify cognitive patterns, explore underlying emotions, and brainstorm actionable next steps.

Guidelines:
1. Speak with warmth, depth, and clarity. Avoid superficial platitudes or generic cheerleading.
2. Structure your reflections cleanly using Markdown:
   - Begin with a direct, empathetic validation or reflection of the core theme.
   - Provide a section with 2-3 probing, perspective-shifting questions or insights.
   - Suggest 1-2 small, concrete action items, micro-habits, or creative angles if relevant.
3. Keep the tone grounded, constructive, and respectful.
4. If the user asks for brainstorming, structure options with clear pros and creative angles.`;

      if (modeKey === "brainstorm") {
        systemInstruction += `\nFOCUS MODE: Creative Brainstorming. Prioritize diverse idea generation, lateral thinking, unblocking challenges, and practical exploration.`;
      } else if (modeKey === "deepen") {
        systemInstruction += `\nFOCUS MODE: Deep Psychological / Philosophical Exploration. Explore core motivations, value alignment, emotional undercurrents, and root causes.`;
      } else if (modeKey === "summarize") {
        systemInstruction += `\nFOCUS MODE: Synthesis & Clarity. Distill chaotic thoughts into structured pillars, key decisions, and key takeaways.`;
      }

      // Build conversation contents
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (entryContext && typeof entryContext === "string" && entryContext.trim().length > 0) {
        contents.push({
          role: "user",
          parts: [{ text: `[Journal Context & Background]:\n${entryContext.slice(0, 5000)}` }],
        });
        contents.push({
          role: "model",
          parts: [{ text: "Thank you for sharing your journal context. I'm ready to reflect and converse with you." }],
        });
      }

      if (Array.isArray(history)) {
        for (const item of history.slice(-10)) {
          if (item && typeof item === "object" && typeof item.text === "string") {
            const role = item.role === "user" ? "user" : "model";
            contents.push({
              role,
              parts: [{ text: item.text.slice(0, 4000) }],
            });
          }
        }
      }

      // Add the latest prompt
      contents.push({
        role: "user",
        parts: [{ text: sanitizedPrompt }],
      });

      const { text, modelUsed } = await generateContentWithFallback({
        contents,
        systemInstruction,
      });

      return res.json({
        reflection: text,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[Reflect Error]", error);
      return res.status(500).json({
        error: "Failed to generate reflection from Gemini AI.",
        details: error?.message || "Internal server error",
      });
    }
  });

  // POST /api/gemini/summarize - Summarize an entire journal entry / reflection session
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const body = (req.body && typeof req.body === "object") ? req.body : {};
      const { text, title } = body;

      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "A valid 'text' string is required for summarization." });
      }

      const systemInstruction = `You are an expert executive cognitive synthesizer.
Given a user's raw journal entries, thoughts, and conversational reflections, produce a structured synthesis in strict JSON format.

Output schema:
{
  "title": "A crisp, evocative 3-7 word title capturing the essence",
  "summary": "A concise 2-3 sentence executive synthesis of the reflection",
  "insights": ["Insight or realization 1", "Insight or realization 2", "Insight or realization 3"],
  "actionItems": ["Practical next step 1", "Practical next step 2"],
  "dominantMood": "One of: Reflective, Energized, Anxious, Hopeful, Grateful, Overwhelmed, Focused, Creative, Peaceful, Ambitious",
  "tags": ["tag1", "tag2", "tag3"]
}

Respond ONLY with valid JSON. Do not include markdown code block formatting or backticks.`;

      const promptContent = `Title hint: ${title || "Untitled"}\n\nContent to synthesize:\n${text.slice(0, 12000)}`;

      const { text: resultText, modelUsed } = await generateContentWithFallback({
        contents: promptContent,
        systemInstruction,
      });

      let parsed: any;
      try {
        const cleanJson = resultText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
        parsed = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.warn("Failed to parse JSON directly, falling back to structured representation", parseErr);
        parsed = {
          title: title || "Reflective Session",
          summary: resultText.slice(0, 300),
          insights: ["Thoughtful exploration of personal experiences."],
          actionItems: ["Review these reflections when planning the week."],
          dominantMood: "Reflective",
          tags: ["journal", "reflection", "gemini-ai"],
        };
      }

      return res.json({
        synthesis: parsed,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[Summarize Error]", error);
      return res.status(500).json({
        error: "Failed to generate synthesis.",
        details: error?.message || "Internal server error",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Journal & Reflection Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to boot server:", err);
  process.exit(1);
});
