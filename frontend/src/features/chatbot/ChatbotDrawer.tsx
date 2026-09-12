import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, History, Trash2, ChevronRight, MessageSquare, ArrowLeft } from "lucide-react";
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
        messageText: "Sorry, I encountered an issue retrieving data from SewNexa. Please try again.",
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
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[540px] bg-white border-l border-[#E8E2D9] shadow-2xl flex flex-col font-sans transition-all duration-300 ease-in-out">
        {/* Header */}
        <header className="h-16 border-b border-[#E8E2D9] bg-white px-4 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-[#9C5B3C] to-[#7D462E] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#221912] tracking-tight">SewNexa AI</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  LIVE
                </span>
              </div>
              <div className="text-[11px] text-[#8C7E6E] font-medium">Garment Industrial Engineering AI</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              className="p-2 text-[#6B5C50] hover:text-[#9C5B3C] hover:bg-[#FAF7F2] rounded-xl border border-transparent hover:border-[#E8E2D9] transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Start new thread"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>

            {/* History Toggle Button */}
            <button
              onClick={() => setActiveTab(activeTab === "chat" ? "history" : "chat")}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative flex items-center gap-1 text-xs font-semibold ${
                activeTab === "history"
                  ? "bg-[#FAF7F2] text-[#9C5B3C] border-[#E8E2D9] shadow-2xs"
                  : "text-[#6B5C50] hover:text-[#221912] border-transparent hover:bg-[#FAF7F2] hover:border-[#E8E2D9]"
              }`}
              title="View chat history"
            >
              <History className="h-4 w-4" />
              {conversations.length > 0 && (
                <span className="text-[10px] font-mono px-1 rounded-full bg-[#9C5B3C]/10 text-[#9C5B3C] font-bold">
                  {conversations.length}
                </span>
              )}
            </button>

            <div className="h-4 w-px bg-[#E8E2D9] mx-0.5" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-[#8C7E6E] hover:text-[#221912] hover:bg-[#FAF7F2] rounded-xl border border-transparent hover:border-[#E8E2D9] transition-all cursor-pointer"
              title="Close SewNexa AI (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

      {/* Main Body */}
      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F7F4EE]">
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
        <div className="flex-1 overflow-y-auto p-4 bg-[#F7F4EE] custom-scrollbar">
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={() => setActiveTab("chat")}
              className="text-xs font-bold text-[#8C7E6E] hover:text-[#221912] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Active Chat</span>
            </button>

            <button
              onClick={handleStartNewChat}
              className="text-xs font-bold text-[#9C5B3C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Conversation</span>
            </button>
          </div>

          {conversations.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8C7E6E] space-y-2">
              <MessageSquare className="h-8 w-8 text-[#B0A294] mx-auto opacity-50" />
              <div>No past conversation threads yet.</div>
              <div className="text-[11px] text-[#A6998A]">Questions you ask will be saved here.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    activeConversationId === conv.id
                      ? "bg-white border-[#9C5B3C] shadow-xs"
                      : "bg-white hover:bg-white/95 border-[#E8E2D9] hover:border-[#9C5B3C]/50 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="h-8 w-8 rounded-lg bg-[#FAF7F2] text-[#9C5B3C] flex items-center justify-center shrink-0 border border-[#E8E2D9]">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#221912] truncate">{conv.title}</div>
                      <div className="text-[10px] text-[#8C7E6E] font-medium">
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
                      className="p-1.5 text-[#8C7E6E] hover:text-red-600 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-[#8C7E6E] shrink-0 group-hover:translate-x-0.5 transition-transform" />
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

