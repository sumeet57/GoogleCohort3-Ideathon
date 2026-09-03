import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Sparkles, Send, Save, Check, Star, Copy, Lightbulb, Compass, FileText, BrainCircuit, RotateCcw, Tag, Smile, AlertCircle, HelpCircle, Clock, ListTodo, CheckCircle2, ChevronRight } from "lucide-react";
import { askGeminiReflection, askGeminiSummarize } from "../lib/gemini";
import { saveJournalEntry } from "../lib/firebase";
const INSPIRATION_PROMPTS = [
    {
        title: "Daily Cognitive Unload",
        prompt: "What is occupying the most mental bandwidth for me today, and why does it feel heavy?",
        mode: "reflect",
    },
    {
        title: "Decision Crossroads",
        prompt: "I am trying to decide between two options. Help me examine the hidden assumptions and trade-offs.",
        mode: "brainstorm",
    },
    {
        title: "Small Wins & Gratitude",
        prompt: "Here is a small breakthrough or moment of gratitude I experienced today. Help me anchor it.",
        mode: "deepen",
    },
    {
        title: "Creative Block / Stuck State",
        prompt: "I feel stuck on my current project. Let's brainstorm 3 unconventional angles to reignite momentum.",
        mode: "brainstorm",
    },
];
const MODES = [
    {
        id: "reflect",
        label: "Reflect & Question",
        icon: _jsx(HelpCircle, { className: "w-3.5 h-3.5" }),
        desc: "Unpack cognitive patterns and explore perspective-shifting questions.",
    },
    {
        id: "brainstorm",
        label: "Brainstorm Ideas",
        icon: _jsx(Lightbulb, { className: "w-3.5 h-3.5" }),
        desc: "Generate divergent solutions, unblock creativity, and explore options.",
    },
    {
        id: "deepen",
        label: "Deep Exploration",
        icon: _jsx(Compass, { className: "w-3.5 h-3.5" }),
        desc: "Examine core values, root motives, and emotional undercurrents.",
    },
    {
        id: "summarize",
        label: "Synthesis",
        icon: _jsx(FileText, { className: "w-3.5 h-3.5" }),
        desc: "Distill the session into structured takeaways and action items.",
    },
];
export const JournalEditor = ({ userId, currentEntry, onEntrySaved, onNewReflection, }) => {
    // Active Entry State
    const [entry, setEntry] = useState(() => {
        if (currentEntry)
            return currentEntry;
        return {
            id: "entry-" + Date.now(),
            userId,
            title: "Reflection — " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            initialThought: "",
            messages: [],
            tags: ["daily-reflection"],
            wordCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isFavorite: false,
        };
    });
    const [promptInput, setPromptInput] = useState("");
    const [activeMode, setActiveMode] = useState("reflect");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [saveStatus, setSaveStatus] = useState("saved");
    const [errorMessage, setErrorMessage] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [completedActionItems, setCompletedActionItems] = useState({});
    const messagesEndRef = useRef(null);
    const titleInputRef = useRef(null);
    // Sync when prop changes
    useEffect(() => {
        if (currentEntry) {
            setEntry(currentEntry);
            setSaveStatus("saved");
            setErrorMessage(null);
        }
    }, [currentEntry?.id]);
    // Auto-scroll to bottom of conversation
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [entry.messages, isGenerating]);
    // Save entry to Firestore helper
    const persistEntry = async (updated) => {
        try {
            setSaveStatus("saving");
            setErrorMessage(null);
            await saveJournalEntry(userId, updated);
            setSaveStatus("saved");
            onEntrySaved(updated);
        }
        catch (err) {
            console.error("[Save Error]", err);
            setSaveStatus("error");
            setErrorMessage(err?.message || "Failed to save reflection to Firestore.");
        }
    };
    // Word count calculator
    const calculateWordCount = (thought, msgs) => {
        const allText = thought + " " + msgs.map((m) => m.text).join(" ");
        return allText.trim().split(/\s+/).filter(Boolean).length;
    };
    // Handle Initial Thought Change
    const handleThoughtChange = (val) => {
        const updated = {
            ...entry,
            initialThought: val,
            wordCount: calculateWordCount(val, entry.messages),
            updatedAt: Date.now(),
        };
        setEntry(updated);
        setSaveStatus("unsaved");
    };
    // Handle Blur of Initial Thought or Save explicitly
    const handleSaveThought = async () => {
        await persistEntry(entry);
    };
    // Toggle Favorite
    const handleToggleFavorite = async () => {
        const updated = {
            ...entry,
            isFavorite: !entry.isFavorite,
            updatedAt: Date.now(),
        };
        setEntry(updated);
        await persistEntry(updated);
    };
    // Submit Prompt to Gemini API
    const handleSendPrompt = async (customPrompt, customMode) => {
        const textToSend = (customPrompt || promptInput).trim();
        if (!textToSend || isGenerating)
            return;
        const mode = customMode || activeMode;
        const userMessage = {
            id: "msg-" + Date.now(),
            role: "user",
            text: textToSend,
            timestamp: Date.now(),
            mode,
        };
        const newMessages = [...entry.messages, userMessage];
        const updatedWithUser = {
            ...entry,
            messages: newMessages,
            wordCount: calculateWordCount(entry.initialThought, newMessages),
            updatedAt: Date.now(),
        };
        setEntry(updatedWithUser);
        setPromptInput("");
        setIsGenerating(true);
        setErrorMessage(null);
        setSaveStatus("saving");
        try {
            // 1. Call Gemini via resilient server fallback endpoint
            const result = await askGeminiReflection({
                prompt: textToSend,
                history: entry.messages,
                mode,
                entryContext: entry.initialThought,
            });
            const assistantMessage = {
                id: "msg-" + (Date.now() + 1),
                role: "assistant",
                text: result.reflection,
                timestamp: Date.now(),
                mode,
                modelUsed: result.modelUsed,
            };
            const finalMessages = [...newMessages, assistantMessage];
            const finalEntry = {
                ...updatedWithUser,
                messages: finalMessages,
                wordCount: calculateWordCount(entry.initialThought, finalMessages),
                updatedAt: Date.now(),
            };
            setEntry(finalEntry);
            await persistEntry(finalEntry);
        }
        catch (err) {
            console.error("[Gemini Chat Error]", err);
            setErrorMessage(err?.message || "Failed to generate reflection response.");
            setSaveStatus("error");
        }
        finally {
            setIsGenerating(false);
        }
    };
    // Generate Executive Summary & Synthesis with Gemini
    const handleGenerateSynthesis = async () => {
        if (isSummarizing)
            return;
        const combinedContent = [
            entry.initialThought ? `[Initial Thought]:\n${entry.initialThought}` : "",
            ...entry.messages.map((m) => `${m.role.toUpperCase()} (${m.mode || "reflect"}):\n${m.text}`),
        ]
            .filter(Boolean)
            .join("\n\n");
        if (!combinedContent.trim()) {
            setErrorMessage("Please write some thoughts or conversation turns before synthesizing.");
            return;
        }
        try {
            setIsSummarizing(true);
            setErrorMessage(null);
            const res = await askGeminiSummarize({
                text: combinedContent,
                title: entry.title,
            });
            const updated = {
                ...entry,
                title: res.synthesis.title || entry.title,
                synthesis: res.synthesis,
                mood: res.synthesis.dominantMood,
                tags: Array.from(new Set([...entry.tags, ...(res.synthesis.tags || [])])),
                updatedAt: Date.now(),
            };
            setEntry(updated);
            await persistEntry(updated);
        }
        catch (err) {
            console.error("[Synthesis Error]", err);
            setErrorMessage(err?.message || "Failed to generate AI synthesis.");
        }
        finally {
            setIsSummarizing(false);
        }
    };
    // Copy text helper
    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };
    return (_jsxs("div", { className: "max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6", children: [_jsxs("div", { id: "journal-editor-header", className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("input", { id: "entry-title-input", ref: titleInputRef, type: "text", value: entry.title, onChange: (e) => {
                                            const val = e.target.value;
                                            setEntry((prev) => ({ ...prev, title: val, updatedAt: Date.now() }));
                                            setSaveStatus("unsaved");
                                        }, onBlur: () => persistEntry(entry), placeholder: "Title of this reflection...", className: "w-full font-serif text-xl sm:text-2xl font-bold text-[#2d2926] bg-transparent border-b border-transparent hover:border-[#ded7c7] focus:border-[#a7ad9b] focus:outline-hidden py-1 transition-colors" }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-[#7d756c] mt-1.5 flex-wrap", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3.5 h-3.5 text-[#a1998e]" }), new Date(entry.createdAt).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [entry.wordCount, " words"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { id: "save-status-indicator", className: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] ${saveStatus === "saved"
                                                    ? "bg-[#eef3eb] text-[#4f5c44] border border-[#d3ddce]"
                                                    : saveStatus === "saving"
                                                        ? "bg-[#fbf2ea] text-[#9c5a31] border border-[#ebd2bf] animate-pulse"
                                                        : saveStatus === "unsaved"
                                                            ? "bg-[#f3ede1] text-[#696157] border border-[#e2d9c9]"
                                                            : "bg-[#fbeae7] text-[#9e3a2f] border border-[#ecc9c4]"}`, children: [saveStatus === "saved" && _jsx(Check, { className: "w-3 h-3 text-[#5b6851]" }), saveStatus === "saving" && _jsx(RotateCcw, { className: "w-3 h-3 animate-spin text-[#b86e42]" }), saveStatus === "unsaved" && _jsx(Save, { className: "w-3 h-3 text-[#7d756c]" }), saveStatus === "error" && _jsx(AlertCircle, { className: "w-3 h-3 text-[#9e3a2f]" }), saveStatus === "saved"
                                                        ? "Saved to Firestore"
                                                        : saveStatus === "saving"
                                                            ? "Persisting..."
                                                            : saveStatus === "unsaved"
                                                                ? "Unsaved Buffer"
                                                                : "Sync Error"] })] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx("button", { id: "btn-toggle-favorite", type: "button", onClick: handleToggleFavorite, title: entry.isFavorite ? "Remove from favorites" : "Add to favorites", className: `p-2.5 rounded-xl border transition-colors ${entry.isFavorite
                                            ? "bg-[#fbf4ea] border-[#eddac2] text-[#c48b5b] hover:bg-[#f6ebd8]"
                                            : "bg-[#faf7f0] border-[#e5dfd2] text-[#a1998e] hover:text-[#4a443f] hover:bg-[#f3ede1]"}`, children: _jsx(Star, { className: `w-4 h-4 ${entry.isFavorite ? "fill-[#c48b5b]" : ""}` }) }), _jsxs("button", { id: "btn-generate-synthesis", type: "button", disabled: isSummarizing || isGenerating, onClick: handleGenerateSynthesis, className: "flex items-center gap-2 bg-[#f5eee3] hover:bg-[#ebdcc8] text-[#634526] border border-[#ded0bb] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all disabled:opacity-50", children: [_jsx(BrainCircuit, { className: `w-3.5 h-3.5 text-[#8a5d32] ${isSummarizing ? "animate-spin" : ""}` }), _jsx("span", { children: isSummarizing ? "Synthesizing..." : "Synthesize Reflection" })] }), _jsx("button", { id: "btn-manual-save", type: "button", onClick: handleSaveThought, title: "Save now", className: "p-2.5 bg-[#342f2b] hover:bg-[#25211e] text-[#fdfbf7] rounded-xl shadow-2xs transition-colors", children: _jsx(Save, { className: "w-4 h-4" }) })] })] }), (entry.mood || (entry.tags && entry.tags.length > 0)) && (_jsxs("div", { className: "flex items-center gap-2 pt-2 border-t border-[#f0eae0] flex-wrap", children: [entry.mood && (_jsxs("span", { className: "inline-flex items-center gap-1 text-xs font-medium bg-[#edf2ea] text-[#48563d] px-2.5 py-1 rounded-lg border border-[#cfdacb]", children: [_jsx(Smile, { className: "w-3.5 h-3.5 text-[#5b6851]" }), _jsxs("span", { children: ["Mood: ", entry.mood] })] })), entry.tags?.map((tag) => (_jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-[#5c544b] bg-[#f5f1e8] px-2.5 py-0.5 rounded-lg border border-[#e5dfd2]", children: [_jsx(Tag, { className: "w-3 h-3 text-[#8f877d]" }), _jsx("span", { children: tag })] }, tag)))] }))] }), errorMessage && (_jsxs("div", { id: "editor-error-banner", className: "bg-[#fbeae7] border border-[#ecc9c4] text-[#852a20] p-4 rounded-2xl text-xs flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-[#9e3a2f] shrink-0" }), _jsx("span", { children: errorMessage })] }), _jsx("button", { id: "btn-retry-save", type: "button", onClick: () => persistEntry(entry), className: "px-2.5 py-1 bg-[#f4d1cb] hover:bg-[#ecc0b7] text-[#6b1e16] rounded-lg font-medium transition-colors", children: "Retry Save" })] })), _jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-[#7d756c] font-mono", children: "Raw Journal Entry & Thoughts" }), _jsx("span", { className: "text-[11px] text-[#a1998e]", children: "Write freely \u2014 Gemini will analyze and converse below" })] }), _jsx("textarea", { id: "initial-thought-textarea", value: entry.initialThought, onChange: (e) => handleThoughtChange(e.target.value), onBlur: handleSaveThought, placeholder: "Unload whatever is on your mind today: events, emotional state, dilemmas, creative ideas, or questions you are grappling with...", rows: 5, className: "w-full bg-[#faf7f0] hover:bg-[#f6f2e9] focus:bg-[#ffffff] border border-[#ded7c7] rounded-xl p-4 text-[#2d2926] text-sm leading-relaxed placeholder:text-[#a1998e] focus:outline-hidden focus:ring-2 focus:ring-[#342f2b] transition-all resize-y font-serif" })] }), entry.synthesis && (_jsxs("div", { id: "ai-synthesis-card", className: "bg-[#fbf7ee] border border-[#e7dac5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-[#f0e3ce] text-[#6b4724] flex items-center justify-center", children: _jsx(BrainCircuit, { className: "w-4 h-4 text-[#825c34]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-serif font-bold text-[#2d2926] text-base sm:text-lg", children: "Executive Cognitive Synthesis" }), _jsx("p", { className: "text-xs text-[#7d756c]", children: "Gemini 3.6 Flash structured breakdown" })] })] }), _jsxs("button", { type: "button", onClick: () => handleCopy("synthesis", `${entry.synthesis?.summary}\n\nKey Insights:\n${entry.synthesis?.insights.join("\n")}`), className: "text-xs text-[#7d756c] hover:text-[#2d2926] flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-[#f3e7d4] transition-colors", children: [copiedId === "synthesis" ? _jsx(Check, { className: "w-3.5 h-3.5 text-[#5b6851]" }) : _jsx(Copy, { className: "w-3.5 h-3.5" }), _jsx("span", { children: copiedId === "synthesis" ? "Copied" : "Copy Synthesis" })] })] }), _jsxs("div", { className: "bg-[#ffffff]/90 rounded-xl p-4 border border-[#e8dcce] text-sm text-[#4a443f] leading-relaxed", children: [_jsx("p", { className: "font-medium text-[#7d4f24] mb-1 text-xs uppercase tracking-wider font-mono", children: "Summary" }), entry.synthesis.summary] }), entry.synthesis.insights && entry.synthesis.insights.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "font-medium text-[#7d4f24] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5", children: [_jsx(Lightbulb, { className: "w-3.5 h-3.5 text-[#a86a34]" }), " Key Insights & Realizations"] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5", children: entry.synthesis.insights.map((insight, idx) => (_jsxs("div", { className: "bg-[#ffffff]/90 rounded-xl p-3 border border-[#e8dcce] text-xs text-[#524b42] leading-relaxed flex items-start gap-2", children: [_jsx("span", { className: "font-bold text-[#b86e42] text-xs mt-0.5", children: "\u2022" }), _jsx("span", { children: insight })] }, idx))) })] })), entry.synthesis.actionItems && entry.synthesis.actionItems.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "font-medium text-[#7d4f24] text-xs uppercase tracking-wider font-mono flex items-center gap-1.5", children: [_jsx(ListTodo, { className: "w-3.5 h-3.5 text-[#a86a34]" }), " Concrete Action Items"] }), _jsx("div", { className: "space-y-1.5", children: entry.synthesis.actionItems.map((action, idx) => {
                                    const isDone = !!completedActionItems[idx];
                                    return (_jsxs("div", { onClick: () => setCompletedActionItems((prev) => ({ ...prev, [idx]: !prev[idx] })), className: `flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none text-xs ${isDone
                                            ? "bg-[#edf3eb] border-[#cfdacb] text-[#55634b] line-through opacity-70"
                                            : "bg-[#ffffff] border-[#e8dcce] text-[#342f2b] hover:border-[#cfbea4]"}`, children: [_jsx(CheckCircle2, { className: `w-4 h-4 shrink-0 mt-0.5 transition-colors ${isDone ? "text-[#5b6851]" : "text-[#c2baa9]"}` }), _jsx("span", { className: "leading-relaxed", children: action })] }, idx));
                                }) })] }))] })), _jsxs("div", { id: "reflection-conversation-stream", className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsxs("h2", { className: "text-sm font-bold text-[#342f2b] uppercase tracking-wider font-mono flex items-center gap-2", children: [_jsx(BrainCircuit, { className: "w-4 h-4 text-[#5c544b]" }), _jsx("span", { children: "Multi-Turn Reflection Dialogue" })] }), _jsxs("span", { className: "text-xs text-[#7d756c]", children: [entry.messages.length, " ", entry.messages.length === 1 ? "turn" : "turns"] })] }), entry.messages.length === 0 && (_jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-6 shadow-xs text-center space-y-4", children: [_jsx("div", { className: "inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5eee3] text-[#7d562f] mb-1", children: _jsx(Sparkles, { className: "w-5 h-5 text-[#b8763f]" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-serif font-semibold text-[#2d2926] text-base", children: "Start a Dialogue with Gemini" }), _jsx("p", { className: "text-xs text-[#7d756c] max-w-md mx-auto mt-1", children: "Ask for a reflection on what you wrote above, brainstorm solutions, or select a cognitive starter:" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2", children: INSPIRATION_PROMPTS.map((starter, idx) => (_jsxs("button", { type: "button", onClick: () => handleSendPrompt(starter.prompt, starter.mode), className: "p-3.5 bg-[#faf7f0] hover:bg-[#f3ede1] border border-[#e5dfd2] rounded-xl text-xs transition-all group flex flex-col justify-between gap-2", children: [_jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx("span", { className: "font-semibold text-[#342f2b] group-hover:text-[#1e1b18]", children: starter.title }), _jsx(ChevronRight, { className: "w-3.5 h-3.5 text-[#8f877d] group-hover:translate-x-0.5 transition-transform" })] }), _jsxs("p", { className: "text-[#696157] text-[11px] leading-relaxed line-clamp-2", children: ["\"", starter.prompt, "\""] })] }, idx))) })] })), entry.messages.map((msg) => {
                        const isUser = msg.role === "user";
                        return (_jsxs("div", { className: `flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`, children: [_jsxs("div", { className: "flex items-center gap-2 px-1 text-[11px] text-[#7d756c]", children: [_jsx("span", { className: "font-medium", children: isUser ? "You" : "Gemini Reflection Partner" }), msg.mode && (_jsx("span", { className: "bg-[#f3eee4] text-[#524b42] px-1.5 py-0.2 rounded font-mono text-[10px]", children: msg.mode })), msg.modelUsed && (_jsx("span", { className: "text-[10px] text-[#7d4f24] bg-[#fbf2ea] px-1.5 py-0.2 rounded border border-[#ebd2bf] font-mono", children: msg.modelUsed })), _jsx("span", { children: new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })] }), _jsx("div", { className: `max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 sm:p-5 text-sm shadow-xs ${isUser
                                        ? "bg-[#342f2b] text-[#fdfbf7] rounded-br-xs"
                                        : "bg-[#ffffff] text-[#3b352f] border border-[#e5dfd2] rounded-bl-xs leading-relaxed"}`, children: isUser ? (_jsx("p", { className: "whitespace-pre-wrap leading-relaxed", children: msg.text })) : (_jsxs("div", { className: "space-y-3 text-[#3b352f]", children: [_jsx(Markdown, { children: msg.text }), _jsx("div", { className: "pt-2 border-t border-[#f0eae0] flex items-center justify-end", children: _jsxs("button", { type: "button", onClick: () => handleCopy(msg.id, msg.text), className: "text-[11px] text-[#8f877d] hover:text-[#2d2926] flex items-center gap-1 transition-colors", children: [copiedId === msg.id ? (_jsx(Check, { className: "w-3 h-3 text-[#5b6851]" })) : (_jsx(Copy, { className: "w-3 h-3" })), _jsx("span", { children: copiedId === msg.id ? "Copied" : "Copy" })] }) })] })) })] }, msg.id));
                    }), isGenerating && (_jsxs("div", { className: "flex items-start gap-3 bg-[#ffffff] border border-[#e5dfd2] rounded-2xl p-4 shadow-xs max-w-md animate-pulse", children: [_jsx("div", { className: "w-8 h-8 rounded-xl bg-[#f5eee3] flex items-center justify-center shrink-0", children: _jsx(Sparkles, { className: "w-4 h-4 text-[#b8763f] animate-spin" }) }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-xs font-semibold text-[#2d2926]", children: "Gemini is contemplating your thoughts..." }), _jsxs("p", { className: "text-[11px] text-[#7d756c]", children: ["Generating structured reflection with ", activeMode, " mode."] })] })] })), _jsx("div", { ref: messagesEndRef })] }), _jsxs("div", { id: "prompt-interaction-bar", className: "sticky bottom-4 z-30 bg-[#fdfbf7]/95 backdrop-blur-md rounded-2xl border border-[#e5dfd2] p-3 sm:p-4 shadow-md space-y-3", children: [_jsx("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none", children: MODES.map((m) => (_jsxs("button", { type: "button", onClick: () => setActiveMode(m.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${activeMode === m.id
                                ? "bg-[#342f2b] text-[#fdfbf7] shadow-xs"
                                : "bg-[#f3eee4] text-[#696157] hover:text-[#2d2926] hover:bg-[#e9e3d7]"}`, children: [m.icon, _jsx("span", { children: m.label })] }, m.id))) }), _jsxs("form", { onSubmit: (e) => {
                            e.preventDefault();
                            handleSendPrompt();
                        }, className: "flex items-center gap-2", children: [_jsx("input", { id: "prompt-text-input", type: "text", value: promptInput, onChange: (e) => setPromptInput(e.target.value), disabled: isGenerating, placeholder: activeMode === "reflect"
                                    ? "Ask Gemini to reflect on your thoughts, challenge an assumption, or find clarity..."
                                    : activeMode === "brainstorm"
                                        ? "Ask for creative options, solutions, or divergent paths..."
                                        : activeMode === "deepen"
                                            ? "Ask to explore underlying motives, emotions, or philosophical core..."
                                            : "Ask for a concise summary and next steps...", className: "flex-1 bg-[#ffffff] hover:bg-[#faf7f0] focus:bg-[#ffffff] border border-[#d6cebf] rounded-xl px-4 py-2.5 text-sm text-[#2d2926] placeholder:text-[#a1998e] focus:outline-hidden focus:ring-2 focus:ring-[#342f2b] transition-all" }), _jsxs("button", { id: "btn-submit-prompt", type: "submit", disabled: !promptInput.trim() || isGenerating, className: "bg-[#342f2b] hover:bg-[#25211e] text-[#fdfbf7] font-medium px-4 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0 text-sm", children: [_jsx("span", { children: "Send" }), _jsx(Send, { className: "w-3.5 h-3.5" })] })] })] })] }));
};
