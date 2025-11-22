export enum AppMode {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  LIVE = 'LIVE',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  timestamp: Date;
}