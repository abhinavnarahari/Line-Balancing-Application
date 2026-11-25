import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, History, Trash2, ChevronRight, MessageSquare, ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import type { ChatMessage, ChatConversation, ChatContext } from "./types";
import { sendChatMessage, getChatConversations, getChatConversationById, deleteChatConversation } from "./api";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context?: ChatContext;
}

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
        messageText: "Sorry, I could not reach the Made2Balance server. Please try again in a moment.",
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="sewnexa-ai-title"
        className={`fixed inset-y-0 right-0 z-50 bg-white border-l border-slate-200 shadow-2xl flex flex-col font-sans transition-all duration-300 ease-in-out ${
          isExpanded
            ? "w-full sm:w-[840px] md:w-[980px] lg:w-[1120px] max-w-[96vw]"
            : "w-full sm:w-[540px] md:w-[620px]"
        }`}
      >
        {/* Header */}
        <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-[#9C5B3C] text-white flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 id="sewnexa-ai-title" className="text-sm font-bold text-slate-900 leading-tight">
                SewNexa AI
              </h2>
              <p className="text-[11px] text-slate-500 leading-tight truncate">Answers from your factory data</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <HeaderButton label="New chat" onClick={handleStartNewChat}>
              <Plus className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton
              label={activeTab === "history" ? "Back to chat" : "Chat history"}
              active={activeTab === "history"}
              onClick={() => setActiveTab(activeTab === "chat" ? "history" : "chat")}
            >
              <History className="h-4 w-4" />
            </HeaderButton>
            <HeaderButton
              label={isExpanded ? "Narrow view" : "Wide view"}
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </HeaderButton>
            <HeaderButton label="Close (Esc)" onClick={onClose}>
              <X className="h-4 w-4" />
            </HeaderButton>
          </div>
        </header>

        {/* Main Body */}
        {activeTab === "chat" ? (
          <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAF9]">
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
                <span>Back to chat</span>
              </button>

              <button
                onClick={handleStartNewChat}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New chat</span>
              </button>
            </div>

            {conversations.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600">No past conversations yet</div>
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

interface HeaderButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}

const HeaderButton: React.FC<HeaderButtonProps> = ({ label, onClick, active, className = "", children }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
      active ? "bg-[#F6F1E8] text-[#9C5B3C]" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
    } ${className}`}
  >
    {children}
  </button>
);
