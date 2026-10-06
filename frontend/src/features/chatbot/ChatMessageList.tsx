import React, { useEffect, useRef } from "react";
import { Sparkles, ShieldCheck, Database, Cpu, Compass } from "lucide-react";
import type { ChatMessage, ChatContext } from "./types";
import { ChatMessageItem } from "./ChatMessageItem";
import { SuggestedQuestions } from "./SuggestedQuestions";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  context?: ChatContext;
  onSelectPrompt: (prompt: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  context,
  onSelectPrompt,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="py-2 flex flex-col items-center">
          {/* SewNexa AI Hero Badge */}
          <div className="w-full bg-linear-to-b from-white to-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-xs text-center mb-3.5">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-linear-to-br from-amber-600 to-amber-800 text-white shadow-md mb-2.5 ring-4 ring-amber-500/10">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">SewNexa Industrial AI</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Online • DB Grounded
              </span>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Industrial Engineering copilot connected to your factory database — styles, sequential routing bulletins, line balancing pitch times, operator skill matrices, and live floor WIP.
            </p>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-[10.5px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-600" /> Live PostgreSQL Truth
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-blue-600" /> Deterministic IE Engine
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> Zero Hallucinations
              </span>
            </div>
          </div>

          {/* Quick Prompt Cards */}
          <SuggestedQuestions context={context} onSelectPrompt={onSelectPrompt} />
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} onSelectPrompt={onSelectPrompt} />
          ))}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 my-3.5 items-center">
              <div className="h-8 w-8 rounded-xl bg-linear-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 bg-white border border-slate-200 rounded-tl-xs shadow-xs flex items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-slate-500 font-medium ml-1">Analyzing factory database & IE rules...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
