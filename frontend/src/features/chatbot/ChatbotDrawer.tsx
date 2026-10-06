import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, History, Trash2, ChevronRight, MessageSquare, ArrowLeft, Maximize2, Minimize2, Compass, Target, Star, Users, Layers, RotateCcw } from "lucide-react";
import type { ChatMessage, ChatConversation, ChatContext } from "./types";
import { sendChatMessage, getChatConversations, getChatConversationById, deleteChatConversation } from "./api";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
}

const QUICK_TOPICS = [
  { label: "🧭 App Guide", query: "How does this application work?" },
  { label: "⚡ Balance Line", query: "How do I balance a line in this app?" },
  { label: "⭐ Skill Matrix", query: "How does the 1–5 Skill Matrix work?" },
  { label: "👥 Add Operator", query: "How do I add an operator?" },
  { label: "📋 Bulletins", query: "Show details of OB-POLO-800" },
  { label: "📊 Dashboards", query: "Tell me about the dashboard" },
];

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({ isOpen, onClose, context }) => {
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [isExpanded, setIsExpanded] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const loadConversations = async () => {
    try {
      const data = await getChatConversations();
      setConversations(data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      conversationId: activeConversationId || 0,
      sender: "USER",
      messageText: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await sendChatMessage({
        conversationId: activeConversationId,
        message: text,
        context,
      });

      setActiveConversationId(response.conversationId);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, response]);
      loadConversations();
    } catch (err) {
      console.error("Failed to send message", err);
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        conversationId: activeConversationId || 0,
        sender: "ASSISTANT",
        messageText: "⚠️ Sorry, I encountered an issue retrieving data from SewNexa. Please try again or check the server status.",
        dataSource: "APPLICATION_DATA",
        dataAvailable: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setActiveTab("chat");
  };

  const handleSelectConversation = async (convId: number) => {
    try {
      setIsLoading(true);
      const conv = await getChatConversationById(convId);
      setActiveConversationId(conv.id);
      setMessages(conv.messages || []);
      setActiveTab("chat");
    } catch (err) {
      console.error("Failed to load conversation", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, convId: number) => {
    e.stopPropagation();
    try {
      await deleteChatConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleStartNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans transition-all duration-300 ease-in-out ${
          isExpanded
            ? "w-full sm:w-[840px] md:w-[980px] lg:w-[1120px] max-w-[96vw]"
            : "w-full sm:w-[540px] md:w-[620px]"
        }`}
      >
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shadow-xs ring-2 ring-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 tracking-tight">SewNexa AI</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">Garment Industrial Engineering Copilot</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Expand / Collapse Width Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-slate-600 hover:text-amber-800 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title={isExpanded ? "Collapse to standard width" : "Expand to wide view for tables"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isExpanded ? "Collapse" : "Expand"}</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              className="p-2 text-slate-600 hover:text-amber-800 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Start new conversation"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* History Toggle Button */}
            <button
              onClick={() => setActiveTab(activeTab === "chat" ? "history" : "chat")}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative flex items-center gap-1 text-xs font-semibold ${
                activeTab === "history"
                  ? "bg-slate-100 text-amber-800 border-slate-300 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100 hover:border-slate-200"
              }`}
              title="View past conversation threads"
            >
              <History className="h-4 w-4" />
              {conversations.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {conversations.length}
                </span>
              )}
            </button>

            <div className="h-4 w-px bg-slate-200 mx-0.5" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer"
              title="Close SewNexa AI (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Quick Topics Pills Bar (Visible on Active Chat) */}
        {activeTab === "chat" && (
          <div className="bg-slate-50/80 border-b border-slate-200/80 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5">
              Quick:
            </span>
            {QUICK_TOPICS.map((topic, tIdx) => (
              <button
                key={tIdx}
                type="button"
                onClick={() => handleSendMessage(topic.query)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 border border-slate-200 text-[11px] font-semibold transition-all shrink-0 cursor-pointer shadow-2xs"
              >
                {topic.label}
              </button>
            ))}
          </div>
        )}

        {/* Main Body */}
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              context={context}
              onSelectPrompt={handleSendMessage}
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              context={context}
            />
          </div>
        ) : (
          /* History Tab */
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40 custom-scrollbar">
            <div className="flex items-center justify-between mb-3 px-1">
              <button
                onClick={() => setActiveTab("chat")}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Active Chat</span>
              </button>

              <button
                onClick={handleStartNewChat}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Conversation</span>
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600">No past conversation threads yet</div>
                <div className="text-[11px] text-slate-400">Questions you ask will be saved here automatically.</div>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      activeConversationId === conv.id
                        ? "bg-white border-amber-500 shadow-xs ring-1 ring-amber-500/20"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-400 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="h-8 w-8 rounded-xl bg-slate-100 text-amber-700 flex items-center justify-center shrink-0 border border-slate-200">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{conv.title}</div>
                        <div className="text-[10.5px] text-slate-400 font-medium">
                          {new Date(conv.updatedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete thread"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 group-hover:text-slate-600 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
