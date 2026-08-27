import React, { useState, useEffect } from "react";
import { subscribeToAuth, subscribeToUserEntries, logOut } from "./lib/firebase";
import type { UserProfile, JournalEntry } from "./types";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { JournalEditor } from "./components/JournalEditor";
import { EntryHistory } from "./components/EntryHistory";
import { StatsInsights } from "./components/StatsInsights";
import { Sparkles } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"editor" | "history" | "insights">("editor");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Subscribe to Firebase Authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to User Firestore Entries on Login
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setActiveEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.uid,
      (userEntries) => {
        setEntries(userEntries);
        setDbError(null);
      },
      (err) => {
        console.error("[Firestore Sync Error]", err);
        setDbError(err.message || "Failed to load entries from Firestore.");
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Handle New Entry creation
  const handleNewEntry = () => {
    if (!user) return;
    const freshEntry: JournalEntry = {
      id: "entry-" + Date.now(),
      userId: user.uid,
      title: "Reflection — " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      initialThought: "",
      messages: [],
      tags: ["daily-reflection"],
      wordCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
    };
    setActiveEntry(freshEntry);
    setActiveTab("editor");
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setActiveTab("editor");
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setActiveEntry(null);
      setEntries([]);
      setActiveTab("editor");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-[#342f2b] text-[#fdfbf7] flex items-center justify-center shadow-xs animate-pulse">
          <Sparkles className="w-5 h-5 text-[#e5b382] animate-spin" />
        </div>
        <p className="text-xs font-serif font-medium text-[#7d756c]">
          Initializing secure cognitive vault...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] text-[#2d2926] font-sans flex flex-col selection:bg-[#e8dac5] selection:text-[#342f2b]">
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        entriesCount={entries.length}
      />

      <main className="flex-1">
        {!user ? (
          <AuthModal onSuccess={() => setActiveTab("editor")} />
        ) : (
          <>
            {dbError && (
              <div className="max-w-4xl mx-auto px-4 pt-4">
                <div className="bg-[#fbeae7] border border-[#ecc9c4] text-[#852a20] text-xs p-3 rounded-xl">
                  Firestore Notice: {dbError}
                </div>
              </div>
            )}

            {activeTab === "editor" && (
              <JournalEditor
                userId={user.uid}
                currentEntry={activeEntry}
                onEntrySaved={(saved) => {
                  setActiveEntry(saved);
                }}
                onNewReflection={handleNewEntry}
              />
            )}

            {activeTab === "history" && (
              <EntryHistory
                userId={user.uid}
                entries={entries}
                onSelectEntry={handleSelectEntry}
                onNewEntry={handleNewEntry}
              />
            )}

            {activeTab === "insights" && (
              <StatsInsights
                entries={entries}
                onSelectEntry={handleSelectEntry}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
