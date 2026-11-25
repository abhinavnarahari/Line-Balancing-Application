import React, { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
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
    <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="max-w-xl mx-auto pt-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-900">How can I help?</h3>
            <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
              Ask about operators, bulletins, line balancing, orders or how to use the app. Answers come from the data in
              SewNexa, with the source shown under each answer.
            </p>
          </div>
          <SuggestedQuestions context={context} onSelectPrompt={onSelectPrompt} />
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((msg) => (
            <ChatMessageItem key={msg.id} message={msg} onSelectPrompt={onSelectPrompt} />
          ))}

          {isLoading && (
            <div className="flex gap-2.5 my-4 items-center" role="status">
              <div className="h-7 w-7 rounded-lg bg-[#9C5B3C] text-white flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[13px] text-slate-500">Looking up your data…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
