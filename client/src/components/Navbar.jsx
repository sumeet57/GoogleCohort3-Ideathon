import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  History,
  BarChart3,
  PlusCircle,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";

export const Navbar = ({
  user,
  activeTab,
  onTabChange,
  onNewEntry,
  onSignOut,
  entriesCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-white border-b border-black text-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Left Side: Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-1.5 text-black hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-300"
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-black text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-black">
                    AI Journal
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono bg-neutral-100 text-black border border-neutral-300 px-1.5 py-0.5 rounded">
                    Gemini 3.6 Flash
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden sm:flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-300">
              <button
                id="nav-tab-editor"
                type="button"
                onClick={() => onTabChange("editor")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "editor"
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:text-black hover:bg-neutral-200"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Reflect</span>
              </button>

              <button
                id="nav-tab-history"
                type="button"
                onClick={() => onTabChange("history")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "history"
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:text-black hover:bg-neutral-200"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {entriesCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === "history" ? "bg-neutral-800 text-white" : "bg-neutral-200 text-black"
                  }`}>
                    {entriesCount}
                  </span>
                )}
              </button>

              <button
                id="nav-tab-insights"
                type="button"
                onClick={() => onTabChange("insights")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "insights"
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:text-black hover:bg-neutral-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Insights</span>
              </button>
            </nav>
          )}

          {/* Right Side: User Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {user ? (
              <>
                <button
                  id="btn-new-entry-header"
                  type="button"
                  onClick={onNewEntry}
                  title="New Reflection"
                  className="flex items-center gap-1.5 bg-black text-white hover:bg-neutral-800 px-2.5 py-1.5 sm:px-3 rounded-lg text-xs font-medium transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-white shrink-0" />
                  <span className="hidden xs:inline">New</span>
                </button>

                <div className="flex items-center gap-1.5 pl-1.5 border-l border-neutral-300">
                  <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-300 p-1 sm:px-2 sm:py-1 rounded-lg text-xs text-black">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Avatar"
                        className="w-5 h-5 rounded-full object-cover border border-neutral-300 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-neutral-200 text-black flex items-center justify-center shrink-0">
                        <UserIcon className="w-3 h-3" />
                      </div>
                    )}
                    <span className="font-medium max-w-[100px] truncate hidden md:inline">
                      {user.displayName || user.email || "Explorer"}
                    </span>
                    {user.isAnonymous && (
                      <span className="text-[10px] bg-neutral-200 text-black font-mono px-1 rounded">
                        Guest
                      </span>
                    )}
                  </div>

                  <button
                    id="btn-signout"
                    type="button"
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-medium text-black bg-neutral-100 border border-neutral-300 px-2 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-black shrink-0" />
                <span className="hidden sm:inline">Isolated Auth</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Drawer & Overlay */}
      {user && (
        <>
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity sm:hidden ${
              isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Side Panel */}
          <aside
            className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 border-r border-black p-4 flex flex-col justify-between transition-transform duration-200 ease-in-out sm:hidden ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-black text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-sm tracking-tight text-black">
                    AI Journal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-neutral-500 hover:text-black rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("editor");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "editor"
                      ? "bg-black text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4" />
                    <span>Reflect</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTabChange("history");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "history"
                      ? "bg-black text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </div>
                  {entriesCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === "history" ? "bg-neutral-800 text-white" : "bg-neutral-200 text-black"
                    }`}>
                      {entriesCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTabChange("insights");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === "insights"
                      ? "bg-black text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4" />
                    <span>Insights</span>
                  </div>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <div className="flex items-center gap-2 px-2 text-xs text-neutral-600">
                <span className="truncate">
                  {user.displayName || user.email || "Explorer"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </header>
  );
};