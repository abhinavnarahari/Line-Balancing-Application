import React, { useEffect, useRef } from "react";
import { Sparkles, ShieldCheck, Database, Cpu } from "lucide-react";
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
          <div className="w-full bg-linear-to-b from-white to-[#FAF7F2] p-5 rounded-2xl border border-[#E8E2D9] shadow-xs text-center mb-3">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-linear-to-br from-[#9C5B3C] to-[#7D462E] text-white shadow-md mb-2.5">
              <Sparkles className="h-6 w-6" />
            </div>

            <h2 className="text-base font-extrabold text-[#221912] tracking-tight mb-1">SewNexa AI</h2>

            <p className="text-xs text-[#7A6D5F] max-w-sm mx-auto leading-relaxed">
              Real-time engineering intelligence connected directly to your Styles, Bulletins, Workstations, Operators, and Live Piece Production.
            </p>

            <div className="mt-3.5 pt-3 border-t border-[#F0EAE1] flex items-center justify-center gap-4 text-[10px] text-[#8C7E6E] font-medium">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3 text-[#77876F]" /> Live Database Truth
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-[#77876F]" /> Zero Hallucinations
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-[#77876F]" /> Deterministic IE Logic
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
            <div className="flex gap-2.5 my-3 items-center">
              <div className="h-7 w-7 rounded-full bg-linear-to-br from-[#9C5B3C] to-[#7D462E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 bg-white border border-[#E8E2D9] rounded-tl-xs shadow-xs flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9C5B3C] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9C5B3C] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#9C5B3C] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-[#8C7E6E] font-medium ml-1.5">Querying SewNexa data engine...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
