export type StructuredPayload = {
  type: "METRIC" | "TABLE" | "CHART" | "COMPARISON" | "ALERT";
  title?: string;
  headers?: string[];
  rows?: Array<Record<string, any>>;
  metrics?: Record<string, any>;
  chartData?: Array<{ name: string; target?: number; actual?: number; [key: string]: any }>;
};

export type ChatMessage = {
  id: number;
  conversationId: number;
  sender: "USER" | "ASSISTANT" | "SYSTEM";
  messageText: string;
  intent?: string;
  dataSource?: string;
  dataAvailable?: boolean;
  structuredPayload?: StructuredPayload;
  suggestedQuestions?: string[];
  createdAt: string;
};

export type ChatConversation = {
  id: number;
  userIdentifier: string;
  title: string;
  contextMetadata?: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
};

export type ChatContext = {
  styleId?: number;
  styleCode?: string;
  activeStyleId?: number;
  activeStyleCode?: string;
  lineId?: number;
  lineCode?: string;
  activeLineId?: number;
  activeLineCode?: string;
  orderId?: number;
  orderCode?: string;
  shiftId?: number;
  lineDesignId?: number;
  page?: string;
};

export type SendMessageRequest = {
  conversationId?: number;
  message: string;
  context?: ChatContext;
  userIdentifier?: string;
};

export type FeedbackRequest = {
  messageId: number;
  helpful: boolean;
  comment?: string;
};
