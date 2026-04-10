import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Send, ChevronDown, ChevronUp,
  Sparkles, X, Clock, ExternalLink,
  Loader2, TrendingUp,
} from "lucide-react";

const STARTER_QUESTIONS = [
  "What's moving markets right now?",
  "What are the wealthy buying in 2025?",
  "Explain the latest Fed rate decision",
  "What sectors should I watch this week?",
  "How is inflation affecting investments?",
  "What is the S&P 500 doing today?",
];

const FREE_DAILY_LIMIT = 5;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string }[];
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  question: string;
  answer: string;
  sources: { title: string; url: string }[];
  created_at: string;
}

export default function MarketIntelCard() {
  const { user } = useAuth();
  const isDark = document.documentElement.classList.contains("dark");
  const isMobile = window.innerWidth < 768;

  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [isPaidUser, setIsPaidUser] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const border = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const bg = isDark ? "#1C1C1E" : "#ffffff";
  const bg2 = isDark ? "#252528" : "#F9FAFB";
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.5)" : "#6B7280";
  const green = "#10B981";

  useEffect(() => {
    if (!user) return;
    checkUsageAndPlan();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkUsageAndPlan = async () => {
    if (!user) return;

    // Check plan
    const { data: prefs } = await (supabase as any)
      .from("user_preferences")
      .select("is_subscribed, subscription_type, founding_member_since")
      .eq("user_id", user.id)
      .maybeSingle();

    const paid = prefs?.is_subscribed === true ||
      prefs?.subscription_type === "founding" ||
      prefs?.founding_member_since != null;
    setIsPaidUser(paid);

    // Check today usage
    const today = new Date().toISOString().split("T")[0];
    const { data: usage } = await (supabase as any)
      .from("ai_chat_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    setUsageCount(usage?.count || 0);
  };

  const incrementUsage = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    await (supabase as any)
      .from("ai_chat_usage")
      .upsert(
        { user_id: user.id, date: today, count: usageCount + 1 },
        { onConflict: "user_id,date" }
      );
    setUsageCount(p => p + 1);
  };

  const saveToHistory = async (
    question: string,
    answer: string,
    sources: { title: string; url: string }[]
  ) => {
    if (!user) return;
    await (supabase as any).from("ai_chat_history").insert({
      user_id: user.id,
      question,
      answer,
      sources,
    });
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await (supabase as any)
      .from("ai_chat_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
    setLoadingHistory(false);
  };

  const handleSend = async (questionOverride?: string) => {
    const question = (questionOverride || input).trim();
    if (!question || loading) return;

    // Check limit for free users
    if (!isPaidUser && usageCount >= FREE_DAILY_LIMIT) {
      toast.error(
        "You've used your 5 free questions today. Upgrade for unlimited access."
      );
      return;
    }

    setInput("");
    setLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { data, error } = await supabase
        .functions.invoke("market-intel", {
          body: {
            prompt: `You are a financial intelligence assistant inside Digital Home.

Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

CRITICAL FACTS:
- Donald Trump is the current US President
- He took office January 20 2025
- ALWAYS search the web before answering
- NEVER answer from memory alone
- NEVER say "as of my last update"

Question: ${question}

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
Write 2-3 short plain paragraphs answering the question with current information.
No bullet points. No bold text. No headers.
Maximum 180 words total.

Then on a new line write exactly:
---
Sources:
[Source Name](https://full-url-here.com)
[Source Name 2](https://full-url-here.com)

Then on a new line write exactly:
Takeaway: One sentence of practical advice.`,
          },
        });

      if (error) throw new Error(error.message);

      const answerText = data?.plan || 
        data?.answer ||
        data?.result ||
        "Could not get an answer. Try again.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answerText,
        sources: [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      await incrementUsage();
      await saveToHistory(question, answerText, []);

    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date(),
      }]);
      toast.error("Request failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const remainingQuestions = FREE_DAILY_LIMIT - usageCount;

  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${border}`,
      background: bg,
      overflow: "hidden",
      fontFamily: "Inter, sans-serif",
    }}>

      {/* HEADER */}
      <div onClick={() => setCollapsed(p => !p)} style={{
        background: isDark
          ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
          : "linear-gradient(135deg, #667eea, #764ba2)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingUp className="w-5 h-5" style={{ color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
              Market Intelligence
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
              Ask anything — news, markets, investing
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isPaidUser && !collapsed && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: "white", padding: "3px 10px", borderRadius: 999 }}>
              {remainingQuestions} left today
            </span>
          )}
          {isPaidUser && !collapsed && (
            <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.2)", color: "white", padding: "3px 10px", borderRadius: 999 }}>
              Unlimited
            </span>
          )}
          {collapsed
            ? <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
            : <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.7)" }} />
          }
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: isMobile ? "12px 16px 16px" : "16px 24px 24px" }}>

          {/* MESSAGES AREA */}
          {messages.length === 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: text2, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: 10 }}>
                Suggested questions
              </div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {STARTER_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    style={{
                      padding: "7px 12px",
                      background: bg2,
                      border: `1px solid ${border}`,
                      borderLeft: "3px solid #10B981",
                      borderRadius: 14,
                      fontSize: 12,
                      fontWeight: 500,
                      color: text1,
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      transition: "all 150ms",
                      textAlign: "left" as const,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = green;
                      e.currentTarget.style.color = green;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = border;
                      e.currentTarget.style.color = text1;
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" as const, marginBottom: 16, paddingRight: 4 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ marginBottom: 16 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "4px 18px 18px 18px",
                      background: msg.role === "user" ? green : (isDark ? "rgba(255,255,255,0.04)" : "#F8FAFF"),
                      border: msg.role === "assistant" ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E0E7FF"}` : "none",
                      color: msg.role === "user" ? "white" : text1,
                      fontSize: 13,
                      lineHeight: 1.6,
                      fontFamily: "Inter, sans-serif",
                      whiteSpace: "pre-wrap" as const,
                    }}>
                      {msg.content}
                    </div>
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 6, paddingLeft: 4 }}>
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            background: isDark ? "rgba(255,255,255,0.06)" : "white",
                            border: `1px solid ${border}`,
                            borderRadius: 10,
                            textDecoration: "none",
                            boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                            transition: "all 150ms",
                          }}
                        >
                          <ExternalLink className="w-3 h-3" style={{ color: text2 }} />
                          <span style={{ fontSize: 11, fontWeight: 500, color: text1, fontFamily: "Inter, sans-serif" }}>
                            {src.title.length > 30
                              ? src.title.slice(0, 30) + "..."
                              : src.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: text2, marginTop: 4, paddingLeft: msg.role === "user" ? 0 : 4, textAlign: msg.role === "user" ? "right" as const : "left" as const }}>
                    {msg.timestamp.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", borderRadius: "14px 14px 14px 4px",
                    background: bg2, fontSize: 13, color: text2,
                  }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: green }} />
                    <span style={{ fontFamily: "Inter, sans-serif" }}>
                      Searching markets...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* BOTTOM TOOLBAR */}
          {messages.length > 0 && (
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <button
                onClick={clearChat}
                style={{
                  background: "transparent", border: "none", fontSize: 11,
                  color: text2, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 0",
                }}
              >
                <X className="w-3 h-3" /> Clear chat
              </button>
              <button
                onClick={() => {
                  setHistoryOpen(true);
                  loadHistory();
                }}
                style={{
                  background: "transparent", border: "none", fontSize: 11,
                  color: text2, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 0",
                }}
              >
                <Clock className="w-3 h-3" /> Past questions
              </button>
            </div>
          )}

          {/* INPUT */}
          <div>
            {!isPaidUser && usageCount >= FREE_DAILY_LIMIT ? (
              <div style={{ textAlign: "center" as const, padding: "20px 0" }}>
                <div style={{ fontSize: 13, color: text2, marginBottom: 12, fontFamily: "Inter, sans-serif" }}>
                  You've used your 5 free questions for today.
                </div>
                <button
                  onClick={() => window.location.href = "/settings"}
                  style={{
                    padding: "9px 20px",
                    background: green,
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Upgrade for Unlimited
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about markets, news, investing..."
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: `1px solid ${border}`,
                    borderRadius: 14,
                    background: bg2,
                    color: text1,
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                    outline: "none",
                    minHeight: 44,
                    resize: "none" as const,
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = green;
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = border;
                  }}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: loading || !input.trim()
                      ? (isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6")
                      : "linear-gradient(135deg, #10B981, #059669)",
                    border: "none",
                    cursor: loading || !input.trim()
                      ? "not-allowed"
                      : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 150ms",
                  }}
                >
                  <Send className="w-4 h-4" style={{ color: loading || !input.trim() ? text2 : "white" }} />
                </button>
              </div>
            )}
            <div style={{ fontSize: 10, color: text2, marginTop: 8, textAlign: "center" as const }}>
              Powered by Claude AI + live web search · Not financial advice
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {historyOpen && (
        <div onClick={() => setHistoryOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%",
            maxWidth: 520,
            background: bg,
            borderRadius: 16,
            border: `1px solid ${border}`,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column" as const,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: text1 }}>
                Past Questions
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: text2,
                  padding: 4,
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" as const }}>
              {loadingHistory ? (
                <div style={{ padding: 40, textAlign: "center" as const }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: green, margin: "0 auto" }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center" as const, color: text2, fontSize: 13 }}>
                  No past questions yet
                </div>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setMessages([
                        {
                          id: item.id + "_q",
                          role: "user",
                          content: item.question,
                          timestamp: new Date(item.created_at),
                        },
                        {
                          id: item.id + "_a",
                          role: "assistant",
                          content: item.answer,
                          sources: item.sources || [],
                          timestamp: new Date(item.created_at),
                        },
                      ]);
                      setHistoryOpen(false);
                    }}
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${border}`,
                      transition: "background 150ms",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = bg2;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: text1, marginBottom: 4 }}>
                      {item.question}
                    </div>
                    <div style={{ fontSize: 12, color: text2, lineHeight: 1.4 }}>
                      {item.answer.slice(0, 80)}...
                    </div>
                    <div style={{ fontSize: 10, color: text2, marginTop: 4 }}>
                      {new Date(item.created_at)
                        .toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}