import dynamic from 'next/dynamic';

const LeafletInlineMap = dynamic(() => import('./LeafletInlineMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', minHeight: '480px',
      background: 'var(--panel-muted)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: 'var(--ink-muted)',
    }}>
      Loading map…
    </div>
  ),
});

export default LeafletInlineMap;
