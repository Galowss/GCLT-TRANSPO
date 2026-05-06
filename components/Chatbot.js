'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const suggestions = [
  'How do I book a truck?',
  'What trucks are for sale?',
  'Payment methods',
  'Service areas',
  'Schedule a viewing',
  'Track my booking',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hello! I\'m the GCLT Assistant. How can I help you today? I can answer questions about truck bookings, fleet sales, pricing, and more.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;

    const userMsg = { id: 'u-' + Date.now(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-6).map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          })),
        }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        { id: 'b-' + Date.now(), role: 'bot', text: data.reply || 'I apologize, I could not process that request.' },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: 'b-' + Date.now(), role: 'bot', text: 'Sorry, I\'m having trouble connecting. Please try again.' },
      ]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <MessageCircle size={18} />
              </div>
              <div className="chatbot-header-text">
                <strong>GCLT Assistant</strong>
                <span>Online</span>
              </div>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chatbot-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg bot" style={{ opacity: 0.6 }}>Typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-suggestions">
            {suggestions.map(s => (
              <button key={s} className="chatbot-suggestion" onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
            />
            <button type="submit" className="chatbot-send" disabled={loading} aria-label="Send">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button className="chatbot-toggle" onClick={() => setOpen(!open)} aria-label="Open chat">
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </>
  );
}
