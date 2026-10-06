import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, X, MapPin, Slash, Sparkles, Compass, Target, Users, Star, Layers, Shirt, Factory, BarChart3, AlertOctagon, HelpCircle } from "lucide-react";
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
    label: "Application Guide",
    description: "End-to-end SewNexa workflow & 6 operational phases",
    query: "How does this application work?",
    icon: <Compass className="h-3.5 w-3.5 text-blue-600" />,
  },
  {
    command: "/balance",
    label: "Line Balancing",
    description: "Calculate pitch time, takt time & station balance",
    query: "How do I balance a line in this app?",
    icon: <Target className="h-3.5 w-3.5 text-amber-600" />,
  },
  {
    command: "/operators",
    label: "Workforce & Operators",
    description: "Search 50 factory operators and line assignments",
    query: "How do I add an operator?",
    icon: <Users className="h-3.5 w-3.5 text-indigo-600" />,
  },
  {
    command: "/skill",
    label: "Skill Matrix",
    description: "1–5 Star competency grades & evaluation standards",
    query: "How does the 1–5 Skill Matrix work?",
    icon: <Star className="h-3.5 w-3.5 text-amber-500" />,
  },
  {
    command: "/bulletins",
    label: "Operation Bulletins",
    description: "View sequential sewing routings & standard SMVs",
    query: "Show details of OB-POLO-800",
    icon: <Layers className="h-3.5 w-3.5 text-emerald-600" />,
  },
  {
    command: "/styles",
    label: "Garment Styles",
    description: "Buyer brands, purchase orders & specifications",
    query: "How to create a style and purchase orders?",
    icon: <Shirt className="h-3.5 w-3.5 text-rose-600" />,
  },
  {
    command: "/lines",
    label: "Sewing Lines Master",
    description: "Line codes, layout types, targets & capacities",
    query: "Show me all lines",
    icon: <Factory className="h-3.5 w-3.5 text-purple-600" />,
  },
  {
    command: "/dashboard",
    label: "Multi-Tier Dashboards",
    description: "Executive, line supervisor & plant analytics",
    query: "Tell me about the dashboard",
    icon: <BarChart3 className="h-3.5 w-3.5 text-teal-600" />,
  },
  {
    command: "/immediate",
    label: "Immediate Actions & Floaters",
    description: "Deploy floater operators to unblock live bottlenecks",
    query: "How do I deploy floaters to bottlenecks?",
    icon: <AlertOctagon className="h-3.5 w-3.5 text-red-600" />,
  },
  {
    command: "/help",
    label: "Platform Capabilities",
    description: "Grounded data overview and supported questions",
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
    <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 shrink-0 relative">
      {/* Floating Slash Commands Menu */}
      {showSlashMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>SewNexa Quick Commands</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Press Enter or click to run</span>
          </div>

          <div className="p-1 space-y-0.5">
            {filteredCommands.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">No matching command found</div>
            ) : (
              filteredCommands.map((cmd) => (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => handleSelectCommand(cmd)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200/80 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 border border-slate-200">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-700">{cmd.command}</span>
                        <span className="text-xs font-semibold text-slate-900 truncate">{cmd.label}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 truncate">{cmd.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Ask ↵
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Integrated Context Pill */}
      {hasContext && (
        <div className="flex items-center justify-between mb-2 px-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">
              {context.page || "Industrial Engineering"}
            </span>
            {context.lineCode && (
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-amber-800">
                {context.lineCode}
              </span>
            )}
            {context.styleCode && (
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-800">
                {context.styleCode}
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-600 shrink-0 font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Active Context
          </span>
        </div>
      )}

      {/* Input Box */}
      <div className="relative flex items-end gap-2 bg-[#FBF9F5] rounded-2xl border border-[#E6DDCE] focus-within:border-[#9C5B3C] focus-within:ring-2 focus-within:ring-[#9C5B3C]/15 focus-within:bg-white transition-all p-2 shadow-2xs">
        {/* Quick Slash Commands Trigger Pill */}
        <button
          type="button"
          onClick={() => setShowSlashMenu(!showSlashMenu)}
          className={`h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
            showSlashMenu
              ? "bg-[#9C5B3C] text-white border border-[#8B4E32] shadow-2xs"
              : "bg-white hover:bg-[#F6F1E8] text-[#8B4E32] border border-[#E6DDCE]"
          }`}
          title="Open slash commands menu (/)"
        >
          <Slash className="h-3 w-3" />
          <span className="hidden sm:inline">Commands</span>
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask SewNexa about application workflows, line balancing, SMVs, operators..."
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-xs text-[#221912] placeholder-stone-400 focus:outline-hidden py-1 px-1 custom-scrollbar max-h-28"
        />

        {input.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              setShowSlashMenu(false);
            }}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-full transition-colors cursor-pointer"
            title="Clear text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            input.trim() && !isLoading
              ? "bg-gradient-to-r from-[#9C5B3C] to-[#723E28] text-white shadow-xs hover:shadow-sm hover:scale-105 active:scale-95"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
          }`}
          title="Send inquiry (Enter)"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
        <span className="flex items-center gap-1 font-medium">
          Type <span className="font-mono font-bold text-amber-700">/</span> for instant command shortcuts
        </span>
        <span className="font-mono">↵ to send · Shift+↵ for new line</span>
      </div>
    </div>
  );
};
