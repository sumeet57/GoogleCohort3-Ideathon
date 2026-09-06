import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Send,
  Save,
  Check,
  Star,
  Copy,
  Lightbulb,
  Compass,
  FileText,
  BrainCircuit,
  RotateCcw,
  Tag,
  Smile,
  AlertCircle,
  HelpCircle,
  Clock,
  ListTodo,
  CheckCircle2,
  ChevronRight,
  MapPin
} from "lucide-react";
import { askGeminiReflection, askGeminiSummarize } from "../lib/gemini";
import { saveJournalEntry, auth } from "../lib/firebase";

const INSPIRATION_PROMPTS = [
  {
    title: "Daily Unload 🎈",
    prompt: "What is occupying the most mental bandwidth for me today, and why does it feel heavy?",
    mode: "reflect",
    accent: "hover:border-amber-400 hover:bg-amber-50/50",
  },
  {
    title: "Decision Crossroads ⚡",
    prompt: "I am trying to decide between two options. Help me examine the hidden assumptions and trade-offs.",
    mode: "brainstorm",
    accent: "hover:border-indigo-400 hover:bg-indigo-50/50",
  },
  {
    title: "Small Breakthrough ✨",
    prompt: "Here is a small breakthrough or moment of gratitude I experienced today. Help me anchor it.",
    mode: "deepen",
    accent: "hover:border-rose-400 hover:bg-rose-50/50",
  },
  {
    title: "Unblock Project 🚀",
    prompt: "I feel stuck on my current project. Let's brainstorm 3 unconventional angles to reignite momentum.",
    mode: "brainstorm",
    accent: "hover:border-emerald-400 hover:bg-emerald-50/50",
  },
];

const MODES = [
  {
    id: "reflect",
    label: "Reflect",
    icon: <HelpCircle className="w-3.5 h-3.5 text-amber-700" />,
    badgeClass: "bg-amber-300 text-slate-900 border-slate-900",
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    icon: <Lightbulb className="w-3.5 h-3.5 text-indigo-700" />,
    badgeClass: "bg-indigo-300 text-slate-900 border-slate-900",
  },
  {
    id: "deepen",
    label: "Deepen",
    icon: <Compass className="w-3.5 h-3.5 text-rose-700" />,
    badgeClass: "bg-rose-300 text-slate-900 border-slate-900",
  },
  {
    id: "summarize",
    label: "Synthesis",
    icon: <FileText className="w-3.5 h-3.5 text-emerald-700" />,
    badgeClass: "bg-emerald-300 text-slate-900 border-slate-900",
  },
];

