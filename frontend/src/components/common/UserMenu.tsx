import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, Check, ShieldCheck, ChevronDown, RefreshCw } from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext";
import { DEMO_PROFILES } from "../../features/auth/types";
import { motion, AnimatePresence } from "framer-motion";

export const UserMenu: React.FC = () => {
  const { user, logout, loginWithProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSwitching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/login");
  };

  const handleRoleSwitch = async (profile: typeof DEMO_PROFILES[0]) => {
    setIsSwitching(true);
    await loginWithProfile(profile);
    setIsSwitching(false);
    setIsOpen(false);
    if (profile.defaultRoute) {
      navigate(profile.defaultRoute);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-[#FAF7F2] border border-transparent hover:border-[#E8E2D9] transition-all cursor-pointer group"
        title="User profile & role switcher"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#9C5B3C] to-[#7D462E] text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {user.initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-[#221912] leading-tight group-hover:text-[#9C5B3C] transition-colors">
            {user.name}
          </span>
          <span className="text-[10px] text-[#8C7E6E] font-medium leading-tight truncate max-w-[120px]">
            {user.roleTitle}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#8C7E6E] transition-transform duration-200 hidden sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E8E2D9] shadow-2xl z-50 overflow-hidden font-sans"
          >
            {/* User Header */}
            <div className="p-4 bg-[#FAF7F2] border-b border-[#E8E2D9]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#9C5B3C] to-[#7D462E] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#221912] truncate">{user.name}</div>
                  <div className="text-[11px] text-[#8C7E6E] truncate">{user.email}</div>
                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{user.roleTitle}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo Role Switcher */}
            <div className="p-3 border-b border-[#E8E2D9] bg-white">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C7E6E] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-[#9C5B3C]" /> Switch Active Role
                </span>
                <span className="text-[9.5px] text-[#A6998A]">Demo Persona</span>
              </div>
              <div className="space-y-1">
                {DEMO_PROFILES.map((p) => {
                  const isCurrent = user.email.toLowerCase() === p.email.toLowerCase();
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleRoleSwitch(p)}
                      disabled={isSwitching}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? "bg-[#FAF7F2] border border-[#E8E2D9] text-[#9C5B3C] font-bold shadow-2xs"
                          : "hover:bg-slate-50 text-[#33251A] hover:text-[#221912]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${p.badgeColor}`}>
                          {p.initials}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold leading-tight truncate">{p.name}</div>
                          <div className="text-[10px] text-[#8C7E6E] leading-tight truncate">{p.roleTitle}</div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#9C5B3C] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation & Actions */}
            <div className="p-2 space-y-1 bg-[#FAF7F2]/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/settings");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#33251A] hover:text-[#221912] hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#8C7E6E]" />
                <span>System Masters & Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Sign Out of SewNexa</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
