"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Loader2, MessageCircle, Mic, MicOff, Send, Sparkles, X } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatResponse = {
  reply?: string;
  error?: string;
  details?: string;
};

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<{
    0: { transcript: string };
  }>;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Xin chào! Tôi là trợ lý AI An Cư Plus. Tôi có thể giúp bạn tìm bất động sản, gợi ý khu vực, giải thích quy trình đăng tin hoặc đặt lịch xem nhà.",
  },
];

const defaultRestrictedWords = ["địt", "lồn", "cặc", "chửi", "lừa đảo", "đụ", "má"];

function maskRestrictedWords(message: string, restrictedWords: string[]) {
  const words = restrictedWords.map((word) => word.trim()).filter(Boolean);
  if (words.length === 0) return message;

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(words.sort((a, b) => b.length - a.length).map(escapeRegExp).join("|"), "gi");

  return message.replace(pattern, "***");
}

function hasRestrictedWords(message: string, restrictedWords: string[]) {
  const words = restrictedWords.map((word) => word.trim()).filter(Boolean);
  if (words.length === 0) return false;

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(words.sort((a, b) => b.length - a.length).map(escapeRegExp).join("|"), "i");

  return pattern.test(message);
}

function renderMessage(content: string) {
  const parts = content.split(/(\/property\/[a-f0-9]{24})/gi);

  return parts.map((part, index) => {
    if (/^\/property\/[a-f0-9]{24}$/i.test(part)) {
      return (
        <Link key={`${part}-${index}`} href={part} className="font-semibold text-blue-600 underline underline-offset-2">
          Xem tin
        </Link>
      );
    }

    return (
      <span key={`${part}-${index}`} className="whitespace-pre-wrap">
        {part.replace(/\*\*/g, "")}
      </span>
    );
  });
}

export function Chatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [restrictedWords, setRestrictedWords] = useState<string[]>(defaultRestrictedWords);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;

        const data = await res.json();
        const setting = data?.restricted_words;
        if (Array.isArray(setting)) {
          setRestrictedWords(setting);
        } else if (typeof setting === "string") {
          setRestrictedWords(setting.split(",").map((word) => word.trim()).filter(Boolean));
        }
      } catch {
        // Settings are optional for the public chatbot.
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    setVoiceSupported(typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const userMessage = input.trim();
    if (!userMessage || loading) return;

    const maskedMessage = maskRestrictedWords(userMessage, restrictedWords);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: maskedMessage }];

    setInput("");
    setMessages(nextMessages);

    if (hasRestrictedWords(userMessage, restrictedWords)) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "Tin nhắn của bạn có nội dung không phù hợp nên tôi chưa xử lý yêu cầu này. Bạn vui lòng nhập lại bằng ngôn từ lịch sự hơn nhé.",
        },
      ]);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, pagePath: pathname }),
      });

      const data = (await res.json()) as ChatResponse;
      if (!res.ok) {
        throw new Error(data.details || data.error || "Không thể kết nối trợ lý AI.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Tôi chưa có câu trả lời phù hợp. Bạn thử hỏi lại cụ thể hơn nhé.",
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể kết nối trợ lý AI.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Xin lỗi, hiện tôi chưa trả lời được. ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  }

  function toggleVoiceInput() {
    if (!voiceSupported || loading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ")
        .trim();
      if (transcript) setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white shadow-xl shadow-blue-900/20 transition-all ${
          isOpen ? "pointer-events-none scale-50 opacity-0" : "scale-100 opacity-100 hover:-translate-y-0.5 hover:shadow-2xl"
        }`}
        aria-label="Mở trợ lý AI"
      >
        <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-600 opacity-90" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
          <MessageCircle className="h-6 w-6" />
        </div>
        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[550px] w-[360px] flex-col overflow-hidden rounded-2xl border border-blue-500/20 bg-background shadow-2xl animate-in fade-in-50 slide-in-from-bottom-5 duration-300 max-sm:bottom-0 max-sm:right-0 max-sm:h-[100dvh] max-sm:w-full max-sm:rounded-none">
          <div className="relative flex h-16 shrink-0 items-center justify-between overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-white shadow-sm">
            <div className="absolute right-0 top-0 p-4 opacity-10">
              <Sparkles className="h-16 w-16" />
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2 shadow-inner backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="flex items-center gap-1 text-sm font-bold tracking-wide">An Cư Plus AI</span>
                <span className="flex items-center gap-1 text-[10px] font-medium text-blue-100">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  Luôn sẵn sàng hỗ trợ
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 rounded-full p-1.5 transition-colors hover:bg-white/20"
              aria-label="Đóng trợ lý AI"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white bg-gradient-to-br from-indigo-100 to-blue-200 shadow-sm">
                    <Bot className="h-4 w-4 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`relative max-w-[82%] whitespace-pre-wrap px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                      : "rounded-2xl rounded-tl-sm border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  {renderMessage(msg.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end justify-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-200 shadow-sm">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex h-11 items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                  <span className="text-xs">Đang suy nghĩ...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t bg-white p-3 shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi An Cư Plus..."
              className="min-h-11 max-h-24 flex-1 resize-none rounded-2xl border bg-slate-100/50 px-4 py-2.5 text-[14px] transition-all focus-visible:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              rows={1}
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={!voiceSupported || loading}
              title={voiceSupported ? "Nhập bằng giọng nói" : "Trình duyệt chưa hỗ trợ nhập giọng nói"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all disabled:opacity-40 ${
                isListening
                  ? "border-red-200 bg-red-50 text-red-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
              }`}
              aria-label="Nhập bằng giọng nói"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all hover:shadow-md disabled:opacity-40 disabled:hover:shadow-none"
              aria-label="Gửi tin nhắn"
            >
              <Send className="ml-0.5 h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
