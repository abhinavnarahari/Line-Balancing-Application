import { api } from "../../lib/api";
import type { ChatMessage, ChatConversation, SendMessageRequest, FeedbackRequest } from "./types";

export async function sendChatMessage(request: SendMessageRequest): Promise<ChatMessage> {
  return (await api.post("/chatbot/chat", request)) as unknown as ChatMessage;
}

export async function getChatConversations(userIdentifier = "default_user"): Promise<ChatConversation[]> {
  const data = (await api.get("/chatbot/conversations", { params: { userIdentifier } })) as unknown as ChatConversation[];
  return data || [];
}

export async function getChatConversationById(id: number): Promise<ChatConversation> {
  return (await api.get(`/chatbot/conversations/${id}`)) as unknown as ChatConversation;
}

export async function deleteChatConversation(id: number): Promise<void> {
  await api.delete(`/chatbot/conversations/${id}`);
}

export async function submitChatFeedback(request: FeedbackRequest): Promise<void> {
  await api.post("/chatbot/feedback", request);
}
