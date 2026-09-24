import React from "react";
import { Target, Users, Sparkles, ChevronRight, Database, Layers } from "lucide-react";
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
      title: "🏛️ Master Data & Factory Inventory",
      icon: <Database className="h-3.5 w-3.5 text-[#9C5B3C]" />,
      prompts: [
        "Show Master Data Overview",
        "List all 8 garment styles and buyers",
        "Show machine inventory & maintenance status",
        "What are the working shifts & break hours?",
      ],
    },
    {
      title: isOperatorOrSkill ? "★ Operators & Skill Matrix" : "👥 Workforce & Skill Matrix",
      icon: <Users className="h-3.5 w-3.5 text-blue-600" />,
      prompts: [
        "Who are the floater operators?",
        "Who is the highest rated operator for OP-001?",
        "Show certified operators for Bottom Hem",
        "Show profile and skill matrix for EMP-001",
      ],
    },
    {
      title: isBulletinOrStyle ? "★ Bulletins & SMVs" : "📋 Operation Bulletins & SMVs",
      icon: <Layers className="h-3.5 w-3.5 text-indigo-600" />,
      prompts: [
        "Show details of OB-POLO-800",
        "List all 5 Operation Bulletins and SMVs",
        "What are the WIP buffer thresholds for Polo?",
        "List all 18 sewing operations",
      ],
    },
    {
      title: isLineOrBalancing ? "★ Line Balancing & Bottlenecks" : "⚡ IE Balancing & Takt Times",
      icon: <Target className="h-3.5 w-3.5 text-emerald-600" />,
      prompts: [
        "Calculate line balancing for 10 operators",
        "Which operations exceed pitch time?",
        "What is the takt time for 120 pcs/hr?",
        "Show hourly production output & variance",
      ],
    },
  ];

  return (
    <div className="w-full space-y-3 my-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C7E6E] uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-[#9C5B3C]" />
          <span>Quick Manufacturing Inquiries</span>
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
