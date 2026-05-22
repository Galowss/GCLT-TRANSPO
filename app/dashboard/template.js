export default function DashboardTemplate({ children }) {
  return (
    <>
      <style>{`
        @keyframes dashboardPageEnter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dashboard-page-transition {
          animation: dashboardPageEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }
      `}</style>
      <div className="dashboard-page-transition">{children}</div>
    </>
  );
}
