import React, { useState } from "react";
import { Compass, Target, Users, Star, Layers, Database, Sparkles, ChevronRight, BarChart3, AlertOctagon, HelpCircle } from "lucide-react";
import type { ChatContext } from "./types";

interface SuggestedQuestionsProps {
  context?: ChatContext;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompts: { title: string; subtitle?: string; query: string }[];
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ context, onSelectPrompt }) => {
  const [activeCategory, setActiveCategory] = useState<string>("featured");

  const categories: PromptCategory[] = [
    {
      id: "featured",
      label: "🚀 App How-To Guides",
      icon: <Compass className="h-3.5 w-3.5 text-blue-600" />,
      prompts: [
        {
          title: "How does this application work?",
          subtitle: "Complete 6-phase Garment IE workflow from Master Data to Live Floor Monitoring",
          query: "How does this application work?",
        },
        {
          title: "How do I balance a line in this app?",
          subtitle: "Step-by-step procedure: Fixed Delivery Date vs Fixed Shift Target balancing",
          query: "How do I balance a line in this app?",
        },
        {
          title: "How does the 1–5 Star Skill Matrix work?",
          subtitle: "Proficiency hierarchy, speed/quality scoring against Standard SMVs",
          query: "How does the 1–5 Skill Matrix work?",
        },
        {
          title: "How do I add and manage operators?",
          subtitle: "Workforce directory setup, department assignments, and skill ratings",
          query: "How do I add an operator?",
        },
      ],
    },
    {
      id: "balancing",
      label: "⚡ Line Balancing",
      icon: <Target className="h-3.5 w-3.5 text-amber-600" />,
      prompts: [
        {
          title: "What is line balancing?",
          subtitle: "Core objectives, Pitch Time vs Takt Time formulas, and bottleneck elimination",
          query: "What is line balancing?",
        },
        {
          title: "Calculate line balancing for 10 operators",
          subtitle: "Instant IE simulation for OB-POLO-800 at 85% efficiency",
          query: "Calculate line balancing for 10 operators",
        },
        {
          title: "Which operations exceed pitch time?",
          subtitle: "Identify bottleneck operations that require parallel workstations",
          query: "Which operations exceed pitch time?",
        },
        {
          title: "What is the takt time for 120 pcs/hr?",
          subtitle: "Determine required line pacing for shift target output",
          query: "What is the takt time for 120 pcs/hr?",
        },
      ],
    },
    {
      id: "workforce",
      label: "👥 Operators & Skills",
      icon: <Users className="h-3.5 w-3.5 text-indigo-600" />,
      prompts: [
        {
          title: "Who are the floater operators?",
          subtitle: "List multi-skilled operators available for bottleneck deployment",
          query: "Who are the floater operators?",
        },
        {
          title: "Show profile and skill matrix for EMP-001",
          subtitle: "Detailed 1–5 rating breakdown for Priya Sharma across all operations",
          query: "Show profile and skill matrix for EMP-001",
        },
        {
          title: "Who is the highest rated operator for OP-001?",
          subtitle: "Find top-performing operators certified for Collar Make",
          query: "Who is the highest rated operator for OP-001?",
        },
        {
          title: "How do I deploy floaters to bottlenecks?",
          subtitle: "Step-by-step guide for Immediate Actions floater intervention",
          query: "How do I deploy floaters to bottlenecks?",
        },
      ],
    },
    {
      id: "bulletins",
      label: "📋 Operation Bulletins",
      icon: <Layers className="h-3.5 w-3.5 text-emerald-600" />,
      prompts: [
        {
          title: "Show details of OB-POLO-800",
          subtitle: "Polo T-Shirt routing: 8 operations, SMVs, and WIP buffer thresholds",
          query: "Show details of OB-POLO-800",
        },
        {
          title: "What is the standard SMV for Sleeve Attach?",
          subtitle: "Lookup certified standard SAM values and machine specifications",
          query: "What is the standard SMV for Sleeve Attach?",
        },
        {
          title: "List all 18 sewing operations",
          subtitle: "Full operational catalog with machine types and base SMVs",
          query: "List all 18 sewing operations",
        },
        {
          title: "List all 5 Operation Bulletins and SMVs",
          subtitle: "Catalog of active styles with total assembly standard minutes",
          query: "List all 5 Operation Bulletins and SMVs",
        },
      ],
    },
    {
      id: "masters",
      label: "🏛️ Master Catalog",
      icon: <Database className="h-3.5 w-3.5 text-teal-600" />,
      prompts: [
        {
          title: "Show Master Data Overview",
          subtitle: "Complete factory inventory: Lines, Machines, Shifts, Operators, Styles",
          query: "Show Master Data Overview",
        },
        {
          title: "Show me all lines",
          subtitle: "Configured sewing lines, floor locations, and daily capacities",
          query: "Show me all lines",
        },
        {
          title: "List all garment styles and buyers",
          subtitle: "Nike, Zara, Tommy Hilfiger brand specs and active purchase orders",
          query: "List all 8 garment styles and buyers",
        },
        {
          title: "Tell me about the dashboard",
          subtitle: "Executive Overview vs Line Supervisor vs Plant Management dashboards",
          query: "Tell me about the dashboard",
        },
      ],
    },
  ];

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <div className="w-full space-y-3.5 my-2">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? "bg-[#9C5B3C] text-white shadow-xs"
                : "bg-white hover:bg-[#F6F1E8] text-[#8B4E32] border border-[#E6DDCE]"
            }`}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Prompts Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {currentCategory.prompts.map((p, pIdx) => (
          <button
            key={pIdx}
            type="button"
            onClick={() => onSelectPrompt(p.query)}
            className="p-3 bg-white hover:bg-[#FAF7F2] rounded-2xl border border-[#E6DDCE] hover:border-[#9C5B3C] shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-[#221912] group-hover:text-[#9C5B3C] transition-colors">
                  {p.title}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#9C5B3C] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              {p.subtitle && (
                <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {p.subtitle}
                </p>
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[10px] text-[#9C5B3C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Ask SewNexa AI</span>
              <span>↵</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
