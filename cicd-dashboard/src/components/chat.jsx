import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const LLM_URL = import.meta.env.VITE_LLM_URL || "https://disc-somebody-chess-intelligence.trycloudflare.com";
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "llama3";
const CHAT_PATH = import.meta.env.VITE_LLM_CHAT_PATH || "/api/chat";

const AI_AGENT_SYSTEM_PROMPT = `You are the aUToronto AI Agent, an assistant for the aUToronto autonomous vehicle simulation team at the University of Toronto.

**Repository context:** This dashboard monitors a GitLab CI/CD pipeline for an autonomous driving simulation repository. Pipelines run simulation scenarios to validate the vehicle's control stack (path planning, localization, steering, acceleration, torque).

**Simulation scenarios:** Each pipeline runs multiple scenarios (e.g., double lane change, north circle, localization challenge course). Scenarios are evaluated on:
- General metrics: collision count, traffic sign behaviour, destination reached, path length, completion time
- Control metrics: max solve time, torque, steer, acceleration

**Branches:** Common branches include master, r2y5_simulation, r2y5-sim-cicd, autopath, simulation-CICD.

Answer questions about pipelines, simulation results, failures, and metrics in a concise, technical way. If the user asks about a specific pipeline and you don't have its data, say so and suggest they use the triage feature on the Individual Pipelines tab.`;

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToLLM = async (userMsg, systemPrompt) => {
    const displayMsg = { role: 'user', content: userMsg.content };
    setMessages(prev => [...prev, displayMsg]);
    setIsTyping(true);

    const apiUserMsg = { role: 'user', content: userMsg._apiContent ?? userMsg.content };
    const apiMessages = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages, apiUserMsg]
      : [...messages, apiUserMsg];

    try {
      const base = LLM_URL.replace(/\/$/, "");
      const chatUrl = base.includes("/api/") ? base : `${base}${CHAT_PATH.startsWith("/") ? "" : "/"}${CHAT_PATH}`;
      const res = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: apiMessages,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error('Server unreachable');

      const data = await res.json();
      // Ollama returns { message: { role, content } }
      const assistantMsg = data.message
        ? { role: 'assistant', content: data.message.content }
        : data;
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "⚠️ Error: I couldn't connect to the backend server. Make sure 'node src/data/chatgpt.js' is running." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setInput('');
    sendToLLM(userMsg, AI_AGENT_SYSTEM_PROMPT);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-gray-200 shadow-sm mt-8 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <Bot size={20} className="text-blue-600" />
          <span>aUToronto AI Agent</span>
        </div>
        <button 
          onClick={() => setMessages([])} 
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Clear Chat"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            <Bot size={48} className="mx-auto mb-2 opacity-20" />
            <p>Ask me about the CI/CD pipeline or simulation results.</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                {m.role === 'user' ? <User size={16} className="text-blue-600" /> : <Bot size={16} className="text-gray-600" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm [&_strong]:font-semibold [&_code]:bg-black/10 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-black/10 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
              }`}>
                {m.role === 'assistant' ? (
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                ) : (
                  m.content
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start items-center gap-2 text-gray-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            AI is analyzing...
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 flex gap-2">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
        />
        <button 
          onClick={handleSend} 
          disabled={isTyping}
          className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}