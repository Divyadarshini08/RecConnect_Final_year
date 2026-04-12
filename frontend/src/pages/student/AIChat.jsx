import { useState, useRef, useEffect } from "react";
import { API } from "../../utils/api";

const SUGGESTIONS = [
  "I want to switch careers into AI/ML — who should I talk to?",
  "Can you help me find someone for a mock interview?",
  "I need resume feedback for a software engineering role",
  "Who can guide me about getting into top grad schools?",
  "I'm interested in fintech — any alumni from that space?",
];

const AIChat = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your REConnect AI Career Advisor.\n\nI can help you find the right alumni mentor, prepare for sessions, or just chat about your career goals.\n\nWhat are you looking to work on today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      // Try SSE streaming first
      const res = await fetch(`${API}/api/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          student_id: user.user_id,
          messages: newMessages,
        }),
      });

      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        // Stream the response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setMessages(prev => [
                  ...prev,
                  { role: "assistant", content: accumulated },
                ]);
                setStreamingText("");
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setStreamingText(accumulated);
                }
              } catch {}
            }
          }
        }
      } else {
        // Fallback: JSON response
        const data = await res.json();
        const reply = data.reply || "I couldn't generate a response right now.";
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        setStreamingText("");
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
      setStreamingText("");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (text) => {
    // Simple markdown-ish formatting
    return text
      .split("\n")
      .map((line, i) => (
        <span key={i}>
          {line}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      ));
  };

  return (
    <div className="page" style={{ maxWidth: 800, padding: "24px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>🤖</span>
          AI Career Advisor
        </h2>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          Ask me anything about your career journey
        </p>
      </div>

      {/* Chat window */}
      <div style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 280px)",
        minHeight: 400,
      }}>
        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animation: "fadeUp 0.3s ease",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #667eea, #764ba2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  marginRight: 10,
                  flexShrink: 0,
                  marginTop: 2,
                }}>🤖</div>
              )}
              <div style={{
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, #667eea, #764ba2)"
                  : "rgba(255,255,255,0.1)",
                fontSize: 14,
                lineHeight: 1.6,
                color: "#fff",
              }}>
                {formatMessage(msg.content)}
              </div>
              {msg.role === "user" && (
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  marginLeft: 10,
                  flexShrink: 0,
                  marginTop: 2,
                }}>👤</div>
              )}
            </div>
          ))}

          {/* Streaming bubble */}
          {streamingText && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 2,
              }}>🤖</div>
              <div style={{
                maxWidth: "75%", padding: "12px 16px",
                borderRadius: "18px 18px 18px 4px",
                background: "rgba(255,255,255,0.1)",
                fontSize: 14, lineHeight: 1.6, color: "#fff",
              }}>
                {formatMessage(streamingText)}
                <span style={{
                  display: "inline-block",
                  width: 8, height: 14,
                  background: "#667eea",
                  borderRadius: 2,
                  marginLeft: 2,
                  animation: "blink 0.8s infinite",
                }} />
              </div>
            </div>
          )}

          {/* Loading dots */}
          {loading && !streamingText && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, marginRight: 10, flexShrink: 0,
              }}>🤖</div>
              <div style={{
                padding: "14px 18px",
                borderRadius: "18px 18px 18px 4px",
                background: "rgba(255,255,255,0.1)",
                display: "flex", gap: 6, alignItems: "center",
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#667eea",
                    animation: `bounce 1.2s ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions (show only at start) */}
        {messages.length <= 1 && (
          <div style={{
            padding: "0 20px 12px",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  background: "rgba(102,126,234,0.15)",
                  border: "1px solid rgba(102,126,234,0.4)",
                  color: "#93c5fd",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.target.style.background = "rgba(102,126,234,0.3)"}
                onMouseLeave={e => e.target.style.background = "rgba(102,126,234,0.15)"}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about career paths, alumni, interview prep..."
            rows={1}
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: "12px 16px",
              color: "#fff",
              fontSize: 14,
              resize: "none",
              outline: "none",
              fontFamily: "Poppins, sans-serif",
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim()
                ? "rgba(102,126,234,0.3)"
                : "linear-gradient(135deg, #667eea, #764ba2)",
              border: "none",
              borderRadius: 14,
              width: 44,
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: 18,
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >
            {loading ? "⌛" : "➤"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(102,126,234,0.4); border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default AIChat;
