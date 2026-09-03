import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
            if (onSuccess)
                onSuccess();
        }
        catch (err) {
            console.error("[Auth Error]", err);
            setError(err?.message || "Google Sign-In was cancelled or failed.");
        }
        finally {
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
            }
            else {
                await loginWithEmail(email, password);
            }
            if (onSuccess)
                onSuccess();
        }
        catch (err) {
            console.error("[Email Auth Error]", err);
            if (err.code === "auth/email-already-in-use") {
                setError("This email is already registered. Please sign in instead.");
            }
            else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
                setError("Invalid email or password. Please double check.");
            }
            else if (err.code === "auth/user-not-found") {
                setError("No account found with this email. Please create an account.");
            }
            else {
                setError(err?.message || "Authentication failed. Please try again.");
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleGuestSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            await continueAsGuest();
            if (onSuccess)
                onSuccess();
        }
        catch (err) {
            console.error("[Guest Auth Error]", err);
            setError(err?.message || "Guest sign-in failed.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#fdfbf7]", children: _jsxs("div", { className: "w-full max-w-md bg-[#ffffff] rounded-2xl border border-[#e5dfd2] shadow-sm p-6 sm:p-8", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("div", { className: "inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#342f2b] text-[#fdfbf7] mb-3 shadow-xs", children: _jsx(Sparkles, { className: "w-6 h-6 text-[#e0b07a]" }) }), _jsx("h1", { className: "font-serif text-2xl sm:text-3xl font-bold text-[#2d2926] tracking-tight", children: "AI Journal & Reflections" }), _jsx("p", { className: "text-sm text-[#696157] mt-2 leading-relaxed", children: "A private cognitive space to unpack thoughts, converse with Gemini 3.6 Flash, and synthesize key life insights." })] }), _jsxs("div", { className: "bg-[#f7f4ed] border border-[#e5dfd2] rounded-xl p-3.5 mb-6 text-xs text-[#524b42] flex items-start gap-2.5", children: [_jsx(Shield, { className: "w-4 h-4 text-[#5b6851] shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold text-[#2d2926]", children: "User Data Isolation:" }), " All reflections & chats are strictly partitioned to your private Firestore account path."] })] }), error && (_jsx("div", { id: "auth-error-message", className: "mb-4 p-3 bg-[#fbeae7] border border-[#ecc9c4] rounded-xl text-xs text-[#9e3a2f] leading-relaxed", children: error })), _jsxs("button", { id: "btn-google-signin", type: "button", disabled: loading, onClick: handleGoogleSignIn, className: "w-full flex items-center justify-center gap-3 bg-[#ffffff] hover:bg-[#faf7f0] text-[#342f2b] border border-[#d6cebf] font-medium py-2.5 px-4 rounded-xl shadow-2xs hover:shadow-xs transition-all disabled:opacity-50", children: [_jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" })] }), _jsx("span", { children: "Continue with Google" })] }), _jsxs("div", { className: "relative my-5", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-[#e5dfd2]" }) }), _jsx("div", { className: "relative flex justify-center text-xs text-[#7d756c]", children: _jsx("span", { className: "px-3 bg-white font-medium", children: "Or sign in with email" }) })] }), _jsxs("form", { onSubmit: handleEmailAuth, className: "space-y-3.5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-[#4a443f] mb-1", htmlFor: "auth-email-input", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "auth-email-input", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@domain.com", className: "w-full pl-9 pr-3 py-2 text-sm bg-[#faf7f0] border border-[#d6cebf] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#342f2b] focus:bg-white transition-all text-[#2d2926] placeholder:text-[#a1998e]" }), _jsx(Mail, { className: "w-4 h-4 text-[#8f877d] absolute left-3 top-2.5" })] })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("label", { className: "block text-xs font-medium text-[#4a443f]", htmlFor: "auth-password-input", children: "Password" }), _jsx("span", { className: "text-[11px] text-[#7d756c]", children: "Min 6 characters" })] }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "auth-password-input", type: showPassword ? "text" : "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full pl-9 pr-10 py-2 text-sm bg-[#faf7f0] border border-[#d6cebf] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#342f2b] focus:bg-white transition-all text-[#2d2926] placeholder:text-[#a1998e]" }), _jsx(Lock, { className: "w-4 h-4 text-[#8f877d] absolute left-3 top-2.5" }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-2.5 text-[#8f877d] hover:text-[#4a443f]", children: showPassword ? _jsx(EyeOff, { className: "w-4 h-4" }) : _jsx(Eye, { className: "w-4 h-4" }) })] })] }), _jsxs("button", { id: "btn-email-submit", type: "submit", disabled: loading, className: "w-full flex items-center justify-center gap-2 bg-[#342f2b] hover:bg-[#25211e] text-[#fdfbf7] font-medium py-2.5 px-4 rounded-xl shadow-2xs transition-all disabled:opacity-50 text-sm mt-2", children: [_jsx("span", { children: authMode === "signup" ? "Create Free Account" : "Sign In to Journal" }), _jsx(ArrowRight, { className: "w-4 h-4" })] })] }), _jsx("div", { className: "mt-4 text-center", children: _jsx("button", { id: "btn-toggle-auth-mode", type: "button", onClick: () => {
                            setAuthMode(authMode === "signin" ? "signup" : "signin");
                            setError(null);
                        }, className: "text-xs text-[#5c544b] hover:text-[#2d2926] font-medium underline underline-offset-4", children: authMode === "signin"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in" }) }), _jsx("div", { className: "mt-6 pt-5 border-t border-[#e5dfd2] flex flex-col items-center", children: _jsxs("button", { id: "btn-guest-signin", type: "button", onClick: handleGuestSignIn, disabled: loading, className: "flex items-center gap-2 text-xs text-[#696157] hover:text-[#2d2926] font-medium py-1.5 px-3 rounded-lg hover:bg-[#f3ede1] transition-colors", children: [_jsx(UserCheck, { className: "w-3.5 h-3.5 text-[#5b6851]" }), _jsx("span", { children: "Try without account (Guest Session)" })] }) })] }) }));
};
