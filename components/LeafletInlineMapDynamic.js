import dynamic from 'next/dynamic';

const LeafletInlineMap = dynamic(() => import('./LeafletInlineMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', minHeight: '480px',
      background: '#e8f0e9',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#6f7a70',
    }}>
      Loading map…
    </div>
  ),
});

export default LeafletInlineMap;
