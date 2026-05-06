'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';

const initialMessages = [
  {
    id: 'ai-001',
    sender: 'assistant',
    message: "Hello! I'm your GCLT Assistant. How can I help you today? I have live traffic and availability updates for the SBMA and Olongapo region.",
    time: '12:00 AM',
  },
];

const suggestions = ['SBMA Availability', 'Rates to Olongapo', 'Track Booking'];

export default function AIAssistant() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      message: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

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
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.message }],
          })),
        }),
      });

      const data = await res.json();
      const botResponse = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        message: data.reply || 'I apologize, I could not process that request.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch {
      setMessages(prev => [...prev, {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        message: 'Sorry, I\'m having trouble connecting. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage();
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', maxWidth: '800px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1>AI Assistant</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Chat with GCLT&apos;s AI-powered logistics assistant for real-time support.
          </p>
        </div>

        {/* Chat Window */}
        <div style={{ flex: 1, background: 'var(--white)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--gray-200)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)' }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem' }}>GCLT Assistant</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Online</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
                <div style={{
                  maxWidth: '70%', padding: '12px 16px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'var(--primary)' : 'var(--gray-100)',
                  color: msg.sender === 'user' ? 'var(--white)' : 'var(--text-primary)',
                  fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-line',
                }}>
                  {msg.message}
                  <div style={{ fontSize: '0.7rem', marginTop: '6px', opacity: 0.6, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--gray-100)', fontSize: '0.875rem', opacity: 0.6 }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          <div style={{ padding: '8px 20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} className="chatbot-suggestion">
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about SBMA routes..."
              disabled={loading}
              style={{ flex: 1, padding: '10px 16px', border: '1.5px solid var(--gray-300)', borderRadius: '100px', fontSize: '0.875rem' }}
            />
            <button type="submit" disabled={loading} className="chatbot-send">
              <Send size={16} />
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
          GCLT LOGISTICS MANAGEMENT SYSTEM - SERVING SBMA & OLONGAPO SINCE 1998
        </div>
      </div>
    </DashboardLayout>
  );
}
