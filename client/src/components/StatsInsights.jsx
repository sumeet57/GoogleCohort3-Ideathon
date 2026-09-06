import React, { useMemo } from "react";
import { Sparkles, BookOpen, Smile, Lightbulb, TrendingUp } from "lucide-react";

export const StatsInsights = ({ entries, onSelectEntry }) => {
  const totalEntries = entries.length;
  const totalWords = useMemo(
    () => entries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0),
    [entries]
  );
  const totalTurns = useMemo(
    () => entries.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0),
    [entries]
  );

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

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-6 py-3 sm:py-8 space-y-3 sm:space-y-6 text-slate-800 selection:bg-amber-200">
      <div className="px-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Cognitive Analytics & Insights
        </h1>
        <p className="text-xs text-slate-600 mt-0.5 font-medium">
          Patterns, breakthroughs, and emotional distribution across your reflection history
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
        <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 sm:p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-0.5">
          <div className="flex items-center justify-between text-slate-600 text-[11px] sm:text-xs font-bold">
            <span>Reflections</span>
            <BookOpen className="w-3.5 h-3.5 text-slate-900" />
          </div>
          <p className="text-xl sm:text-3xl font-extrabold text-slate-900">{totalEntries}</p>
          <p className="text-[10px] text-slate-500 font-mono">Firestore synced</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 sm:p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-0.5">
          <div className="flex items-center justify-between text-slate-600 text-[11px] sm:text-xs font-bold">
            <span>Words Written</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-3xl font-extrabold text-slate-900">
            {totalWords.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Articulated</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 sm:p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-0.5">
          <div className="flex items-center justify-between text-slate-600 text-[11px] sm:text-xs font-bold">
            <span>AI Dialogues</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl sm:text-3xl font-extrabold text-slate-900">{totalTurns}</p>
          <p className="text-[10px] text-slate-500 font-mono">Gemini turns</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-slate-900 p-3 sm:p-4 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] space-y-0.5">
          <div className="flex items-center justify-between text-slate-600 text-[11px] sm:text-xs font-bold">
            <span>Realizations</span>
            <Lightbulb className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-xl sm:text-3xl font-extrabold text-slate-900">
            {allInsights.length}
          </p>
          <p className="text-[10px] text-slate-500 font-mono">Synthesized</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3">
        <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider font-mono flex items-center gap-2">
          <Smile className="w-4 h-4 text-amber-500" />
          <span>Dominant Emotional Landscape</span>
        </h3>

        {moodDistribution.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center font-medium">
            Synthesize your reflections with Gemini to map your emotional patterns.
          </p>
        ) : (
          <div className="space-y-2">
            {moodDistribution.map(([mood, count]) => {
              const pct = Math.round((count / totalEntries) * 100);
              return (
                <div key={mood} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900">{mood}</span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {count} {count === 1 ? "entry" : "entries"} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 border-2 border-slate-900 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-amber-300 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border-2 border-slate-900 p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] sm:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-3">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
          <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider font-mono flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-indigo-500" />
            <span>Master Archive of Realizations</span>
          </h3>
          <span className="text-xs font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{allInsights.length}</span>
        </div>

        {allInsights.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center font-medium">
            Click "Synthesize" in any reflection editor to extract insights.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allInsights.slice(0, 10).map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectEntry(item.entry)}
                className="bg-slate-50 hover:bg-amber-50/50 border-2 border-slate-200 hover:border-slate-900 p-3 rounded-xl text-xs transition-all cursor-pointer space-y-2 group shadow-none hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                <p className="text-slate-900 font-bold leading-relaxed">
                  "{item.text}"
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-slate-200">
                  <span className="truncate max-w-[180px] font-semibold">{item.entryTitle}</span>
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