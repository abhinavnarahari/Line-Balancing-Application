import React from "react";
import { Zap, Target, Users, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import type { ChatContext } from "./types";

interface SuggestedQuestionsProps {
  context?: ChatContext;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  title: string;
  icon: React.ReactNode;
  prompts: string[];
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ context, onSelectPrompt }) => {
  const page = context?.page || "";

  // Dynamic context-aware categories prioritized by active screen
  const isLineOrBalancing = page.toLowerCase().includes("line") || page.toLowerCase().includes("balance");
  const isBulletinOrStyle = page.toLowerCase().includes("bulletin") || page.toLowerCase().includes("style") || page.toLowerCase().includes("operation");
  const isOperatorOrSkill = page.toLowerCase().includes("operator") || page.toLowerCase().includes("skill") || page.toLowerCase().includes("attendance");

  const categories: PromptCategory[] = [
    {
      title: isLineOrBalancing ? "★ Active Line & Bottlenecks" : "Line Balancing & Bottlenecks",
      icon: <Target className="h-3.5 w-3.5 text-[#9C5B3C]" />,
      prompts: [
        "Which operation is the bottleneck on Line 01?",
        "What is the Line Balancing Efficiency of Line 01?",
      ],
    },
    {
      title: isBulletinOrStyle ? "★ Active Style & SMVs" : "SMV & Work Content",
      icon: <Zap className="h-3.5 w-3.5 text-amber-600" />,
      prompts: [
        "What is the SMV of Bottom Hem?",
        "What is the SMV of Shoulder Join?",
      ],
    },
    {
      title: isOperatorOrSkill ? "★ Operators & Skill Matrix" : "Manpower & Skill Matrix",
      icon: <Users className="h-3.5 w-3.5 text-blue-600" />,
      prompts: [
        "How many operators are assigned to Line 01?",
        "Who is qualified for Shoulder Join?",
      ],
    },
    {
      title: "Live Production & Floor Status",
      icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
      prompts: [
        "What is today's production for Line 01?",
        "Why is Line 01 below target?",
      ],
    },
  ];

  return (
    <div className="w-full space-y-3 my-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C7E6E] uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-[#9C5B3C]" />
          <span>Quick Industrial Inquiries</span>
        </div>
        <span className="text-[10px] text-[#A6998A] font-medium">Click to ask instantly</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {categories.map((cat, idx) => (
          <div
            key={idx}
            className="p-3 bg-white/90 hover:bg-white rounded-xl border border-[#E8E2D9] hover:border-[#9C5B3C]/40 shadow-xs hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#F0EAE1]">
              {cat.icon}
              <span className="text-[11px] font-bold text-[#221912]">{cat.title}</span>
            </div>

            <div className="space-y-1.5">
              {cat.prompts.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onSelectPrompt(p)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#9C5B3C]/10 text-[11px] text-[#4A3B32] hover:text-[#9C5B3C] font-medium transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-1">{p}</span>
                  <ChevronRight className="h-3 w-3 text-[#8C7E6E] group-hover:text-[#9C5B3C] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
