import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
import { Sparkles, BookOpen, Smile, Lightbulb, TrendingUp } from "lucide-react";
export const StatsInsights = ({ entries, onSelectEntry, }) => {
    // Aggregate Metrics
    const totalEntries = entries.length;
    const totalWords = useMemo(() => entries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0), [entries]);
    const totalTurns = useMemo(() => entries.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0), [entries]);
    // Mood Frequency Map
    const moodDistribution = useMemo(() => {
        const counts = {};
        entries.forEach((e) => {
            const m = e.mood || e.synthesis?.dominantMood;
            if (m) {
                counts[m] = (counts[m] || 0) + 1;
            }
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [entries]);
    // Extract all synthesized insights across all entries
    const allInsights = useMemo(() => {
        const list = [];
        entries.forEach((e) => {
            if (e.synthesis?.insights) {
                e.synthesis.insights.forEach((insight) => {
                    list.push({
                        text: insight,
                        entryTitle: e.title,
                        entry: e,
                        date: e.createdAt,
                    });
                });
            }
        });
        return list.sort((a, b) => b.date - a.date);
    }, [entries]);
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-serif text-2xl font-bold text-[#2d2926]", children: "Cognitive Analytics & Insights" }), _jsx("p", { className: "text-xs text-[#7d756c] mt-1", children: "Patterns, breakthroughs, and emotional distribution across your reflection history" })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3.5", children: [_jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[#7d756c] text-xs", children: [_jsx("span", { className: "font-medium", children: "Total Reflections" }), _jsx(BookOpen, { className: "w-4 h-4 text-[#a1998e]" })] }), _jsx("p", { className: "font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]", children: totalEntries }), _jsx("p", { className: "text-[11px] text-[#7d756c]", children: "Firestore preserved" })] }), _jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[#7d756c] text-xs", children: [_jsx("span", { className: "font-medium", children: "Words Written" }), _jsx(TrendingUp, { className: "w-4 h-4 text-[#5b6851]" })] }), _jsx("p", { className: "font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]", children: totalWords.toLocaleString() }), _jsx("p", { className: "text-[11px] text-[#7d756c]", children: "Thoughts articulated" })] }), _jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[#7d756c] text-xs", children: [_jsx("span", { className: "font-medium", children: "AI Dialogues" }), _jsx(Sparkles, { className: "w-4 h-4 text-[#c48b5b]" })] }), _jsx("p", { className: "font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]", children: totalTurns }), _jsx("p", { className: "text-[11px] text-[#7d756c]", children: "Gemini interactions" })] }), _jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[#7d756c] text-xs", children: [_jsx("span", { className: "font-medium", children: "Key Realizations" }), _jsx(Lightbulb, { className: "w-4 h-4 text-[#8a5d32]" })] }), _jsx("p", { className: "font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]", children: allInsights.length }), _jsx("p", { className: "text-[11px] text-[#7d756c]", children: "Synthesized insights" })] })] }), _jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-4", children: [_jsxs("h3", { className: "font-serif font-bold text-[#2d2926] text-base flex items-center gap-2", children: [_jsx(Smile, { className: "w-4 h-4 text-[#5b6851]" }), _jsx("span", { children: "Dominant Emotional Landscape" })] }), moodDistribution.length === 0 ? (_jsx("p", { className: "text-xs text-[#7d756c] py-4 text-center", children: "Synthesize your reflections with Gemini to map your dominant emotional patterns." })) : (_jsx("div", { className: "space-y-2.5", children: moodDistribution.map(([mood, count]) => {
                            const pct = Math.round((count / totalEntries) * 100);
                            return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "font-medium text-[#2d2926]", children: mood }), _jsxs("span", { className: "text-[#7d756c]", children: [count, " ", count === 1 ? "entry" : "entries", " (", pct, "%)"] })] }), _jsx("div", { className: "w-full h-2 bg-[#f3eee4] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-[#342f2b] rounded-full transition-all duration-500", style: { width: `${pct}%` } }) })] }, mood));
                        }) }))] }), _jsxs("div", { className: "bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "font-serif font-bold text-[#2d2926] text-base flex items-center gap-2", children: [_jsx(Lightbulb, { className: "w-4 h-4 text-[#8a5d32]" }), _jsx("span", { children: "Master Archive of Realizations" })] }), _jsxs("span", { className: "text-xs text-[#7d756c]", children: [allInsights.length, " items"] })] }), allInsights.length === 0 ? (_jsx("p", { className: "text-xs text-[#7d756c] py-4 text-center", children: "Click \"Synthesize Reflection\" in the editor on any reflection to extract executive insights." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: allInsights.slice(0, 10).map((item, idx) => (_jsxs("div", { onClick: () => onSelectEntry(item.entry), className: "bg-[#faf7f0] hover:bg-[#fbf4ea] border border-[#e5dfd2] hover:border-[#ebd2bf] p-3.5 rounded-xl text-xs transition-all cursor-pointer space-y-2 group", children: [_jsxs("p", { className: "text-[#3b352f] font-medium leading-relaxed group-hover:text-[#1e1b18]", children: ["\"", item.text, "\""] }), _jsxs("div", { className: "flex items-center justify-between text-[10px] text-[#7d756c] pt-1 border-t border-[#ede6d8]", children: [_jsx("span", { className: "truncate max-w-[200px]", children: item.entryTitle }), _jsx("span", { children: new Date(item.date).toLocaleDateString() })] })] }, idx))) }))] })] }));
};
