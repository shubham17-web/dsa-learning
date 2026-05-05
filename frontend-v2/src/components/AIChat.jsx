import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/api';
import { Send, User, Bot, Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIChat = ({ context, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hello! I'm your DSA assistant. Need a hint or an explanation for this problem?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.chat(userMsg, messages.map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content
      })));
      
      setMessages(prev => [...prev, { role: 'bot', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-card shadow-2xl overflow-hidden rounded-l-3xl border-l border-slate-200 dark:border-dark-border">
      <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-primary-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <div className="flex flex-col">
            <span className="font-bold text-sm">AI Tutor</span>
            <span className="text-[10px] opacity-80 uppercase tracking-widest font-bold">DSA Specialist</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
            }`}>
              <div className={`prose prose-sm dark:prose-invert max-w-none ${msg.role === 'user' ? 'text-white prose-headings:text-white prose-strong:text-white' : ''}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white dark:bg-dark-card border-t border-slate-100 dark:border-dark-border">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a hint or explanation..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-5 pr-14 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
          Focused on C++ & DSA logic. Hints only, no direct solutions.
        </p>
      </form>
    </div>
  );
};

export default AIChat;
