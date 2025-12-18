import api from "./api";
import type { Message, Conversation, PaginatedResponse } from "@/types";

export interface SendMessageData {
  conversationId?: string;
  recipientId: string;
  content: string;
  propertyId?: string;
  attachments?: File[];
}

export const messageService = {
  // Get all conversations
  async getConversations(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Conversation>> {
    const response = await api.get<PaginatedResponse<Conversation>>(
      `/messages/conversations?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Get single conversation with messages
  async getConversation(
    conversationId: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{ conversation: Conversation; messages: Message[] }> {
    const response = await api.get(
      `/messages/conversations/${conversationId}?page=${page}&pageSize=${pageSize}`
    );
    return response.data;
  },

  // Send a new message
  async sendMessage(data: SendMessageData): Promise<Message> {
    if (data.attachments && data.attachments.length > 0) {
      const formData = new FormData();
      if (data.conversationId) formData.append("conversationId", data.conversationId);
      formData.append("recipientId", data.recipientId);
      formData.append("content", data.content);
      if (data.propertyId) formData.append("propertyId", data.propertyId);
      data.attachments.forEach((file) => formData.append("attachments", file));

      const response = await api.post<Message>("/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }

    const response = await api.post<Message>("/messages", data);
    return response.data;
  },

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    await api.patch(`/messages/conversations/${conversationId}/read`);
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>("/messages/unread-count");
    return response.data.count;
  },

  // Start new conversation (for property inquiry)
  async startConversation(
    recipientId: string,
    propertyId?: string,
    initialMessage?: string
  ): Promise<Conversation> {
    const response = await api.post<Conversation>("/messages/conversations", {
      recipientId,
      propertyId,
      initialMessage,
    });
    return response.data;
  },

  // Block user
  async blockUser(userId: string): Promise<void> {
    await api.post(`/messages/block/${userId}`);
  },

  // Unblock user
  async unblockUser(userId: string): Promise<void> {
    await api.delete(`/messages/block/${userId}`);
  },

  // Report conversation
  async reportConversation(conversationId: string, reason: string): Promise<void> {
    await api.post(`/messages/conversations/${conversationId}/report`, { reason });
  },
};
