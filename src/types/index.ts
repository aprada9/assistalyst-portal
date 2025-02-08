
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FormData {
  documentType: 'url' | 'file' | 'paste';
  pastedText: string;
  summaryType: 'bullets' | 'general';
  summarySize: 'quarter' | 'half' | 'full';
  webSource: 'all' | 'boe' | 'borne' | 'custom';
  searchQuery: string;
  customWebs: string;
}

export type Step = 'initial' | 'summary' | 'search' | 'processing';
