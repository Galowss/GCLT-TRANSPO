export default function DashboardTemplate({ children }) {
  return (
    <>
      <style>{`
        @keyframes dashEnter {
          0%   { opacity: 0; transform: translateY(36px) scale(0.97); filter: blur(4px); }
          60%  { opacity: 1; filter: blur(0); }
          80%  { transform: translateY(-4px) scale(1.005); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        @keyframes dashGlow {
          0%   { box-shadow: none; }
          40%  { box-shadow: 0 0 0 2px rgba(0,109,55,0.18), 0 8px 40px rgba(0,109,55,0.10); }
          100% { box-shadow: none; }
        }

        .dash-transition {
          animation:
            dashEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both,
            dashGlow  0.9s ease 0.3s both;
          will-change: transform, opacity, filter;
        }

        /* Stagger direct children of the layout */
        .dash-transition > * {
          animation: dashEnter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .dash-transition > *:nth-child(2) { animation-delay: 0.06s; }
        .dash-transition > *:nth-child(3) { animation-delay: 0.12s; }
        .dash-transition > *:nth-child(4) { animation-delay: 0.18s; }
      `}</style>
      <div className="dash-transition">{children}</div>
    </>
  );
}
