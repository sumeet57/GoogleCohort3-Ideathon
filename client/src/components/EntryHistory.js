import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useMemo } from "react";
import { Search, Star, Trash2, ExternalLink, Download, Calendar, Smile, BookOpen, MessageSquare, Sparkles } from "lucide-react";
import { deleteJournalEntry, toggleFavoriteEntry } from "../lib/firebase";
export const EntryHistory = ({ userId, entries, onSelectEntry, onNewEntry, }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMood, setSelectedMood] = useState("all");
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    // Extract all unique moods from entries
    const availableMoods = useMemo(() => {
        const moods = new Set();
        entries.forEach((e) => {
            if (e.mood)
                moods.add(e.mood);
            if (e.synthesis?.dominantMood)
                moods.add(e.synthesis.dominantMood);
        });
        return Array.from(moods);
    }, [entries]);
    // Filter entries
    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            if (onlyFavorites && !entry.isFavorite)
                return false;
            if (selectedMood !== "all") {
                const mood = entry.mood || entry.synthesis?.dominantMood;
                if (mood?.toLowerCase() !== selectedMood.toLowerCase())
                    return false;
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
    const handleDelete = async (entryId, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to permanently delete this journal reflection?")) {
            try {
                setDeletingId(entryId);
                await deleteJournalEntry(userId, entryId);
            }
            catch (err) {
                console.error("Failed to delete entry:", err);
            }
            finally {
                setDeletingId(null);
            }
        }
    };
    const handleToggleFav = async (entry, e) => {
        e.stopPropagation();
        try {
            await toggleFavoriteEntry(userId, entry.id, !!entry.isFavorite);
        }
        catch (err) {
            console.error("Failed to toggle favorite:", err);
        }
    };
    const handleExport = (entry, e) => {
        e.stopPropagation();
        let md = `# ${entry.title}\n`;
        md += `*Date: ${new Date(entry.createdAt).toLocaleString()}*\n`;
        if (entry.mood)
            md += `*Mood: ${entry.mood}*\n`;
        if (entry.tags && entry.tags.length > 0)
            md += `*Tags: ${entry.tags.join(", ")}*\n`;
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
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-serif text-2xl font-bold text-[#2d2926]", children: "Reflection Archives" }), _jsxs("p", { className: "text-xs text-[#7d756c] mt-1", children: [entries.length, " user-isolated entries securely preserved in Cloud Firestore"] })] }), _jsxs("button", { id: "btn-history-new-reflection", type: "button", onClick: onNewEntry, className: "inline-flex items-center gap-2 bg-[#342f2b] hover:bg-[#25211e] text-[#fdfbf7] text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors self-start sm:self-auto", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 text-[#e5b382]" }), _jsx("span", { children: "New Reflection" })] })] }), _jsx("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 shadow-xs space-y-3", children: _jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx("input", { id: "history-search-input", type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search reflections, insights, or dialogues...", className: "w-full pl-9 pr-4 py-2 bg-[#faf7f0] border border-[#ded7c7] rounded-xl text-xs text-[#2d2926] placeholder:text-[#a1998e] focus:outline-hidden focus:ring-2 focus:ring-[#342f2b] focus:bg-[#ffffff] transition-all" }), _jsx(Search, { className: "w-4 h-4 text-[#a1998e] absolute left-3 top-2.5" })] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsxs("button", { id: "btn-filter-favorites", type: "button", onClick: () => setOnlyFavorites(!onlyFavorites), className: `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${onlyFavorites
                                        ? "bg-[#fbf4ea] border-[#eddac2] text-[#8a5d32]"
                                        : "bg-[#faf7f0] border-[#ded7c7] text-[#696157] hover:text-[#2d2926]"}`, children: [_jsx(Star, { className: `w-3.5 h-3.5 ${onlyFavorites ? "fill-[#c48b5b] text-[#c48b5b]" : "text-[#a1998e]"}` }), _jsx("span", { children: "Favorites Only" })] }), availableMoods.length > 0 && (_jsxs("select", { id: "select-mood-filter", value: selectedMood, onChange: (e) => setSelectedMood(e.target.value), className: "bg-[#faf7f0] border border-[#ded7c7] text-[#524b42] text-xs rounded-xl px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#342f2b]", children: [_jsx("option", { value: "all", children: "All Moods" }), availableMoods.map((m) => (_jsxs("option", { value: m, children: ["Mood: ", m] }, m)))] }))] })] }) }), filteredEntries.length === 0 ? (_jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-12 text-center shadow-xs space-y-4", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-[#f5eee3] text-[#7d562f] flex items-center justify-center mx-auto", children: _jsx(BookOpen, { className: "w-6 h-6" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-serif font-bold text-[#2d2926] text-base", children: entries.length === 0 ? "No Journal Entries Yet" : "No Matching Reflections" }), _jsx("p", { className: "text-xs text-[#7d756c] max-w-sm mx-auto mt-1", children: entries.length === 0
                                    ? "Begin your first deep reflection or brain dump to start building your personal cognition repository."
                                    : "Try adjusting your search terms or filters to find what you are looking for." })] }), entries.length === 0 && (_jsxs("button", { type: "button", onClick: onNewEntry, className: "inline-flex items-center gap-2 bg-[#342f2b] text-[#fdfbf7] text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#25211e] transition-colors shadow-2xs", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5 text-[#e5b382]" }), _jsx("span", { children: "Create First Entry" })] }))] })) : (_jsx("div", { className: "grid grid-cols-1 gap-4", children: filteredEntries.map((entry) => {
                    const previewText = entry.synthesis?.summary ||
                        entry.initialThought ||
                        (entry.messages.length > 0 ? entry.messages[0].text : "No text content yet.");
                    return (_jsxs("div", { id: `entry-card-${entry.id}`, onClick: () => onSelectEntry(entry), className: "bg-[#ffffff] hover:bg-[#faf7f0] border border-[#e5dfd2] rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-sm transition-all cursor-pointer group space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "space-y-1 flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("h3", { className: "font-serif font-bold text-[#2d2926] text-base sm:text-lg group-hover:text-[#4a443f] transition-colors truncate", children: entry.title }), entry.isFavorite && (_jsx(Star, { className: "w-3.5 h-3.5 fill-[#c48b5b] text-[#c48b5b] shrink-0" }))] }), _jsxs("div", { className: "flex items-center gap-3 text-[11px] text-[#7d756c] flex-wrap", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3 h-3 text-[#a1998e]" }), new Date(entry.createdAt).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-3 h-3 text-[#a1998e]" }), entry.messages.length, " ", entry.messages.length === 1 ? "turn" : "turns"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [entry.wordCount || 0, " words"] }), (entry.mood || entry.synthesis?.dominantMood) && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { className: "inline-flex items-center gap-1 bg-[#edf2ea] text-[#48563d] px-2 py-0.5 rounded-md font-medium text-[10px] border border-[#cfdacb]", children: [_jsx(Smile, { className: "w-3 h-3 text-[#5b6851]" }), entry.mood || entry.synthesis?.dominantMood] })] }))] })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { type: "button", onClick: (e) => handleToggleFav(entry, e), title: entry.isFavorite ? "Unfavorite" : "Favorite", className: "p-2 text-[#a1998e] hover:text-[#c48b5b] hover:bg-[#f3ede1] rounded-lg transition-colors", children: _jsx(Star, { className: `w-4 h-4 ${entry.isFavorite ? "fill-[#c48b5b] text-[#c48b5b]" : ""}` }) }), _jsx("button", { type: "button", onClick: (e) => handleExport(entry, e), title: "Export as Markdown", className: "p-2 text-[#a1998e] hover:text-[#2d2926] hover:bg-[#f3ede1] rounded-lg transition-colors", children: _jsx(Download, { className: "w-4 h-4" }) }), _jsx("button", { type: "button", disabled: deletingId === entry.id, onClick: (e) => handleDelete(entry.id, e), title: "Delete entry", className: "p-2 text-[#a1998e] hover:text-[#9e3a2f] hover:bg-[#fbeae7] rounded-lg transition-colors", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }), _jsx("p", { className: "text-xs text-[#5c544b] leading-relaxed line-clamp-2", children: previewText }), _jsxs("div", { className: "flex items-center justify-between pt-1 border-t border-[#f0eae0] text-[11px] text-[#7d756c]", children: [_jsxs("div", { className: "flex items-center gap-1.5 flex-wrap", children: [entry.tags?.slice(0, 3).map((tag) => (_jsxs("span", { className: "bg-[#f3eee4] text-[#524b42] px-2 py-0.5 rounded text-[10px] font-mono", children: ["#", tag] }, tag))), entry.synthesis?.insights && entry.synthesis.insights.length > 0 && (_jsxs("span", { className: "text-[#7d4f24] bg-[#fbf2ea] px-2 py-0.5 rounded text-[10px] font-medium border border-[#ebd2bf]", children: [entry.synthesis.insights.length, " Insights synthesized"] }))] }), _jsxs("span", { className: "text-[#a1998e] group-hover:text-[#2d2926] font-medium flex items-center gap-1", children: [_jsx("span", { children: "Open" }), _jsx(ExternalLink, { className: "w-3 h-3" })] })] })] }, entry.id));
                }) }))] }));
};
