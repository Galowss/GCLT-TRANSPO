import dynamic from 'next/dynamic';

// Leaflet requires browser APIs (window, document) — disable SSR entirely.
const LeafletMapModal = dynamic(() => import('./LeafletMapModal'), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px 60px',
        fontFamily: 'Inter, sans-serif', color: '#3f4941', fontSize: '0.875rem',
      }}>
        Loading map…
      </div>
    </div>
  ),
});

export default LeafletMapModal;
