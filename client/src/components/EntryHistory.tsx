import React, { useState, useMemo } from "react";
import {
  Search,
  Star,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  Smile,
  Tag,
  BookOpen,
  MessageSquare,
  Sparkles,
  FileText,
  AlertCircle
} from "lucide-react";
import type { JournalEntry } from "../types";
import { deleteJournalEntry, toggleFavoriteEntry } from "../lib/firebase";

interface EntryHistoryProps {
  userId: string;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  userId,
  entries,
  onSelectEntry,
  onNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all unique moods from entries
  const availableMoods = useMemo(() => {
    const moods = new Set<string>();
    entries.forEach((e) => {
      if (e.mood) moods.add(e.mood);
      if (e.synthesis?.dominantMood) moods.add(e.synthesis.dominantMood);
    });
    return Array.from(moods);
  }, [entries]);

  // Filter entries
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
        return matchesTitle || matchesThought || matchesSummary || matchesInsights || matchesMessages || matchesTags;
      }

      return true;
    });
  }, [entries, searchQuery, selectedMood, onlyFavorites]);

  const handleDelete = async (entryId: string, e: React.MouseEvent) => {
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

  const handleToggleFav = async (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavoriteEntry(userId, entry.id, !!entry.isFavorite);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleExport = (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    let md = `# ${entry.title}\n`;
    md += `*Date: ${new Date(entry.createdAt).toLocaleString()}*\n`;
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
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#2d2926]">
            Reflection Archives
          </h1>
          <p className="text-xs text-[#7d756c] mt-1">
            {entries.length} user-isolated entries securely preserved in Cloud Firestore
          </p>
        </div>

        <button
          id="btn-history-new-reflection"
          type="button"
          onClick={onNewEntry}
          className="inline-flex items-center gap-2 bg-[#342f2b] hover:bg-[#25211e] text-[#fdfbf7] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#e5b382]" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, insights, or dialogues..."
              className="w-full pl-9 pr-4 py-2 bg-[#faf7f0] border border-[#ded7c7] rounded-xl text-xs text-[#2d2926] placeholder:text-[#a1998e] focus:outline-hidden focus:ring-2 focus:ring-[#342f2b] focus:bg-[#ffffff] transition-all"
            />
            <Search className="w-4 h-4 text-[#a1998e] absolute left-3 top-2.5" />
          </div>

          {/* Filter Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-filter-favorites"
              type="button"
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                onlyFavorites
                  ? "bg-[#fbf4ea] border-[#eddac2] text-[#8a5d32]"
                  : "bg-[#faf7f0] border-[#ded7c7] text-[#696157] hover:text-[#2d2926]"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-[#c48b5b] text-[#c48b5b]" : "text-[#a1998e]"}`} />
              <span>Favorites Only</span>
            </button>

            {availableMoods.length > 0 && (
              <select
                id="select-mood-filter"
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="bg-[#faf7f0] border border-[#ded7c7] text-[#524b42] text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#342f2b]"
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

      {/* Entries List / Cards */}
      {filteredEntries.length === 0 ? (
        <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f5eee3] text-[#7d562f] flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-[#2d2926] text-base">
              {entries.length === 0 ? "No Journal Entries Yet" : "No Matching Reflections"}
            </h3>
            <p className="text-xs text-[#7d756c] max-w-sm mx-auto mt-1">
              {entries.length === 0
                ? "Begin your first deep reflection or brain dump to start building your personal cognition repository."
                : "Try adjusting your search terms or filters to find what you are looking for."}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              type="button"
              onClick={onNewEntry}
              className="inline-flex items-center gap-2 bg-[#342f2b] text-[#fdfbf7] text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#25211e] transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e5b382]" />
              <span>Create First Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
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
                className="bg-[#ffffff] hover:bg-[#faf7f0] border border-[#e5dfd2] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-[#2d2926] text-base sm:text-lg group-hover:text-[#4a443f] transition-colors truncate">
                        {entry.title}
                      </h3>
                      {entry.isFavorite && (
                        <Star className="w-3.5 h-3.5 fill-[#c48b5b] text-[#c48b5b] shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#7d756c] flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#a1998e]" />
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-[#a1998e]" />
                        {entry.messages.length} {entry.messages.length === 1 ? "turn" : "turns"}
                      </span>
                      <span>•</span>
                      <span>{entry.wordCount || 0} words</span>

                      {(entry.mood || entry.synthesis?.dominantMood) && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 bg-[#edf2ea] text-[#48563d] px-2 py-0.5 rounded-md font-medium text-[10px] border border-[#cfdacb]">
                            <Smile className="w-3 h-3 text-[#5b6851]" />
                            {entry.mood || entry.synthesis?.dominantMood}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFav(entry, e)}
                      title={entry.isFavorite ? "Unfavorite" : "Favorite"}
                      className="p-2 text-[#a1998e] hover:text-[#c48b5b] hover:bg-[#f3ede1] rounded-lg transition-colors"
                    >
                      <Star className={`w-4 h-4 ${entry.isFavorite ? "fill-[#c48b5b] text-[#c48b5b]" : ""}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExport(entry, e)}
                      title="Export as Markdown"
                      className="p-2 text-[#a1998e] hover:text-[#2d2926] hover:bg-[#f3ede1] rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === entry.id}
                      onClick={(e) => handleDelete(entry.id, e)}
                      title="Delete entry"
                      className="p-2 text-[#a1998e] hover:text-[#9e3a2f] hover:bg-[#fbeae7] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                <p className="text-xs text-[#5c544b] leading-relaxed line-clamp-2">
                  {previewText}
                </p>

                {/* Insights Pills / Tags */}
                <div className="flex items-center justify-between pt-1 border-t border-[#f0eae0] text-[11px] text-[#7d756c]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#f3eee4] text-[#524b42] px-2 py-0.5 rounded text-[10px] font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                    {entry.synthesis?.insights && entry.synthesis.insights.length > 0 && (
                      <span className="text-[#7d4f24] bg-[#fbf2ea] px-2 py-0.5 rounded text-[10px] font-medium border border-[#ebd2bf]">
                        {entry.synthesis.insights.length} Insights synthesized
                      </span>
                    )}
                  </div>

                  <span className="text-[#a1998e] group-hover:text-[#2d2926] font-medium flex items-center gap-1">
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
