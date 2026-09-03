import { apiRequest } from "./api.js";
export async function askGeminiReflection(params) {
    return apiRequest("/api/gemini/reflect", {
        method: "POST",
        body: params,
    });
}
export async function askGeminiSummarize(params) {
    return apiRequest("/api/gemini/summarize", {
        method: "POST",
        body: params,
    });
}
