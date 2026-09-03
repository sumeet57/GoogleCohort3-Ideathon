import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from "react";
import { subscribeToAuth, subscribeToUserEntries, logOut } from "./lib/firebase";
import { Navbar } from "./components/Navbar";
import { AuthModal } from "./components/AuthModal";
import { JournalEditor } from "./components/JournalEditor";
import { EntryHistory } from "./components/EntryHistory";
import { StatsInsights } from "./components/StatsInsights";
import { Sparkles } from "lucide-react";
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
        const unsubscribe = subscribeToUserEntries(user.uid, (userEntries) => {
            setEntries(userEntries);
            setDbError(null);
        }, (err) => {
            console.error("[Firestore Sync Error]", err);
            setDbError(err.message || "Failed to load entries from Firestore.");
        });
        return () => unsubscribe();
    }, [user?.uid]);
    // Handle New Entry creation
    const handleNewEntry = () => {
        if (!user)
            return;
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
        }
        catch (err) {
            console.error("Logout error:", err);
        }
    };
    if (authLoading) {
        return (_jsxs("div", { className: "min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center space-y-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-[#342f2b] text-[#fdfbf7] flex items-center justify-center shadow-xs animate-pulse", children: _jsx(Sparkles, { className: "w-5 h-5 text-[#e5b382] animate-spin" }) }), _jsx("p", { className: "text-xs font-serif font-medium text-[#7d756c]", children: "Initializing secure cognitive vault..." })] }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#fdfbf7] text-[#2d2926] font-sans flex flex-col selection:bg-[#e8dac5] selection:text-[#342f2b]", children: [_jsx(Navbar, { user: user, activeTab: activeTab, onTabChange: setActiveTab, onNewEntry: handleNewEntry, onSignOut: handleSignOut, entriesCount: entries.length }), _jsx("main", { className: "flex-1", children: !user ? (_jsx(AuthModal, { onSuccess: () => setActiveTab("editor") })) : (_jsxs(_Fragment, { children: [dbError && (_jsx("div", { className: "max-w-4xl mx-auto px-4 pt-4", children: _jsxs("div", { className: "bg-[#fbeae7] border border-[#ecc9c4] text-[#852a20] text-xs p-3 rounded-xl", children: ["Firestore Notice: ", dbError] }) })), activeTab === "editor" && (_jsx(JournalEditor, { userId: user.uid, currentEntry: activeEntry, onEntrySaved: (saved) => {
                                setActiveEntry(saved);
                            }, onNewReflection: handleNewEntry })), activeTab === "history" && (_jsx(EntryHistory, { userId: user.uid, entries: entries, onSelectEntry: handleSelectEntry, onNewEntry: handleNewEntry })), activeTab === "insights" && (_jsx(StatsInsights, { entries: entries, onSelectEntry: handleSelectEntry }))] })) })] }));
}
