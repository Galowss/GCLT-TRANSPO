'use client';

import { useState, useEffect } from 'react';
import { X, FileText, ShieldCheck, Check } from 'lucide-react';
import { LEGAL_DOCS } from '@/lib/legalContent';

export default function LegalDocsModal({ open, onClose, onAgree }) {
  const [tab, setTab] = useState('terms');

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const doc = LEGAL_DOCS[tab];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,22,14,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: '760px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
          padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid #bec9be',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #ebefe8', background: '#f6fbf3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e3f2e8', color: '#00522c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tab === 'terms' ? <FileText size={18} /> : <ShieldCheck size={18} />}
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#181d19' }}>{doc.title}</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#6f7a70' }}>{doc.lastUpdated}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6f7a70', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            {(['terms', 'privacy']).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="btn btn-sm"
                style={{
                  padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  background: tab === key ? 'var(--primary, #00522c)' : '#fff',
                  color: tab === key ? '#fff' : '#3f4941',
                  border: `1.5px solid ${tab === key ? 'var(--primary, #00522c)' : '#bec9be'}`,
                  borderRadius: '100px',
                }}
              >
                {key === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#fff', fontSize: '0.85rem', color: '#3f4941', lineHeight: 1.65 }}>
          <p style={{ padding: '10px 14px', background: '#f6fbf3', borderLeft: '4px solid #00522c', borderRadius: '6px', color: '#3f4941', fontSize: '0.8rem' }}>
            {doc.intro}
          </p>
          {doc.sections.map((section) => (
            <section key={section.heading} style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#181d19', margin: '0 0 6px' }}>{section.heading}</h4>
              {section.paragraphs.map((p, i) => (
                <p key={i} style={{ margin: '0 0 4px' }}>{p}</p>
              ))}
              {section.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                  {section.bullets.map((b, i) => (
                    <li key={i} style={{ marginBottom: '3px' }}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #ebefe8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#fafcfa' }}>
          <span style={{ fontSize: '0.75rem', color: '#6f7a70' }}>
            Registration requires agreement to both documents.
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              onClick={() => {
                onAgree?.();
                onClose();
              }}
            >
              <Check size={15} /> I Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}