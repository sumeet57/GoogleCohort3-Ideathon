import React from "react";
import { Sparkles, BookOpen, History, BarChart3, PlusCircle, LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import type { UserProfile } from "../types";

interface NavbarProps {
  user: UserProfile | null;
  activeTab: "editor" | "history" | "insights";
  onTabChange: (tab: "editor" | "history" | "insights") => void;
  onNewEntry: () => void;
  onSignOut: () => void;
  entriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  onTabChange,
  onNewEntry,
  onSignOut,
  entriesCount,
}) => {
  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-[#fdfbf7]/90 backdrop-blur-md border-b border-[#e7e2d6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#342f2b] text-[#fdfbf7] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#e0b07a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold tracking-tight text-[#2d2926]">
                  AI Journal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-[#f5efe4] text-[#825c34] border border-[#e8dbcc] px-2 py-0.5 rounded-full">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-[#7d756c] hidden md:block">
                Reflective thinking & structured cognition
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {user && (
            <nav className="flex items-center gap-1 bg-[#f3eee4] p-1 rounded-xl border border-[#e5dfd2]">
              <button
                id="nav-tab-editor"
                type="button"
                onClick={() => onTabChange("editor")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "editor"
                    ? "bg-[#ffffff] text-[#2d2926] shadow-xs"
                    : "text-[#696157] hover:text-[#2d2926] hover:bg-[#e9e3d7]/60"
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#5c544b]" />
                <span>Reflect</span>
              </button>

              <button
                id="nav-tab-history"
                type="button"
                onClick={() => onTabChange("history")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "history"
                    ? "bg-[#ffffff] text-[#2d2926] shadow-xs"
                    : "text-[#696157] hover:text-[#2d2926] hover:bg-[#e9e3d7]/60"
                }`}
              >
                <History className="w-4 h-4 text-[#5c544b]" />
                <span>History</span>
                {entriesCount > 0 && (
                  <span className="text-xs bg-[#e5ded1] text-[#423c34] font-semibold px-1.5 py-0.2 rounded-full">
                    {entriesCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-insights"
                type="button"
                onClick={() => onTabChange("insights")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "insights"
                    ? "bg-[#ffffff] text-[#2d2926] shadow-xs"
                    : "text-[#696157] hover:text-[#2d2926] hover:bg-[#e9e3d7]/60"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#5c544b]" />
                <span className="hidden sm:inline">Insights</span>
              </button>
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <button
                  id="btn-new-entry-header"
                  type="button"
                  onClick={onNewEntry}
                  className="hidden sm:flex items-center gap-2 bg-[#342f2b] text-[#fdfbf7] hover:bg-[#25211e] px-3.5 py-2 rounded-xl text-sm font-medium shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-[#e0b07a]" />
                  <span>New Reflection</span>
                </button>

                <div className="flex items-center gap-2 pl-2 border-l border-[#e7e2d6]">
                  <div className="flex items-center gap-2 bg-[#f5f1e8] border border-[#e5dfd2] px-2.5 py-1.5 rounded-xl text-xs text-[#524b42]">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-5 h-5 rounded-full object-cover border border-[#d6cebf]"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-[#dfd7c8] text-[#524b42] flex items-center justify-center">
                        <UserIcon className="w-3 h-3" />
                      </div>
                    )}
                    <span className="font-medium max-w-[110px] truncate hidden md:inline">
                      {user.displayName || user.email || "Explorer"}
                    </span>
                    {user.isAnonymous && (
                      <span className="text-[10px] bg-[#eedfcb] text-[#7a4e1d] font-semibold px-1 rounded">
                        Guest
                      </span>
                    )}
                  </div>

                  <button
                    id="btn-signout"
                    type="button"
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-2 text-[#7d756c] hover:text-[#9e3a2f] hover:bg-[#faeae7] rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#5f6954] font-medium bg-[#eef3eb] border border-[#d3ddce] px-2.5 py-1 rounded-full">
                <ShieldCheck className="w-4 h-4 text-[#4f5c44]" />
                <span>Isolated Firestore Auth</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
