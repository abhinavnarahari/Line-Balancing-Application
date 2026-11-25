import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../features/auth/AuthContext";
import { defaultRouteFor } from "../../features/auth/types";
import { getErrorMessage } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { BrandLogo } from "../../components/common/BrandLogo";

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  // Already signed in (e.g. session restored) — go straight to the app.
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(from || defaultRouteFor(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your work email and password.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const me = await login({ email, password });
      navigate(from || defaultRouteFor(me.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Sign-in failed. Please try again."));
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-[#EEF4FA] relative overflow-hidden font-sans selection:bg-[#0B3A82]/20 selection:text-[#0B3A82]">
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1FD1AC]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#0B3A82]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md lg:max-w-5xl bg-white rounded-3xl shadow-[0_24px_70px_-20px_rgba(11,58,130,0.25)] border border-[#DCE4EF] relative z-10 overflow-hidden lg:grid lg:grid-cols-[1.05fr_1fr]"
      >
        {/* Illustration panel (desktop) */}
        <div className="relative hidden lg:block min-h-[600px] bg-[#E6F0FA]">
          <img
            src="/login-illustration.webp"
            alt="Sewing operators at work on a balanced production line"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        <div className="p-7 sm:p-10 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="mb-8">
          <BrandLogo width={380} className="max-w-full h-auto" />
          <h1 className="mt-7 text-lg font-bold text-[#0F1B2D] tracking-tight">Sign in to your workspace</h1>
          <p className="text-xs text-[#64748B] font-medium mt-0.5">Use the work email your administrator set up for you.</p>
        </div>

        {error && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block text-left">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F5F8FC] border border-[#DCE4EF] rounded-2xl text-xs font-semibold text-[#0F1B2D] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#0B3A82] focus:ring-4 focus:ring-[#0B3A82]/10 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotHelp((v) => !v)}
                className="text-[11px] font-semibold text-[#0B3A82] hover:text-[#1FD1AC] transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-[#F5F8FC] border border-[#DCE4EF] rounded-2xl text-xs font-semibold text-[#0F1B2D] placeholder-[#94A3B8] focus:outline-hidden focus:bg-white focus:border-[#0B3A82] focus:ring-4 focus:ring-[#0B3A82]/10 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F1B2D] transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showForgotHelp && (
            <div className="p-3 bg-[#F5F8FC] border border-[#DCE4EF] rounded-2xl flex items-start gap-2 text-[11px] text-[#334155]">
              <Info className="w-3.5 h-3.5 text-[#0B3A82] shrink-0 mt-0.5" />
              <span>
                Passwords are managed by your System Administrator. Ask them to reset it from
                <strong> Settings → Users</strong>; you can then change it from your profile menu.
              </span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0B3A82] hover:bg-[#072A5E] text-white font-bold rounded-2xl shadow-md shadow-[#0B3A82]/20 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer mt-2"
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
        </div>
      </motion.div>

      <div className="mt-5 flex items-center gap-2 text-[11px] text-[#64748B] font-medium z-10">
        <ShieldCheck className="w-3.5 h-3.5 text-[#0B3A82]" />
        <span>Role-based access · Accounts managed by your administrator</span>
      </div>
    </div>
  );
};
