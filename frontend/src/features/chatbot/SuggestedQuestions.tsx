import React, { useEffect, useState } from "react";
import { Compass, Users, Layers, Database, ChevronRight, Factory } from "lucide-react";
import type { ChatContext, PromptCategory } from "./types";
import { getChatSuggestions } from "./api";

interface SuggestedQuestionsProps {
  context?: ChatContext;
  onSelectPrompt: (prompt: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  howto: <Compass className="h-3.5 w-3.5" />,
  workforce: <Users className="h-3.5 w-3.5" />,
  engineering: <Layers className="h-3.5 w-3.5" />,
  production: <Factory className="h-3.5 w-3.5" />,
  masters: <Database className="h-3.5 w-3.5" />,
};

/** Used only if the backend list cannot be loaded; generic questions that never name specific records. */
const FALLBACK: PromptCategory[] = [
  {
    id: "howto",
    label: "How-to",
    prompts: ["How do I balance a line?", "How do I add an operator?", "How do I record production?"],
  },
  {
    id: "masters",
    label: "Overview",
    prompts: ["Give me a data overview", "How many operators are there?", "List orders in production"],
  },
];

/**
 * Starter questions for an empty chat. The list comes from the backend, which builds it from the factory's
 * real records (orders, bulletins, operations), so every suggestion is answerable.
 */
export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelectPrompt }) => {
  const [categories, setCategories] = useState<PromptCategory[]>(FALLBACK);
  const [activeCategory, setActiveCategory] = useState<string>(FALLBACK[0].id);

  useEffect(() => {
    let cancelled = false;
    getChatSuggestions()
      .then((loaded) => {
        if (!cancelled && loaded.length > 0) {
          setCategories(loaded);
          setActiveCategory(loaded[0].id);
        }
      })
      .catch(() => {
        // keep the generic fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Question categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
              activeCategory === cat.id
                ? "bg-[#9C5B3C] text-white border-[#9C5B3C]"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {ICONS[cat.id]}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden" role="tabpanel">
        {currentCategory.prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelectPrompt(prompt)}
            className="w-full px-3.5 py-2.5 text-left group cursor-pointer flex items-center justify-between gap-2 hover:bg-[#FAF7F2] transition-colors"
          >
            <span className="text-[13px] text-slate-800 group-hover:text-[#9C5B3C]">{prompt}</span>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#9C5B3C] shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
