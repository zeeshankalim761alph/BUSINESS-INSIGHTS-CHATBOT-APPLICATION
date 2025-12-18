export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

export const SUGGESTED_PROMPTS = [
  "Create a SWOT analysis for a coffee shop",
  "Suggest marketing strategies for a SaaS startup",
  "How can I improve cash flow management?",
  "Explain the freemium business model",
];