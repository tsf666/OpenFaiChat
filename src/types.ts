export interface ChatPart {
  text: string
}

export interface ChatMessage {
  // role: 'model' | 'user'
  // parts: ChatPart[]
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

export interface ErrorMessage {
  code: string
  message: string
}
