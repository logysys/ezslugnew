import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageCircle, Send, X } from "lucide-react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! I’m your support assistant. How can I help you today?" }
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { from: "user", text: message };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("/techchatbot/chatbot", {
        message: userMsg.text,
      });

      let reply = "";

      if (res.data.type === "faq") {
        reply = `📘 ${res.data.answer}`;
      } else if (res.data.type === "domain_transfer") {
        reply = `🌐 *${res.data.provider} Domain Transfer*\n\n${res.data.steps}`;
        if (res.data.support_url) {
          reply += `\n\n🔗 Support: ${res.data.support_url}`;
        }
      } else {
        reply = "❓ Sorry, I couldn’t find an answer. Please contact support.";
      }

      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { from: "bot", text: "⚠️ Server error. Please try again." }]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-36 z-5000 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-5000 w-96 h-[520px] bg-zinc-900 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800">
            <div>
              <h3 className="font-semibold">🤖 EZ.wiki Assistant</h3>
              <p className="text-xs text-zinc-400">FAQ & Domain Support</p>
            </div>
            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-4 py-2 rounded-xl text-sm whitespace-pre-line ${
                  msg.from === "user"
                    ? "ml-auto bg-indigo-600"
                    : "mr-auto bg-zinc-700"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-zinc-400">⌛ Typing...</div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-zinc-800 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-indigo-600 p-2 rounded-lg hover:bg-indigo-500"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
