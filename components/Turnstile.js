'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function Turnstile({ siteKey, onSuccess, onError, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onError, onExpire });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onExpire };
  });

  useEffect(() => {
    let active = true;

    const renderWidget = () => {
      if (!active) return;
      
      if (window.turnstile && containerRef.current && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: 'light',
            callback: (token) => {
              if (active && callbacksRef.current.onSuccess) callbacksRef.current.onSuccess(token);
            },
            'error-callback': (err) => {
              if (active && callbacksRef.current.onError) callbacksRef.current.onError(err);
            },
            'expired-callback': () => {
              if (active && callbacksRef.current.onExpire) callbacksRef.current.onExpire();
            },
          });
        } catch (error) {
          console.error('[Turnstile] Render failed:', error);
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Check every 100ms if script is loaded
      const interval = setInterval(() => {
        if (window.turnstile) {
          renderWidget();
          clearInterval(interval);
        }
      }, 100);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }

    return () => {
      active = false;
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          console.error('[Turnstile] Cleanup error:', e);
        }
        widgetIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '16px 0' }}>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="cf-turnstile" />
    </div>
  );
}
