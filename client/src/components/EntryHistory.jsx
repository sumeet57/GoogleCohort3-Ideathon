import React, { useState, useMemo } from "react";
import { Search, Star, Trash2, ExternalLink, Download, Calendar, Smile, BookOpen, MessageSquare, Sparkles, MapPin } from "lucide-react";
import { deleteJournalEntry, toggleFavoriteEntry } from "../lib/firebase";

export const EntryHistory = ({ userId, entries, onSelectEntry, onNewEntry }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const availableMoods = useMemo(() => {
    const moods = new Set();
    entries.forEach((e) => {
      if (e.mood) moods.add(e.mood);
      if (e.synthesis?.dominantMood) moods.add(e.synthesis.dominantMood);
    });
    return Array.from(moods);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (onlyFavorites && !entry.isFavorite) return false;
      if (selectedMood !== "all") {
        const mood = entry.mood || entry.synthesis?.dominantMood;
        if (mood?.toLowerCase() !== selectedMood.toLowerCase()) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title?.toLowerCase().includes(q);
        const matchesThought = entry.initialThought?.toLowerCase().includes(q);
        const matchesSummary = entry.synthesis?.summary?.toLowerCase().includes(q);
        const matchesInsights = entry.synthesis?.insights?.some((i) => i.toLowerCase().includes(q));
        const matchesMessages = entry.messages?.some((m) => m.text?.toLowerCase().includes(q));
        const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesLocation = entry.location?.placeName?.toLowerCase().includes(q) || entry.location?.address?.toLowerCase().includes(q);
        return matchesTitle || matchesThought || matchesSummary || matchesInsights || matchesMessages || matchesTags || matchesLocation;
      }

      return true;
    });
  }, [entries, searchQuery, selectedMood, onlyFavorites]);

  const handleDelete = async (entryId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this journal reflection?")) {
      try {
        setDeletingId(entryId);
        await deleteJournalEntry(userId, entryId);
      } catch (err) {
        console.error("Failed to delete entry:", err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleToggleFav = async (entry, e) => {
    e.stopPropagation();
    try {
      await toggleFavoriteEntry(userId, entry.id, !!entry.isFavorite);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleExport = (entry, e) => {
    e.stopPropagation();
    let md = `# ${entry.title}\n`;
    md += `*Date: ${new Date(entry.createdAt).toLocaleString()}*\n`;
    if (entry.location?.placeName) md += `*Location: ${entry.location.placeName}*\n`;
    if (entry.mood) md += `*Mood: ${entry.mood}*\n`;
    if (entry.tags && entry.tags.length > 0) md += `*Tags: ${entry.tags.join(", ")}*\n`;
    md += `\n---\n\n`;

    if (entry.initialThought) {
      md += `## Raw Journal Entry\n\n${entry.initialThought}\n\n`;
    }

    if (entry.synthesis) {
      md += `## AI Synthesis\n\n${entry.synthesis.summary}\n\n`;
      if (entry.synthesis.insights?.length) {
        md += `### Key Realizations\n`;
        entry.synthesis.insights.forEach((i) => {
          md += `- ${i}\n`;
        });
        md += `\n`;
      }
      if (entry.synthesis.actionItems?.length) {
        md += `### Action Items\n`;
        entry.synthesis.actionItems.forEach((a) => {
          md += `- [ ] ${a}\n`;
        });
        md += `\n`;
      }
    }

    if (entry.messages?.length > 0) {
      md += `## Reflection Dialogue\n\n`;
      entry.messages.forEach((m) => {
        md += `### ${m.role === "user" ? "You" : "Gemini"} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.text}\n\n`;
      });
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-1.5 sm:px-6 py-2 sm:py-8 space-y-3 sm:space-y-6 text-slate-800 selection:bg-amber-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-2 border-b-2 border-slate-900">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Reflection Archives
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 font-medium">
            {entries.length} user-isolated entries securely preserved in Cloud Firestore
          </p>
        </div>

        <button
          id="btn-history-new-reflection"
          type="button"
          onClick={onNewEntry}
          className="inline-flex items-center justify-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-extrabold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none self-stretch sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-900" />
          <span>New Reflection</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-900 p-2.5 sm:p-4 space-y-2 sm:space-y-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, places, insights, or dialogues..."
              className="w-full pl-8 sm:pl-9 pr-3.5 py-1.5 sm:py-2 bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-2.5 sm:top-2.5" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="btn-filter-favorites"
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                onlyFavorites
                  ? "bg-amber-300 border-slate-900 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-slate-900 text-slate-900" : "text-slate-400"}`} />
              <span>Favorites</span>
            </button>

            {availableMoods.length > 0 && (
              <select
                id="select-mood-filter"
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="flex-1 sm:flex-none bg-slate-50 border-2 border-slate-200 text-slate-900 text-xs font-extrabold rounded-xl px-2.5 py-1.5 sm:py-2 focus:outline-none focus:border-slate-900"
              >
                <option value="all">All Moods</option>
                {availableMoods.map((m) => (
                  <option key={m} value={m}>
                    Mood: {m}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-6 sm:p-12 text-center space-y-3 sm:space-y-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 text-slate-900 flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
              {entries.length === 0 ? "No Journal Entries Yet" : "No Matching Reflections"}
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto mt-0.5 font-medium leading-relaxed">
              {entries.length === 0
                ? "Begin your first deep reflection or brain dump to start building your personal cognition repository."
                : "Try adjusting your search terms or filters to find what you are looking for."}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              type="button"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 bg-amber-300 hover:bg-amber-400 text-slate-900 text-xs font-extrabold px-3.5 py-2 rounded-xl border-2 border-slate-900 transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>Create First Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-4">
          {filteredEntries.map((entry) => {
            const previewText =
              entry.synthesis?.summary ||
              entry.initialThought ||
              (entry.messages.length > 0 ? entry.messages[0].text : "No text content yet.");

            return (
              <div
                key={entry.id}
                id={`entry-card-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className="bg-white hover:bg-slate-50 border-2 border-slate-900 rounded-2xl p-3.5 sm:p-5 transition-all cursor-pointer group space-y-2.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                        {entry.title}
                      </h3>
                      {entry.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>

                      {entry.location && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${entry.location.latitude},${entry.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-900 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded border border-slate-900 transition-colors"
                        >
                          <MapPin className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span className="max-w-[100px] truncate font-bold">{entry.location.placeName || "Pinned"}</span>
                        </a>
                      )}

                      <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <MessageSquare className="w-3 h-3 text-indigo-500" />
                        {entry.messages.length} {entry.messages.length === 1 ? "turn" : "turns"}
                      </span>
                      
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{entry.wordCount || 0} words</span>

                      {(entry.mood || entry.synthesis?.dominantMood) && (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold text-[10px] border border-amber-300">
                          <Smile className="w-3 h-3 text-amber-600" />
                          {entry.mood || entry.synthesis?.dominantMood}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFav(entry, e)}
                      title={entry.isFavorite ? "Unfavorite" : "Favorite"}
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${entry.isFavorite ? "fill-slate-900 text-slate-900" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExport(entry, e)}
                      title="Export as Markdown"
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === entry.id}
                      onClick={(e) => handleDelete(entry.id, e)}
                      title="Delete entry"
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 font-medium">
                  {previewText}
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 text-[10px] sm:text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1 flex-wrap">
                    {entry.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                    {entry.synthesis?.insights && entry.synthesis.insights.length > 0 && (
                      <span className="text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-extrabold border border-amber-300">
                        {entry.synthesis.insights.length} Insights
                      </span>
                    )}
                  </div>

                  <span className="text-slate-900 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};