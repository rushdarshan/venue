import type { IntegrationFeature } from '../integrations/google';

interface Props {
  integrations: IntegrationFeature[];
}

export default function IntegrationStatusCard({ integrations }: Props) {
  return (
    <section className="card" style={{ marginTop: 24 }} data-testid="integration-card" aria-label="Google integrations">
      <h2 className="sec-lbl">Google Services Integration Status</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {integrations.map((item) => (
          <article
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg1)',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid var(--brd)',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#f8fafc' }}>{item.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.reason}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {item.actionUrl && (
                <a href={item.actionUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60a5fa' }}>
                  {item.actionText}
                </a>
              )}
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {item.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
