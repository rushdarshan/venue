import { useState, useEffect, useCallback, useMemo } from 'react';
import { getGoogleIntegrations } from './integrations/google';

// ─── Types (Code Quality) ─────────────────────────────────────────────────────
interface Camera {
  id: string;
  name: string;
  zone: string;
  status: 'crit' | 'warn' | 'ok';
  density: number;
  persons: number;
  vel: string;
}

interface Alert {
  id: number;
  type: 'crit' | 'warn' | 'info';
  title: string;
  body: string;
  timestamp: string;
}

interface Incident {
  id: string;
  type: string;
  loc: string;
  status: 'New' | 'In Progress' | 'Resolved';
  assign: string;
  time: string;
}

interface QueueItem {
  name: string;
  ico: string;
  pct: number;
  wait: string;
  col: string;
  tip: string;
}

interface VenueConfig {
  name: string;
  event: string;
  capacity: number;
  reg: number;
  walkin: number;
}

type PageId = 'overview' | 'crowd' | 'incidents' | 'whatif' | 'egress';

// ─── Security: Input sanitization ─────────────────────────────────────────────
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .slice(0, 500);
}

// ─── Google Services: Gemini AI Integration ───────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCQSV_mXBlfQydZK2bp7kbki4mkrhLTyzU';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGeminiAPI(prompt: string, context: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return getLocalFallback(prompt);
  }
  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are VenueIQ, an AI stadium operations assistant. Context: ${context}\n\nUser: ${prompt}\n\nRespond concisely (under 80 words).` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 150 }
      })
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || getLocalFallback(prompt);
  } catch {
    return getLocalFallback(prompt);
  }
}

function getLocalFallback(txt: string): string {
  const ml = txt.toLowerCase();
  if (ml.includes('food') || ml.includes('queue')) return 'Gate B Concessions: 2 min wait (recommended). Gate A: 13 min wait.';
  if (ml.includes('seat') || ml.includes('route')) return 'ETA 4 min to N-Block via West Elevator (0 min queue).';
  if (ml.includes('north') || ml.includes('crowd')) return 'North Stand: CRITICAL (91%). Rerouting to East Stand (38%).';
  if (ml.includes('exit') || ml.includes('leave')) return 'Your section (Wave 3) exits via Gate D in ~10 min. Avoid North concourse.';
  if (ml.includes('restroom') || ml.includes('toilet')) return 'Nearest restroom: Block W2, 0 min wait. 45m west of your seat.';
  return 'Live conditions nominal across South/East sectors. North Stand requires caution.';
}

// ─── Decision Engine (Efficiency: deterministic rules) ────────────────────────
function evaluateDecisions(cameras: Camera[]): string[] {
  const decisions: string[] = [];
  cameras.forEach(cam => {
    if (cam.density > 90) decisions.push(`CRITICAL: ${cam.zone} at ${cam.density}%. Restrict inflow immediately.`);
    else if (cam.density > 80) decisions.push(`WARNING: ${cam.zone} trending high (${cam.density}%). Monitor closely.`);
  });
  return decisions;
}

const STATUS_COLORS: Record<string, string> = { crit: '#ef4444', warn: '#f59e0b', ok: '#22c55e', info: '#378add' };

// ─── Integration UI Component ──────────────────────────────────────────────────
function IntegrationStatusCard() {
  const integrations = useMemo(() => getGoogleIntegrations(GEMINI_API_KEY), []);
  return (
    <div className="card" style={{ marginTop: 24 }} data-testid="integration-card">
      <h2 className="sec-lbl">Google Services Integration Status</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {integrations.map(int => (
          <div key={int.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg1)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--brd)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#f8fafc' }}>{int.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{int.reason}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {int.actionUrl && (
                <a href={int.actionUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none' }}>
                  {int.actionText} ↗
                </a>
              )}
              <span style={{ 
                fontSize: 10, padding: '2px 8px', borderRadius: 12, fontWeight: 700, textTransform: 'uppercase',
                background: int.status === 'connected' ? '#166534' : int.status === 'fallback' ? '#854d0e' : '#7f1d1d',
                color: int.status === 'connected' ? '#4ade80' : int.status === 'fallback' ? '#fde047' : '#fca5a5'
              }}>
                {int.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [time, setTime] = useState('');
  const [incidentCount, setIncidentCount] = useState(1);
  const [arrBase, setArrBase] = useState(67842);
  const [rerBase, setRerBase] = useState(1247);

  const [venueConfig] = useState<VenueConfig>({
    name: 'Grand Sports Arena', event: 'IPL Final · Match Day', capacity: 80000, reg: 72450, walkin: 4200
  });

  const [cameras, setCameras] = useState<Camera[]>([
    { id: 'CAM-01', name: 'Gate A Entrance', zone: 'Gate Area', status: 'crit', density: 89, persons: 47, vel: 'High' },
    { id: 'CAM-02', name: 'North Stand Upper', zone: 'North Stand', status: 'crit', density: 91, persons: 63, vel: 'High' },
    { id: 'CAM-03', name: 'Food Court Central', zone: 'Food Court', status: 'warn', density: 82, persons: 38, vel: 'Medium' },
    { id: 'CAM-04', name: 'East Gate', zone: 'East Stand', status: 'ok', density: 38, persons: 18, vel: 'Low' },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, type: 'crit', title: 'North Stand — 91% density', body: 'Gemini surge alert: restrict Gate A. Rerouting to Gate D.', timestamp: new Date().toISOString() },
    { id: 2, type: 'warn', title: 'Food Court — surge predicted', body: '34% increase in 8 min. Open backup stalls B3–B6.', timestamp: new Date().toISOString() },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    { id: 'INC-092', type: 'Medical', loc: 'Gate B Concourse', status: 'In Progress', assign: 'QRT-Alpha', time: '2 mins ago' }
  ]);

  const [whatIfStr, setWhatIfStr] = useState<'Off' | '+5M' | '+10M'>('Off');
  const [mapLayers, setMapLayers] = useState({ hm: true, ai: true });
  const [zdpShow, setZdpShow] = useState(false);
  const [zdData, setZdData] = useState({ name: '', pct: '', ai: '' });

  const [adminInput, setAdminInput] = useState('');
  const [adminMsgs, setAdminMsgs] = useState([{ user: false, text: "Hi! I'm your VenueIQ assistant powered by Google Gemini. What do you need?" }]);

  const [attInput, setAttInput] = useState('');
  const [attMsgs, setAttMsgs] = useState([{ user: false, text: "Hi! I know your seat (N-Block) and venue conditions. How can I help?" }]);

  const [isLoading, setIsLoading] = useState(false);

  // ─── Memoized values (Efficiency) ────────────────────────────────
  const decisions = useMemo(() => evaluateDecisions(cameras), [cameras]);

  const queues = useMemo<QueueItem[]>(() => [
    { name: 'Gate A Concessions', ico: '🍔', pct: 91, wait: '13 min', col: '#ef4444', tip: 'Use Gate B' },
    { name: 'Gate B Concessions', ico: '🥤', pct: 28, wait: '2 min', col: '#22c55e', tip: 'Recommended' },
    { name: 'Restroom Block W2', ico: '🚻', pct: 22, wait: '0 min', col: '#22c55e', tip: 'Nearest' },
  ], []);

  const liveContext = useMemo(() => {
    return `Venue: ${venueConfig.name}, Event: ${venueConfig.event}, Arrived: ${arrBase}, Cameras: ${cameras.map(c => `${c.zone}:${c.density}%`).join(', ')}`;
  }, [venueConfig, arrBase, cameras]);

  // ─── Clock ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toTimeString().split(' ')[0]), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Simulation loop ────────────────────────────────────────────
  useEffect(() => {
    const sim = setInterval(() => {
      setArrBase(prev => prev + Math.floor(Math.random() * 4));
      setRerBase(prev => prev + Math.floor(Math.random() * 3));

      setCameras(prev => prev.map(c => {
        const delta = (Math.random() * 4) - 1.5;
        const newD = Math.min(99, Math.max(5, Math.round(c.density + delta)));
        let newStat: Camera['status'] = 'ok';
        if (newD > 85) newStat = 'crit';
        else if (newD > 60) newStat = 'warn';

        if (newStat === 'crit' && c.status !== 'crit') {
          setAlerts(old => [{
            id: Date.now(),
            type: 'crit' as const,
            title: `[AUTO] ${c.zone} spike to ${newD}%`,
            body: 'Recommending reroutes.',
            timestamp: new Date().toISOString()
          }, ...old].slice(0, 5));
        }
        return { ...c, density: newD, status: newStat, persons: Math.round(newD * 0.65) };
      }));
    }, 4000);
    return () => clearInterval(sim);
  }, []);

  // ─── Emergency trigger ──────────────────────────────────────────
  const triggerEm = useCallback((msg: string) => {
    setAlerts(old => [{
      id: Date.now(),
      type: 'warn' as const,
      title: 'Protocol activated',
      body: msg,
      timestamp: new Date().toISOString()
    }, ...old]);
    if (!msg.toLowerCase().includes('all clear')) setIncidentCount(i => i + 1);
    else setIncidentCount(0);
  }, []);

  // ─── Chat handler with Gemini ───────────────────────────────────
  const handleChat = useCallback(async (isAdminChat: boolean) => {
    const val = sanitizeInput(isAdminChat ? adminInput : attInput);
    if (!val.trim()) return;

    if (isAdminChat) {
      setAdminMsgs(p => [...p, { user: true, text: val }]);
      setAdminInput('');
    } else {
      setAttMsgs(p => [...p, { user: true, text: val }]);
      setAttInput('');
    }

    setIsLoading(true);
    const reply = await callGeminiAPI(val, liveContext);
    setIsLoading(false);

    if (isAdminChat) {
      setAdminMsgs(p => [...p, { user: false, text: reply }]);
    } else {
      setAttMsgs(p => [...p, { user: false, text: reply }]);
    }
  }, [adminInput, attInput, liveContext]);

  const toggleMapLayer = useCallback((layer: 'hm' | 'ai') => {
    setMapLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  // ─── Render helpers ─────────────────────────────────────────────
  const navItem = (id: PageId, lbl: string, col: string) => (
    <button
      role="tab"
      aria-selected={activePage === id}
      aria-controls={`panel-${id}`}
      className={`nv ${activePage === id ? 'active' : ''}`}
      onClick={() => setActivePage(id)}
      key={id}
    >
      <span className="nvd" style={{ background: col }} aria-hidden="true" />
      {lbl}
    </button>
  );

  return (
    <div className="app-root">
      {/* Skip link (Accessibility) */}
      <a href="#main-content" className="skip-link" style={{
        position: 'absolute', top: -40, left: 0, background: '#185fa5', color: 'white',
        padding: '8px 16px', zIndex: 1000, fontSize: 14
      }} onFocus={e => (e.target as HTMLElement).style.top = '0'}>
        Skip to main content
      </a>

      {/* Mode Bar */}
      <header className="mode-bar" role="banner">
        <div className="mode-logo">
          <div className="mode-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
          </div>
          VenueIQ
        </div>
        <div className="mode-toggle" role="tablist" aria-label="View mode">
          <button className={`mode-btn ${isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(true)} role="tab" aria-selected={isAdmin}>Ops Panel</button>
          <button className={`mode-btn ${!isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(false)} role="tab" aria-selected={!isAdmin}>Attendee</button>
        </div>
        <div className="mode-right" aria-live="polite">
          <div className="live-chip"><div className="livd" aria-hidden="true" /><span>Live</span></div>
          <time dateTime={new Date().toISOString()}>{time}</time>
        </div>
      </header>

      <main id="main-content">
        {isAdmin ? (
          <div id="admin-panel" role="region" aria-label="Operations Panel">
            <nav className="nav" role="tablist" aria-label="Admin navigation">
              {navItem('overview', 'Overview', '#4ade80')}
              {navItem('crowd', 'Crowd Routing', '#f59e0b')}
              {navItem('incidents', 'Incident Command', '#ef4444')}
              {navItem('whatif', 'What-If Forecast', '#a78bfa')}
              {navItem('egress', 'Egress Waves', '#378add')}
            </nav>

            <div style={{ padding: '0 24px' }}>
              {/* OVERVIEW */}
              {activePage === 'overview' && (
                <section className="page active" id="panel-overview" role="tabpanel" aria-label="Command Overview">
                  <h1 className="pg-title">Command Overview</h1>
                  <div className="grid4" style={{ marginBottom: 24 }}>
                    <article className="stat" aria-label="Expected visitors"><div className="sv" style={{ color: '#60a5fa' }}>{venueConfig.capacity.toLocaleString()}</div><div className="sl">Expected</div></article>
                    <article className="stat" aria-label="Arrived count"><div className="sv" style={{ color: '#4ade80' }}>{arrBase.toLocaleString()}</div><div className="sl">Arrived</div></article>
                    <article className="stat" aria-label="AI reroutes"><div className="sv" style={{ color: '#4ade80' }}>{rerBase.toLocaleString()}</div><div className="sl">AI Reroutes</div></article>
                    <article className="stat" aria-label="Active incidents"><div className="sv" style={{ color: incidentCount > 0 ? '#ef4444' : '#4ade80' }}>{incidentCount}</div><div className="sl">Incidents</div></article>
                  </div>
                  <div className="grid2">
                    <div className="card">
                      <h2 className="sec-lbl">Active Zones</h2>
                      {cameras.map(c => (
                        <div key={c.id} style={{ marginBottom: 11 }} role="meter" aria-valuenow={c.density} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.zone} density`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                            <span>{c.zone}</span><span style={{ color: STATUS_COLORS[c.status], fontWeight: 500 }}>{c.density}%</span>
                          </div>
                          <div style={{ background: 'var(--brd)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${c.density}%`, height: 5, borderRadius: 3, background: STATUS_COLORS[c.status], transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="card">
                      <h2 className="sec-lbl">AI Decision Feed</h2>
                      {decisions.length > 0 ? decisions.map((d, i) => (
                        <div key={i} className={`alcard ${d.startsWith('CRITICAL') ? 'al-crit' : 'al-warn'}`} role="alert">
                          <div className="alind" style={{ background: d.startsWith('CRITICAL') ? '#ef4444' : '#f59e0b' }} aria-hidden="true" />
                          <div><div className="al-t">{d}</div></div>
                        </div>
                      )) : <p style={{ color: '#4ade80', fontSize: 12 }}>All zones nominal.</p>}
                    </div>
                  </div>
                  {/* GOOGLE INTEGRATIONS STATUS */}
                  <IntegrationStatusCard />
                </section>
              )}

              {/* CROWD ROUTING */}
              {activePage === 'crowd' && (
                <section className="page active" id="panel-crowd" role="tabpanel" aria-label="Crowd Routing Map">
                  <h1 className="pg-title">Crowd-Aware Routing Map</h1>
                  <div style={{ background: 'var(--bg1)', border: '1px solid var(--brd)', borderRadius: 'var(--rad)', overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 8, padding: '11px 16px', borderBottom: '1px solid var(--brd)' }}>
                      <button className={`map-btn ${mapLayers.hm ? 'on' : ''}`} onClick={() => toggleMapLayer('hm')} aria-pressed={mapLayers.hm}>Heatmap</button>
                      <button className={`map-btn ${mapLayers.ai ? 'on' : ''}`} onClick={() => toggleMapLayer('ai')} aria-pressed={mapLayers.ai}>Auto-Reroute</button>
                    </div>
                    <svg width="100%" viewBox="0 0 700 360" role="img" aria-label="Stadium crowd density map" style={{ background: '#060a0f', display: 'block' }}>
                      <title>Stadium crowd density heatmap showing zone congestion levels</title>
                      <g opacity=".12" stroke="#1e2a3a" strokeWidth="1">
                        <line x1="0" y1="90" x2="700" y2="90" /><line x1="175" y1="0" x2="175" y2="360" />
                      </g>
                      {mapLayers.hm && (
                        <g><ellipse cx="350" cy="46" rx="155" ry="36" fill="#ef4444" opacity={cameras[1].density > 80 ? 0.3 : 0.1} /><ellipse cx="190" cy="190" rx="85" ry="65" fill="#f59e0b" opacity=".18" /></g>
                      )}
                      {mapLayers.ai && (
                        <g><rect x="264" y="18" width="96" height="17" rx="3" fill="#1a0808" stroke="#7f1d1d" strokeWidth="1" /><text x="270" y="30" fill="#f87171" fontSize="9" fontWeight="600">REROUTE {'>'} 85%</text></g>
                      )}
                      <rect x="195" y="96" width="310" height="178" rx="8" fill="#1a3a22" />
                      <rect x="210" y="108" width="280" height="154" rx="5" fill="none" stroke="#2d6b38" strokeWidth="1" />
                      <ellipse cx="350" cy="185" rx="40" ry="40" fill="none" stroke="#2d6b38" strokeWidth="1" />
                      <rect x="148" y="8" width="404" height="80" rx="8" fill="#ef4444" fillOpacity=".07" stroke="#ef4444" strokeWidth=".5" style={{ cursor: 'pointer' }}
                        onClick={() => { setZdpShow(true); setZdData({ name: 'North Stand', pct: `${cameras[1].density}%`, ai: 'Dijkstra weight increased (+400). Traffic forwarded to East Gate.' }); }}
                        role="button" aria-label="View North Stand details" tabIndex={0} />
                      <text x="350" y="36" fill="#ef4444" fontSize="12" fontWeight="600" textAnchor="middle">North Stand</text>
                    </svg>
                  </div>
                  {zdpShow && (
                    <div className="zdp show" role="region" aria-label="Zone details">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><h2 style={{ fontSize: 15, fontWeight: 600 }}>{zdData.name}</h2><p style={{ color: 'var(--t2)', fontSize: 12, marginTop: 4 }}>{zdData.ai}</p></div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{zdData.pct}</div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* INCIDENTS */}
              {activePage === 'incidents' && (
                <section className="page active" id="panel-incidents" role="tabpanel" aria-label="Incident Command">
                  <h1 className="pg-title">Incident Command Workflow</h1>
                  <div className="grid2">
                    <div>
                      <h2 className="sec-lbl">Active Incidents</h2>
                      {incidents.map(inc => (
                        <div key={inc.id} className="alcard al-warn" role="alert">
                          <div className="alind" style={{ background: '#f59e0b' }} aria-hidden="true" />
                          <div style={{ flex: 1 }}>
                            <div className="al-t">{inc.id} — {inc.type}</div>
                            <div className="al-b">{inc.loc} | Status: {inc.status}</div>
                            <div className="al-time">{inc.time} | Assigned: {inc.assign}</div>
                          </div>
                          <button className="ebtn eb-g" onClick={() => { setIncidents([]); setIncidentCount(0); }} style={{ padding: '4px 8px' }} aria-label={`Resolve incident ${inc.id}`}>Resolve</button>
                        </div>
                      ))}
                      {incidents.length === 0 && <p style={{ fontSize: 12, color: '#4ade80' }} role="status">All incidents resolved.</p>}
                    </div>
                    <div className="em-panel" style={{ height: 'fit-content' }}>
                      <h2 style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', marginBottom: 12 }}>Emergency Control</h2>
                      <div className="em-grid">
                        <button className="ebtn eb-r" onClick={() => triggerEm('PA Warning broadcast')} aria-label="Activate PA Warning">PA Warning</button>
                        <button className="ebtn eb-a" onClick={() => triggerEm('Gates opened — force redirect')} aria-label="Force flow redirect">Force Redirect</button>
                        <button className="ebtn eb-g" onClick={() => triggerEm('All Clear')} aria-label="Declare all clear">All Clear</button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* WHAT-IF */}
              {activePage === 'whatif' && (
                <section className="page active" id="panel-whatif" role="tabpanel" aria-label="What-If Forecast">
                  <h1 className="pg-title">What-If Forecasting</h1>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 20 }} role="group" aria-label="Forecast scenario selector">
                    <button className={`ebtn ${whatIfStr === 'Off' ? 'eb-b' : ''}`} onClick={() => setWhatIfStr('Off')} aria-pressed={whatIfStr === 'Off'}>Live Now</button>
                    <button className={`ebtn ${whatIfStr === '+5M' ? 'eb-b' : ''}`} onClick={() => setWhatIfStr('+5M')} aria-pressed={whatIfStr === '+5M'}>+5 Mins (Surge)</button>
                    <button className={`ebtn ${whatIfStr === '+10M' ? 'eb-b' : ''}`} onClick={() => setWhatIfStr('+10M')} aria-pressed={whatIfStr === '+10M'}>+10 Mins (Post-Match)</button>
                  </div>
                  <div className="grid3">
                    <article className="stat"><div className="sl" style={{ marginBottom: 4 }}>Food Court Prediction:</div><div className="sv" style={{ color: whatIfStr === 'Off' ? '#f59e0b' : '#ef4444' }}>{whatIfStr === 'Off' ? '82%' : whatIfStr === '+5M' ? '96%' : '91%'}</div><div className="ss">{whatIfStr === '+5M' ? 'Critical Surge. Action: Open B3-B6' : 'Monitored.'}</div></article>
                    <article className="stat"><div className="sl" style={{ marginBottom: 4 }}>Gate A Queues:</div><div className="sv" style={{ color: '#f59e0b' }}>{whatIfStr === '+10M' ? '24 min' : '13 min'}</div></article>
                    <article className="stat"><div className="sl" style={{ marginBottom: 4 }}>Gemini Recommendation:</div><div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 6 }}>{whatIfStr === '+5M' ? 'Pre-deploy QRT to Food Court.' : whatIfStr === '+10M' ? 'Prepare Egress Wave 1. Open Gates C, D.' : 'Sustain current routes.'}</div></article>
                  </div>
                </section>
              )}

              {/* EGRESS */}
              {activePage === 'egress' && (
                <section className="page active" id="panel-egress" role="tabpanel" aria-label="Egress Wave Control">
                  <h1 className="pg-title">Post-Match Egress Control</h1>
                  <div className="grid2">
                    <div className="card">
                      <h2 className="sec-lbl">Wave Scheduling</h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Wave 1: South & East Stands', status: 'Released', col: '#4ade80' },
                          { label: 'Wave 2: West Stand', status: 'Wait 5m', col: '#f59e0b' },
                          { label: 'Wave 3: North Stand', status: 'Congested', col: '#ef4444' },
                        ].map((w, i) => (
                          <div key={i} className="qrow" style={{ padding: 8 }} role="listitem">
                            <div className="qinfo">{w.label}</div>
                            <div style={{ color: w.col, fontWeight: 600 }}>{w.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card">
                      <h2 className="sec-lbl">Push Notifications</h2>
                      <button className="ebtn eb-b" style={{ width: '100%' }} aria-label="Broadcast wave 2 exit token">Broadcast Wave 2 Exit Token to Attendee App</button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div id="attendee-panel" role="region" aria-label="Attendee View">
            <div className="att-page">
              <header className="att-hero" style={{ padding: '20px 24px' }}>
                <div>
                  <h1 className="att-welcome">{venueConfig.name}</h1>
                  <p className="att-sub">{venueConfig.event} · Block N · Section 12</p>
                </div>
              </header>

              <div className="att-status-grid" style={{ padding: '16px 24px' }}>
                <article className="att-stat" aria-label="Nearest exit time"><div className="att-stat-val" style={{ color: '#4ade80' }}>2 min</div><div className="att-stat-lbl">Nearest Exit</div></article>
                <article className="att-stat" aria-label="Egress wave group"><div className="att-stat-val" style={{ color: '#f59e0b' }}>Wave 3</div><div className="att-stat-lbl">Egress Group</div></article>
              </div>

              <div style={{ padding: '16px 20px 0' }}>
                <div className="att-alert-banner al-warn" role="alert">
                  <div className="alind" style={{ background: '#f59e0b', marginTop: 3 }} aria-hidden="true" />
                  <div>
                    <div className="al-t" style={{ fontSize: 12 }}>Egress Notice: Wait at seat</div>
                    <div className="al-b" style={{ fontSize: 11 }}>Your section (Wave 3) will be cleared to exit in ~10 mins via Gate D.</div>
                  </div>
                </div>
              </div>

              <section className="att-section" style={{ padding: '16px 24px' }} aria-label="Exit route">
                <h2 className="att-sec-title">Crowd-Aware Exit Route</h2>
                <div className="att-route-card">
                  <div className="att-step"><div className="att-step-dot" style={{ background: '#4ade80' }} aria-hidden="true" /><div><p style={{ fontSize: 13, color: '#e2e8f0' }}>Wait for Wave 3 Alert</p></div></div>
                  <div className="att-step"><div className="att-step-dot" style={{ background: '#60a5fa' }} aria-hidden="true" /><div><p style={{ fontSize: 13, color: '#e2e8f0' }}>Take West Concourse (Avoid North)</p></div></div>
                  <div className="att-step"><div className="att-step-dot" style={{ background: '#a78bfa' }} aria-hidden="true" /><div><p style={{ fontSize: 13, color: '#e2e8f0' }}>Exit via Gate D</p></div></div>
                </div>
              </section>

              <section className="att-section" style={{ padding: '16px 24px' }} aria-label="AI assistant">
                <h2 className="att-sec-title">Ask VenueIQ (Powered by Gemini)</h2>
                <div className="chat-outer" style={{ maxWidth: '100%' }}>
                  <div className="chat-msgs" style={{ height: 200 }} role="log" aria-live="polite">
                    {attMsgs.map((m, i) => (
                      <div key={i} className={m.user ? 'msg-u' : 'msg-a'}>
                        <div className={`bub ${m.user ? 'bub-u' : 'bub-a'}`}>{m.text}</div>
                      </div>
                    ))}
                    {isLoading && <div className="msg-a"><div className="bub bub-a">Thinking...</div></div>}
                  </div>
                  <div className="cinp-row" style={{ padding: 8 }}>
                    <label htmlFor="att-chat-input" className="sr-only">Chat input</label>
                    <input id="att-chat-input" className="cinp" value={attInput} onChange={e => setAttInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat(false)} placeholder="Ask about food, exits, restrooms..." aria-label="Chat with VenueIQ assistant" />
                    <button className="csend" onClick={() => handleChat(false)} disabled={isLoading} aria-label="Send message">Send</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
