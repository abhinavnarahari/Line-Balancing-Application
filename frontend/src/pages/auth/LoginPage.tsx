import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  X, 
  AlertCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../features/auth/AuthContext";
import { DEMO_PROFILES } from "../../features/auth/types";
import type { DemoProfile } from "../../features/auth/types";
import { Button } from "../../components/ui/Button";

export const LoginPage: React.FC = () => {
  const { login, loginWithProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("ie@sewnexa.com");
  const [password, setPassword] = useState("EnterprisePass2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedDemoId, setSelectedDemoId] = useState<string>("ie");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Target destination
  const from = (location.state as any)?.from?.pathname;

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from || "/line-balance", { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSelectDemoProfile = (profile: DemoProfile) => {
    setSelectedDemoId(profile.id);
    setEmail(profile.email);
    setPassword("EnterprisePass2026!");
    setError(null);
  };

  const handleInstantLogin = async (profile: DemoProfile) => {
    setSelectedDemoId(profile.id);
    setEmail(profile.email);
    setError(null);
    setIsLoading(true);
    try {
      await loginWithProfile(profile);
      navigate(from || profile.defaultRoute || "/line-balance", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your work email address.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const emailLower = email.trim().toLowerCase();
      const profile = DEMO_PROFILES.find(
        (p) =>
          p.email.toLowerCase() === emailLower ||
          (p.id === "ie" && emailLower.includes("ie")) ||
          (p.id === "line-supervisor" && emailLower.includes("supervisor")) ||
          (p.id === "production-manager" && (emailLower.includes("manager") || emailLower.includes("prod")))
      );

      if (profile) {
        await loginWithProfile(profile);
        navigate(from || profile.defaultRoute, { replace: true });
      } else {
        await login({ email: email.trim(), password, rememberMe });
        navigate(from || "/line-balance", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async (_provider: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const defaultProfile = DEMO_PROFILES[0];
    await loginWithProfile(defaultProfile);
    navigate(from || defaultProfile.defaultRoute, { replace: true });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F6F1E8] relative overflow-hidden font-sans selection:bg-[#9C5B3C]/20 selection:text-[#9C5B3C]">
      
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#9C5B3C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#0A2947]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#8C7E6E_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.12] pointer-events-none" />

      {/* Main Centered Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-3xl p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(34,25,18,0.08)] border border-[#E8E2D9] relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9C5B3C] to-[#7D462E] text-white shadow-lg shadow-[#9C5B3C]/25 border border-[#B06C49]/40 mb-1">
            <span className="text-2xl font-black tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#221912] tracking-tight">
              SewNexa Enterprise
            </h1>
            <p className="text-xs text-[#8C7E6E] font-medium mt-0.5">
              Line Balancing &amp; Apparel Manufacturing Suite
            </p>
          </div>
        </div>

        {/* ── 3 Selectable Role Cards (IE, Line Supervisor, Production Manager) ── */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
              Select Persona to Sign In
            </span>
            <span className="text-[10px] text-[#9C5B3C] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> 3 Enterprise Roles
            </span>
          </div>

          <div className="space-y-2">
            {DEMO_PROFILES.map((p) => {
              const isSelected = selectedDemoId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectDemoProfile(p)}
                  className={`group relative flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FAF7F2] border-[#9C5B3C] shadow-xs ring-1 ring-[#9C5B3C]/30"
                      : "bg-white border-[#E8E2D9] hover:border-[#D1C7BA] hover:bg-[#FAF7F2]/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-xs ${p.badgeColor}`}
                    >
                      {p.initials}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#221912] leading-tight truncate">
                          {p.roleTitle}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-[#9C5B3C] text-white text-[9px] font-bold">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8C7E6E] font-medium truncate mt-0.5">
                        {p.name} • <span className="font-mono text-[10.5px] text-[#5C4D3E]">{p.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInstantLogin(p);
                    }}
                    title={`Instant login as ${p.roleTitle}`}
                    className={`shrink-0 ml-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#9C5B3C] text-white hover:bg-[#854B31] shadow-xs"
                        : "bg-[#FAF7F2] text-[#5C4D3E] hover:bg-[#9C5B3C] hover:text-white border border-[#E8E2D9]"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Enter</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* ── Login Form ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Work Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E] block text-left">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C7E6E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemoId("");
                }}
                required
                placeholder="name@sewnexa.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs font-semibold text-[#221912] placeholder-[#A6998A] focus:outline-hidden focus:bg-white focus:border-[#9C5B3C] focus:ring-4 focus:ring-[#9C5B3C]/10 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#8C7E6E]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setIsForgotModalOpen(true);
                  setForgotSubmitted(false);
                }}
                className="text-[11px] font-semibold text-[#9C5B3C] hover:text-[#B06C49] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C7E6E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs font-semibold text-[#221912] placeholder-[#A6998A] focus:outline-hidden focus:bg-white focus:border-[#9C5B3C] focus:ring-4 focus:ring-[#9C5B3C]/10 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C7E6E] hover:text-[#221912] transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-md border-[#D1C7BA] text-[#9C5B3C] focus:ring-[#9C5B3C] accent-[#9C5B3C] cursor-pointer"
              />
              <span className="text-xs text-[#5C4D3E] font-medium">Remember this workstation</span>
            </label>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#9C5B3C] hover:bg-[#854B31] text-white font-bold rounded-2xl shadow-md shadow-[#9C5B3C]/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* ── Enterprise SSO Divider ─────────────────────────────────── */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E8E2D9]" />
          </div>
          <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-wider text-[#A6998A]">
            Or continue with
          </span>
        </div>

        {/* SSO Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleSSOLogin("Google Workspace")}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF7F2] hover:bg-[#F3ECE0] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#221912] transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleSSOLogin("Microsoft Azure AD")}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF7F2] hover:bg-[#F3ECE0] border border-[#E8E2D9] rounded-2xl text-xs font-bold text-[#221912] transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>Microsoft</span>
          </button>
        </div>
      </motion.div>

      {/* Security & Version Footer */}
      <div className="mt-5 flex items-center gap-2 text-[11px] text-[#8C7E6E] font-medium z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-[#9C5B3C]" />
        <span>Enterprise 256-bit TLS Encrypted</span>
        <span>•</span>
        <span>v2.6 Live</span>
      </div>

      {/* ── Forgot Password Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E8E2D9] space-y-4 text-left"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#221912]">Reset Password</h3>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="p-1 rounded-lg text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotSubmitted ? (
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] text-center space-y-2">
                  <div className="text-xs font-bold text-[#221912]">Password Reset Dispatched</div>
                  <p className="text-[11px] text-[#8C7E6E]">
                    If an enterprise account exists for <strong className="text-[#221912]">{forgotEmail}</strong>, instructions have been sent.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSubmitted(false);
                    }}
                    size="sm"
                    className="mt-2 bg-[#9C5B3C] text-white font-bold w-full rounded-xl cursor-pointer"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <p className="text-xs text-[#8C7E6E]">
                    Enter your work email address to receive secure reset instructions.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#8C7E6E]">Work Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="ie@sewnexa.com"
                      className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-xl text-xs font-semibold text-[#221912] focus:outline-hidden focus:border-[#9C5B3C]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsForgotModalOpen(false)}
                      size="sm"
                      className="rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-[#9C5B3C] hover:bg-[#854B31] text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Send Instructions
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

