import { ChatMessage, chatCompletion } from "./api";

function noop() {}

export class ChatSession {
  key: string;
  messages: ChatMessage[];
  isClosed = false;
  closeCallback: () => void = noop;
  closeTimer: NodeJS.Timeout | undefined;

  constructor(key: string) {
    this.key = key;
    this.messages = [];
    this.resetCloseTimer();
  }

  async talk(content: string) {
    if (this.isClosed) return;
    this.messages.push({ role: "user", content });
    const responseContent = await chatCompletion(this.messages);
    this.messages.push({ role: "assistant", content: responseContent });
    this.resetCloseTimer();
    return responseContent;
  }

  resetCloseTimer() {
    this.isClosed = false;
    const _this = this;
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(
      () => _this.close(),
      3 * 60 * 60 * 1000,
    ); /* 3 hours */
  }

  onClose(fn: () => void) {
    this.closeCallback = fn;
  }

  close() {
    this.isClosed = true;
    clearTimeout(this.closeTimer);
    this.closeCallback();
  }
}

export class ChatBus {
  chatMap: Map<string, ChatSession>;
  constructor() {
    this.chatMap = new Map();
  }

  newChat(key: string) {
    const session = new ChatSession(key);
    const _this = this;
    session.onClose(() => {
      _this.chatMap.delete(key);
    });
    this.chatMap.set(key, session);
    return session;
  }

  findChat(key: string) {
    return this.chatMap.get(key);
  }

  hasChat(key: string) {
    return this.chatMap.has(key);
  }

  deleteChat(key: string) {
    return this.chatMap.delete(key);
  }
}
