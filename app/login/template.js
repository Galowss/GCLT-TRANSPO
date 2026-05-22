export default function LoginTemplate({ children }) {
  return (
    <>
      <style>{`
        @keyframes loginPageEnter {
          from {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        .login-page-transition {
          animation: loginPageEnter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
      `}</style>
      <div className="login-page-transition">{children}</div>
    </>
  );
}