export const JournalEditor = ({
  userId,
  currentEntry,
  onEntrySaved,
  onNewReflection,
}) => {
  const [entry, setEntry] = useState(() => {
    if (currentEntry) return currentEntry;
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
  const [isLocating, setIsLocating] = useState(false);

  const messagesEndRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (currentEntry) {
      setEntry(currentEntry);
      setSaveStatus("saved");
      setErrorMessage(null);
    }
  }, [currentEntry?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entry.messages, isGenerating]);

  const persistEntry = async (updated) => {
    try {
      setSaveStatus("saving");
      setErrorMessage(null);
      await saveJournalEntry(userId, updated);
      setSaveStatus("saved");
      onEntrySaved(updated);
    } catch (err) {
      console.error("[Save Error]", err);
      setSaveStatus("error");
      setErrorMessage(err?.message || "Failed to save reflection to Firestore.");
    }
  };

  const calculateWordCount = (thought, msgs) => {
    const allText = thought + " " + msgs.map((m) => m.text).join(" ");
    return allText.trim().split(/\s+/).filter(Boolean).length;
  };

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

  const handleSaveThought = async () => {
    await persistEntry(entry);
  };

  const handleToggleFavorite = async () => {
    const updated = {
      ...entry,
      isFavorite: !entry.isFavorite,
      updatedAt: Date.now(),
    };
    setEntry(updated);
    await persistEntry(updated);
  };

  const handleSendPrompt = async (customPrompt, customMode) => {
    const textToSend = (customPrompt || promptInput).trim();
    if (!textToSend || isGenerating) return;

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
      const result = await askGeminiReflection({
        prompt: textToSend,
        history: entry.messages,
        mode,
        entryContext: entry.initialThought,
        location: entry.location ? entry.location : null,
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
    } catch (err) {
      console.error("[Gemini Chat Error]", err);
      setErrorMessage(err?.message || "Failed to generate reflection response.");
      setSaveStatus("error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSynthesis = async () => {
    if (isSummarizing) return;
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
    } catch (err) {
      console.error("[Synthesis Error]", err);
      setErrorMessage(err?.message || "Failed to generate AI synthesis.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAttachLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error("User must be authenticated to pin location.");
          }
          const token = await currentUser.getIdToken();

          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/location/geocode?lat=${lat}&lng=${lng}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Geocoding failed");
          }

          const geoData = await res.json();

          const updatedLocation = {
            latitude: lat,
            longitude: lng,
            address: geoData.address || "",
            placeName: geoData.placeName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          };

          const updatedEntry = { ...entry, location: updatedLocation, updatedAt: Date.now() };
          setEntry(updatedEntry);
          await persistEntry(updatedEntry);
        } catch (err) {
          console.error("Location error:", err);
          setErrorMessage(err.message || "Failed to retrieve location details.");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert("Unable to retrieve location from browser. Please allow location permissions.");
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-6 py-3 sm:py-8 space-y-4 sm:space-y-6 text-slate-800 selection:bg-amber-200">
      {/* Header Panel */}
      <div id="journal-editor-header" className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3 sm:space-y-4">
        <div className="flex flex-col gap-2.5">
          <input
            id="entry-title-input"
            ref={titleInputRef}
            type="text"
            value={entry.title}
            onChange={(e) => {
              const val = e.target.value;
              setEntry((prev) => ({ ...prev, title: val, updatedAt: Date.now() }));
              setSaveStatus("unsaved");
            }}
            onBlur={() => persistEntry(entry)}
            placeholder="Title of this reflection..."
            className="w-full text-lg sm:text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-slate-200 focus:border-amber-400 focus:outline-none pb-1 transition-colors tracking-tight"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t-2 border-slate-100">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {new Date(entry.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {entry.wordCount} words
              </span>

              {entry.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${entry.location.latitude},${entry.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span className="max-w-[110px] sm:max-w-[130px] truncate font-semibold">{entry.location.placeName || "Pinned"}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleAttachLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all hover:border-slate-900"
                >
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{isLocating ? "Locating..." : "Pin location"}</span>
                </button>
              )}

              <span
                id="save-status-indicator"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono text-[10px] uppercase font-extrabold border-2 ${
                  saveStatus === "saved"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-900"
                    : saveStatus === "saving"
                    ? "bg-amber-300 text-slate-900 border-slate-900 animate-pulse"
                    : saveStatus === "unsaved"
                    ? "bg-slate-100 text-slate-700 border-slate-300"
                    : "bg-rose-100 text-rose-900 border-rose-900"
                }`}
              >
                {saveStatus === "saved" && <Check className="w-3 h-3" />}
                {saveStatus === "saving" && <RotateCcw className="w-3 h-3 animate-spin" />}
                {saveStatus === "unsaved" && <Save className="w-3 h-3" />}
                {saveStatus === "error" && <AlertCircle className="w-3 h-3" />}
                {saveStatus}
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                id="btn-toggle-favorite"
                type="button"
                onClick={handleToggleFavorite}
                title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={`p-2 rounded-xl border-2 border-slate-900 transition-all ${
                  entry.isFavorite
                    ? "bg-amber-300 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    : "bg-white text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Star className={`w-4 h-4 ${entry.isFavorite ? "fill-slate-900 text-slate-900" : ""}`} />
              </button>

              <button
                id="btn-generate-synthesis"
                type="button"
                disabled={isSummarizing || isGenerating}
                onClick={handleGenerateSynthesis}
                className="flex items-center gap-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-950 border-2 border-slate-900 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] disabled:opacity-50"
              >
                <BrainCircuit className={`w-3.5 h-3.5 text-indigo-600 ${isSummarizing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isSummarizing ? "Synthesizing..." : "Synthesize"}</span>
              </button>

              <button
                id="btn-manual-save"
                type="button"
                onClick={handleSaveThought}
                title="Save now"
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {(entry.mood || (entry.tags && entry.tags.length > 0)) && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t-2 border-slate-100 flex-wrap">
            {entry.mood && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-300">
                <Smile className="w-3.5 h-3.5 text-amber-600" />
                <span>Mood: {entry.mood}</span>
              </span>
            )}
            {entry.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                <span>#{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div id="editor-error-banner" className="bg-rose-100 border-2 border-slate-900 text-rose-950 p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            id="btn-retry-save"
            type="button"
            onClick={() => persistEntry(entry)}
            className="px-3 py-1 bg-white border border-slate-900 text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Raw Entry TextArea Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 sm:p-5 space-y-2 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block border border-slate-900"></span>
            Raw Journal Entry & Thoughts
          </label>
        </div>
        <textarea
          id="initial-thought-textarea"
          value={entry.initialThought}
          onChange={(e) => handleThoughtChange(e.target.value)}
          onBlur={handleSaveThought}
          placeholder="Unload whatever is on your mind today: events, emotional state, dilemmas, creative ideas, or questions you are grappling with..."
          rows={4}
          className="w-full bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:bg-white rounded-xl p-3 text-slate-900 text-xs sm:text-sm leading-relaxed placeholder:text-slate-400 focus:outline-none transition-all resize-y font-medium"
        />
      </div>

      {entry.synthesis && (
        <div id="ai-synthesis-card" className="bg-amber-50/60 border-2 border-slate-900 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-300 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0">
                <BrainCircuit className="w-4 h-4 text-slate-900" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-base tracking-tight">
                Executive Cognitive Synthesis
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleCopy("synthesis", `${entry.synthesis?.summary}\n\nKey Insights:\n${entry.synthesis?.insights?.join("\n")}`)}
              className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all shrink-0"
            >
              {copiedId === "synthesis" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === "synthesis" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-3.5 border-2 border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            <p className="font-extrabold text-amber-800 mb-1 text-[10px] uppercase tracking-wider font-mono">Summary</p>
            {entry.synthesis.summary}
          </div>

          {entry.synthesis.insights && entry.synthesis.insights.length > 0 && (
            <div className="space-y-1.5 sm:space-y-2">
              <p className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Key Insights & Realizations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entry.synthesis.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-3 border-2 border-slate-200 text-xs text-slate-800 leading-relaxed font-medium flex items-start gap-2"
                  >
                    <span className="font-bold text-amber-500 text-sm leading-none">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry.synthesis.actionItems && entry.synthesis.actionItems.length > 0 && (
            <div className="space-y-1.5 sm:space-y-2">
              <p className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-indigo-500" /> Concrete Action Items
              </p>
              <div className="space-y-1.5">
                {entry.synthesis.actionItems.map((action, idx) => {
                  const isDone = !!completedActionItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => setCompletedActionItems((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                      className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer select-none text-xs font-semibold ${
                        isDone
                          ? "bg-slate-100 border-slate-300 text-slate-400 line-through"
                          : "bg-white border-slate-900 text-slate-800 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${
                          isDone ? "text-slate-400" : "text-emerald-500"
                        }`}
                      />
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Turn Dialogue Stream */}
      <div id="reflection-conversation-stream" className="space-y-2.5 sm:space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            <span>Multi-Turn Dialogue</span>
          </h2>
          <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {entry.messages.length} {entry.messages.length === 1 ? "turn" : "turns"}
          </span>
        </div>

        {entry.messages.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-slate-900 p-4 sm:p-6 text-center space-y-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-amber-300 border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                Start a Dialogue with Gemini
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-0.5 font-medium leading-relaxed">
                Select a starter to begin exploring your reflection:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
              {INSPIRATION_PROMPTS.map((starter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(starter.prompt, starter.mode)}
                  className={`p-3 bg-slate-50 hover:bg-white border-2 border-slate-200 hover:border-slate-900 rounded-xl text-xs transition-all group flex flex-col justify-between gap-1.5 ${starter.accent}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-slate-900 text-xs">
                      {starter.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-all" />
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2 font-medium">
                    "{starter.prompt}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {entry.messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
            >
              <div className="flex items-center gap-1.5 px-1 text-[10px] sm:text-xs font-mono font-bold text-slate-500">
                <span className="text-slate-900">
                  {isUser ? "You" : "Gemini Partner"}
                </span>
                {msg.mode && (
                  <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300">
                    {msg.mode}
                  </span>
                )}
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div
                className={`max-w-[95%] sm:max-w-[85%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                  isUser
                    ? "bg-slate-900 text-white rounded-br-none"
                    : "bg-white text-slate-800 rounded-bl-none font-medium"
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                ) : (
                  <div className="space-y-2 text-slate-800">
                    <Markdown>{msg.text}</Markdown>
                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-center gap-2.5 bg-white border-2 border-slate-900 rounded-2xl p-2.5 sm:p-3 max-w-xs shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <div className="w-6 h-6 rounded-lg bg-amber-300 border border-slate-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-slate-900 animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-900">
              Gemini is reflecting...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prominent Fixed High-Contrast Prompt Box */}
      <div id="prompt-interaction-bar" className="sticky bottom-2 sm:bottom-4 z-30 bg-amber-200 border-2 border-slate-900 rounded-2xl p-2.5 sm:p-3.5 space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap border-2 transition-all ${
                activeMode === m.id
                  ? `${m.badgeClass} shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]`
                  : "bg-white text-slate-700 border-slate-900 hover:bg-slate-50"
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="prompt-text-input"
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            disabled={isGenerating}
            placeholder={
              activeMode === "reflect"
                ? "Ask Gemini to reflect on your thoughts..."
                : activeMode === "brainstorm"
                ? "Ask for creative options, solutions..."
                : activeMode === "deepen"
                ? "Ask to explore underlying motives..."
                : "Ask for a concise summary..."
            }
            className="flex-1 bg-white border-2 border-slate-900 focus:bg-amber-50 focus:border-slate-900 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-500 placeholder:font-normal focus:outline-none transition-all"
          />

          <button
            id="btn-submit-prompt"
            type="submit"
            disabled={!promptInput.trim() || isGenerating}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 sm:px-4 py-2 rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 flex items-center gap-1.5 shrink-0 text-xs sm:text-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};