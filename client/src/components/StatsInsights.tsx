import React, { useMemo } from "react";
import {
  BarChart3,
  Sparkles,
  BookOpen,
  MessageSquare,
  Smile,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Target,
  Flame
} from "lucide-react";
import type { JournalEntry } from "../types";

interface StatsInsightsProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const StatsInsights: React.FC<StatsInsightsProps> = ({
  entries,
  onSelectEntry,
}) => {
  // Aggregate Metrics
  const totalEntries = entries.length;
  const totalWords = useMemo(
    () => entries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0),
    [entries]
  );
  const totalTurns = useMemo(
    () => entries.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0),
    [entries]
  );

  // Mood Frequency Map
  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
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
    const list: Array<{ text: string; entryTitle: string; entry: JournalEntry; date: number }> = [];
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2d2926]">
          Cognitive Analytics & Insights
        </h1>
        <p className="text-xs text-[#7d756c] mt-1">
          Patterns, breakthroughs, and emotional distribution across your reflection history
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7d756c] text-xs">
            <span className="font-medium">Total Reflections</span>
            <BookOpen className="w-4 h-4 text-[#a1998e]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]">{totalEntries}</p>
          <p className="text-[11px] text-[#7d756c]">Firestore preserved</p>
        </div>

        <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7d756c] text-xs">
            <span className="font-medium">Words Written</span>
            <TrendingUp className="w-4 h-4 text-[#5b6851]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]">
            {totalWords.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#7d756c]">Thoughts articulated</p>
        </div>

        <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7d756c] text-xs">
            <span className="font-medium">AI Dialogues</span>
            <Sparkles className="w-4 h-4 text-[#c48b5b]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]">{totalTurns}</p>
          <p className="text-[11px] text-[#7d756c]">Gemini interactions</p>
        </div>

        <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#7d756c] text-xs">
            <span className="font-medium">Key Realizations</span>
            <Lightbulb className="w-4 h-4 text-[#8a5d32]" />
          </div>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-[#2d2926]">
            {allInsights.length}
          </p>
          <p className="text-[11px] text-[#7d756c]">Synthesized insights</p>
        </div>
      </div>

      {/* Mood Distribution Section */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-[#2d2926] text-base flex items-center gap-2">
          <Smile className="w-4 h-4 text-[#5b6851]" />
          <span>Dominant Emotional Landscape</span>
        </h3>

        {moodDistribution.length === 0 ? (
          <p className="text-xs text-[#7d756c] py-4 text-center">
            Synthesize your reflections with Gemini to map your dominant emotional patterns.
          </p>
        ) : (
          <div className="space-y-2.5">
            {moodDistribution.map(([mood, count]) => {
              const pct = Math.round((count / totalEntries) * 100);
              return (
                <div key={mood} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2d2926]">{mood}</span>
                    <span className="text-[#7d756c]">
                      {count} {count === 1 ? "entry" : "entries"} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#f3eee4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#342f2b] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Synthesized Realizations */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#e5dfd2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-[#2d2926] text-base flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#8a5d32]" />
            <span>Master Archive of Realizations</span>
          </h3>
          <span className="text-xs text-[#7d756c]">{allInsights.length} items</span>
        </div>

        {allInsights.length === 0 ? (
          <p className="text-xs text-[#7d756c] py-4 text-center">
            Click "Synthesize Reflection" in the editor on any reflection to extract executive insights.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allInsights.slice(0, 10).map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectEntry(item.entry)}
                className="bg-[#faf7f0] hover:bg-[#fbf4ea] border border-[#e5dfd2] hover:border-[#ebd2bf] p-3.5 rounded-xl text-xs transition-all cursor-pointer space-y-2 group"
              >
                <p className="text-[#3b352f] font-medium leading-relaxed group-hover:text-[#1e1b18]">
                  "{item.text}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#7d756c] pt-1 border-t border-[#ede6d8]">
                  <span className="truncate max-w-[200px]">{item.entryTitle}</span>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
