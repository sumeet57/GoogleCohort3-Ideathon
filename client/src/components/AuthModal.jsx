import React, { useState } from "react";
import { Sparkles, Shield, Lock, Mail, ArrowRight, Eye, EyeOff, UserCheck } from "lucide-react";
import { signInWithGoogle, loginWithEmail, registerWithEmail, continueAsGuest } from "../lib/firebase";

export const AuthModal = ({ onSuccess }) => {
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[Auth Error]", err);
      setError(err?.message || "Google Sign-In was cancelled or failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      if (authMode === "signup") {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[Email Auth Error]", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password. Please double check.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please create an account.");
      } else {
        setError(err?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await continueAsGuest();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("[Guest Auth Error]", err);
      setError(err?.message || "Guest sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/50 text-slate-800 flex items-center justify-center p-3 sm:p-6 selection:bg-amber-200">
      <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-7 space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] sm:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
        
        {/* Playful Hero Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-300 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] mb-1">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              AI Journal & Reflections
            </h1>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              Unpack thoughts, converse with Gemini 3.6 Flash, and synthesize life insights.
            </p>
          </div>
        </div>

        {/* User Isolation Badge */}
        <div className="bg-amber-100/80 border-2 border-amber-300 rounded-xl p-2.5 sm:p-3 text-xs text-amber-950 flex items-start gap-2 font-medium">
          <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-tight text-[11px] sm:text-xs">
            <span className="font-extrabold block text-slate-900">Partitioned Firestore Storage</span>
            All chats and entries are strictly isolated to your private account.
          </div>
        </div>

        {error && (
          <div id="auth-error-message" className="p-3 bg-rose-100 border-2 border-slate-900 text-rose-950 rounded-xl text-xs font-semibold leading-relaxed shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            {error}
          </div>
        )}

        {/* Primary Social Sign-In */}
        <button
          id="btn-google-signin"
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className="px-2.5 bg-white text-slate-500 font-bold">Or email auth</span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1" htmlFor="auth-email-input">
              Email Address
            </label>
            <div className="relative">
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold text-slate-900" htmlFor="auth-password-input">
                Password
              </label>
              <span className="text-[10px] font-mono font-medium text-slate-500">Min 6 chars</span>
            </div>
            <div className="relative">
              <input
                id="auth-password-input"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-8 sm:pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border-2 border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
              />
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 sm:right-3 top-2.5 text-slate-400 hover:text-slate-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>

          <button
            id="btn-email-submit"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none disabled:opacity-50 mt-1"
          >
            <span>{authMode === "signup" ? "Create Free Account" : "Sign In to Journal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="text-center pt-1">
          <button
            id="btn-toggle-auth-mode"
            type="button"
            onClick={() => {
              setAuthMode(authMode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 underline underline-offset-4 transition-colors"
          >
            {authMode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>

        {/* Guest Action Panel */}
        <div className="pt-3 border-t-2 border-slate-100">
          <button
            id="btn-guest-signin"
            type="button"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-slate-800 bg-amber-100 hover:bg-amber-200 border-2 border-slate-900 py-2 px-3 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-y-0.5 active:shadow-none"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Try without account (Guest Session)</span>
          </button>
        </div>

      </div>
    </div>
  );
};