import React, { useState, useEffect } from "react";
import { subscribeToAuth, subscribeToUserEntries, logOut } from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { JournalEditor } from "./components/JournalEditor";
import { EntryHistory } from "./components/EntryHistory";
import { StatsInsights } from "./components/StatsInsights";
import { Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("editor");
  const [entries, setEntries] = useState([]);
  const [activeEntry, setActiveEntry] = useState(null);
  const [dbError, setDbError] = useState(null);

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
    const freshEntry = {
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

  const handleSelectEntry = (entry) => {
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
      <div className="min-h-screen bg-amber-50/50 flex flex-col items-center justify-center p-4 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-300 border-2 border-slate-900 text-slate-900 flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] animate-bounce">
          <Sparkles className="w-5 h-5 text-slate-900 animate-spin" />
        </div>
        <p className="text-xs font-mono font-extrabold text-slate-900 tracking-tight">
          Initializing cognitive vault...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/40 text-slate-800 font-sans flex flex-col selection:bg-amber-200">
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewEntry={handleNewEntry}
        onSignOut={handleSignOut}
        entriesCount={entries.length}
      />

      <main className="flex-1 pb-16 sm:pb-8">
        {!user ? (
          <AuthModal onSuccess={() => setActiveTab("editor")} />
        ) : (
          <>
            {dbError && (
              <div className="max-w-4xl mx-auto px-2 sm:px-6 pt-2 sm:pt-4">
                <div className="bg-rose-100 border-2 border-slate-900 text-rose-950 text-xs p-2.5 sm:p-3 rounded-xl font-medium flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Firestore Notice: {dbError}</span>
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