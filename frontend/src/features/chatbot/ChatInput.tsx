import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, MapPin, Compass, Target, Users, Star, Layers, Shirt, Factory, BarChart3, AlertOctagon, HelpCircle } from "lucide-react";
import type { ChatContext } from "./types";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  context?: ChatContext;
}

interface SlashCommand {
  command: string;
  label: string;
  description: string;
  query: string;
  icon: React.ReactNode;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/guide",
    label: "App guide",
    description: "How the application works, step by step",
    query: "How does this application work?",
    icon: <Compass className="h-3.5 w-3.5 text-blue-600" />,
  },
  {
    command: "/balance",
    label: "Line balancing",
    description: "Pitch time, takt time and station balance",
    query: "How do I balance a line in this app?",
    icon: <Target className="h-3.5 w-3.5 text-amber-600" />,
  },
  {
    command: "/operators",
    label: "Operators",
    description: "Add and manage operators",
    query: "How do I add an operator?",
    icon: <Users className="h-3.5 w-3.5 text-indigo-600" />,
  },
  {
    command: "/skill",
    label: "Skill matrix",
    description: "How 1–5 skill ratings work",
    query: "How does the 1–5 Skill Matrix work?",
    icon: <Star className="h-3.5 w-3.5 text-amber-500" />,
  },
  {
    command: "/bulletins",
    label: "Operation bulletins",
    description: "Bulletins with operations and SMVs",
    query: "List operation bulletins",
    icon: <Layers className="h-3.5 w-3.5 text-emerald-600" />,
  },
  {
    command: "/styles",
    label: "Styles & orders",
    description: "Create styles and purchase orders",
    query: "How to create a style and purchase orders?",
    icon: <Shirt className="h-3.5 w-3.5 text-rose-600" />,
  },
  {
    command: "/lines",
    label: "Sewing lines",
    description: "All sewing lines",
    query: "Show me all lines",
    icon: <Factory className="h-3.5 w-3.5 text-purple-600" />,
  },
  {
    command: "/dashboard",
    label: "Dashboards",
    description: "Plant and line dashboards",
    query: "How do I use the dashboards?",
    icon: <BarChart3 className="h-3.5 w-3.5 text-teal-600" />,
  },
  {
    command: "/immediate",
    label: "Floaters",
    description: "Move floaters to bottlenecks",
    query: "How do I deploy floaters to bottlenecks?",
    icon: <AlertOctagon className="h-3.5 w-3.5 text-red-600" />,
  },
  {
    command: "/help",
    label: "What can I ask?",
    description: "What SewNexa AI can answer",
    query: "What are the features of SewNexa?",
    icon: <HelpCircle className="h-3.5 w-3.5 text-slate-600" />,
  },
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, context }) => {
  const [input, setInput] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Handle typing slash command
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashFilter(val.slice(1).toLowerCase());
    } else {
      setShowSlashMenu(false);
      setSlashFilter("");
    }
  };

  const handleSelectCommand = (cmd: SlashCommand) => {
    setShowSlashMenu(false);
    setInput("");
    onSendMessage(cmd.query);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (showSlashMenu) {
        const filtered = SLASH_COMMANDS.filter(
          (c) => c.command.includes(slashFilter) || c.label.toLowerCase().includes(slashFilter)
        );
        if (filtered.length > 0) {
          handleSelectCommand(filtered[0]);
          return;
        }
      }
      handleSubmit();
    } else if (e.key === "Escape") {
      setShowSlashMenu(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const hasContext = context && (context.page || context.lineCode || context.styleCode);

  const filteredCommands = SLASH_COMMANDS.filter(
    (c) =>
      c.command.toLowerCase().includes(slashFilter) ||
      c.label.toLowerCase().includes(slashFilter) ||
      c.description.toLowerCase().includes(slashFilter)
  );

  return (
    <div className="border-t border-slate-200 bg-white px-3 pt-2.5 pb-3 shrink-0 relative">
      {/* "/" shortcut menu */}
      {showSlashMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50 max-h-72 overflow-y-auto custom-scrollbar"
        >
          <div className="px-3 py-2 border-b border-slate-100 text-[11px] font-medium text-slate-500">Shortcuts</div>
          <div className="p-1">
            {filteredCommands.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">No matching shortcut</div>
            ) : (
              filteredCommands.map((cmd) => (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => handleSelectCommand(cmd)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FAF7F2] transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="h-7 w-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {cmd.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] text-slate-900">
                      {cmd.label} <span className="font-mono text-[11px] text-slate-400">{cmd.command}</span>
                    </span>
                    <span className="block text-[11px] text-slate-500 truncate">{cmd.description}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {hasContext && (
        <div className="flex items-center gap-1.5 mb-2 px-1 text-[11px] text-slate-500 min-w-0" title="Questions without a line, style or order use this page">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            On <span className="text-slate-700">{context.page || "this page"}</span>
            {context.lineCode && <> · {context.lineCode}</>}
            {context.styleCode && <> · {context.styleCode}</>}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 bg-white rounded-xl border border-slate-300 focus-within:border-[#9C5B3C] focus-within:ring-2 focus-within:ring-[#9C5B3C]/15 transition-colors pl-3 pr-1.5 py-1.5">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-label="Message SewNexa AI"
          placeholder="Ask SewNexa AI…  ( / for shortcuts)"
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden py-1.5 custom-scrollbar max-h-28 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          aria-label="Send"
          title="Send (Enter)"
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            input.trim() && !isLoading
              ? "bg-[#9C5B3C] hover:bg-[#864C31] text-white cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
