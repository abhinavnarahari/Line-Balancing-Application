import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, X, MapPin } from "lucide-react";
import type { ChatContext } from "./types";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  context?: ChatContext;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, context }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const hasContext = context && (context.page || context.lineCode || context.styleCode);

  return (
    <div className="border-t border-[#E8E2D9] bg-white/95 backdrop-blur-xs p-3 shrink-0">
      {/* Integrated Context Pill */}
      {hasContext && (
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-[#8C7E6E]">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3 w-3 text-[#9C5B3C] shrink-0" />
            <span className="font-semibold text-[#5A4B40] truncate">
              {context.page || "Industrial Engineering"}
            </span>
            {context.lineCode && (
              <span className="px-1.5 py-0.2 bg-[#FAF7F2] border border-[#E8E2D9] rounded text-[10px] font-bold text-[#9C5B3C]">
                {context.lineCode}
              </span>
            )}
            {context.styleCode && (
              <span className="px-1.5 py-0.2 bg-[#FAF7F2] border border-[#E8E2D9] rounded text-[10px] font-bold text-[#4A3B32]">
                {context.styleCode}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#A6998A] shrink-0 font-medium">Context Active</span>
        </div>
      )}

      {/* Input Box */}
      <div className="relative flex items-end gap-2 bg-[#FAF7F2] rounded-xl border border-[#E8E2D9] focus-within:border-[#9C5B3C] focus-within:ring-2 focus-within:ring-[#9C5B3C]/15 focus-within:bg-white transition-all p-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask SewNexa about SMVs, Line Capacities, Balancing, Operators..."
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-xs text-[#221912] placeholder-[#A6998A] focus:outline-hidden py-1 px-1 custom-scrollbar max-h-28"
        />

        {input.length > 0 && (
          <button
            onClick={() => setInput("")}
            className="p-1 text-[#8C7E6E] hover:text-[#221912] rounded-full transition-colors cursor-pointer"
            title="Clear text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            input.trim() && !isLoading
              ? "bg-linear-to-br from-[#9C5B3C] to-[#7D462E] text-white shadow-xs hover:shadow-sm"
              : "bg-[#E8E2D9] text-[#A6998A] cursor-not-allowed"
          }`}
          title="Send inquiry (Enter)"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-[#A6998A]">
        <span className="flex items-center gap-1 font-medium">
          Deterministic Factory Intelligence
        </span>
        <span className="font-mono">↵ to send · Shift+↵ for new line</span>
      </div>
    </div>
  );
};
