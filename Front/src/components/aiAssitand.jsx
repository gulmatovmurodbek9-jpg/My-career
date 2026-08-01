import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Sparkles, User, Bot } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { API } from "../lib/config";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "react-i18next";

export function ChatModal({ open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const { i18n } = useTranslation();

  const lang = (i18n.language || "tj").slice(0, 2);

  const localDict = {
    tj: {
      title: "AI Маслиҳатгар",
      subtitle: "Дар бораи ихтисосҳо савол диҳед.",
      error: "Хатогӣ рӯй дод. Лутфан дубора кӯшиш кунед.",
      typing: "Ҷавоб додан...",
      placeholder: "Саволи худро нависед..."
    },
    ru: {
      title: "AI Консультант",
      subtitle: "Задайте вопрос о специальностях.",
      error: "Произошла ошибка. Пожалуйста, попробуйте еще раз.",
      typing: "Отвечает...",
      placeholder: "Напишите свой вопрос..."
    },
    en: {
      title: "AI Advisor",
      subtitle: "Ask about careers.",
      error: "An error occurred. Please try again.",
      typing: "Responding...",
      placeholder: "Type your question..."
    }
  };

  const currentDict = localDict[lang] || localDict.tj;

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post(`${API}/careers/ask`,
        { question: input, lang },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || data },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: currentDict.error },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card !rounded-2xl p-0 overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(91, 108, 240, 0.12), 0 16px 64px rgba(0,0,0,0.06)" }}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2.5 text-foreground">
            <div className="w-8 h-8 rounded-xl icon-box-solid flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">{currentDict.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <div className="h-[360px] overflow-y-auto p-5 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-14">
              <div className="w-14 h-14 icon-box mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">{currentDict.title}</p>
              <p className="text-xs">{currentDict.subtitle}</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg icon-box flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                    ? "btn-primary !cursor-default"
                    : "glass-card-sm !rounded-2xl text-foreground"
                    }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              {currentDict.typing}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={currentDict.placeholder}
              className="min-h-[40px] max-h-[100px] resize-none text-sm bg-muted/50 border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-primary text-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              size="sm"
              className="btn-primary h-[40px] px-3.5 !rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
