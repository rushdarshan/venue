import React, { useState, useEffect } from 'react';

const scols: Record<string, string> = { crit: '#ef4444', warn: '#f59e0b', ok: '#22c55e' };

export default function App() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [time, setTime] = useState('');
  const [incidentCount, setIncidentCount] = useState(0);

  const [arrBase, setArrBase] = useState(67842);
  const [rerBase, setRerBase] = useState(1247);

  const [venueConfig, setVenueConfig] = useState({
    name: 'Grand Sports Arena', event: 'IPL Final · Match Day', capacity: 80000, reg: 72450, walkin: 4200
  });

  const [cameras, setCameras] = useState([
    {id:'CAM-01',name:'Gate A — Main Entrance',zone:'Gate Area',status:'crit',density:89,persons:47,vel:'High',surge:'SURGE',ai:'Restrict incoming flow. Reroute.'},
    {id:'CAM-02',name:'North Stand Upper',zone:'North Stand',status:'crit',density:91,persons:63,vel:'High',surge:'CRITICAL',ai:'Surge detected.'},
    {id:'CAM-03',name:'Food Court Central',zone:'Food Court',status:'warn',density:82,persons:38,vel:'Medium',surge:'HIGH',ai:'Half-time surge imminent.'},
    {id:'CAM-04',name:'East Gate Entrance',zone:'East Stand',status:'ok',density:38,persons:18,vel:'Low',surge:'NORMAL',ai:'Clear. Accepting overflow.'},
  ]);
  const [selCam, setSelCam] = useState<number | null>(null);

  const [alerts, setAlerts] = useState([
    {type:'crit',title:'North Stand — 91% density',body:'Gemini surge alert: restrict Gate A incoming flow. Rerouting.'},
    {type:'warn',title:'Food Court — half-time surge predicted',body:'34% increase expected in 8 min. Open backup stalls.'},
  ]);

  const [mapLayers, setMapLayers] = useState({hm:true, ai:true, flow:false, zones:false});
  const [zdpShow, setZdpShow] = useState(false);
  const [zdData, setZdData] = useState<any>({});

  const toggleMapLayer = (layer: keyof typeof mapLayers) => {
    setMapLayers(prev => ({...prev, [layer]: !prev[layer]}));
  };

  const [adminInput, setAdminInput] = useState('');
  const [adminMsgs, setAdminMsgs] = useState([
    {user: false, text: "Hi! I'm your VenueIQ assistant powered by Gemini. I have real-time data on every zone, gate, queue, and route. What do you need?"}
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toTimeString().split(' ')[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sim loop
  useEffect(() => {
    const sim = setInterval(() => {
      setArrBase(prev => prev + Math.floor(Math.random()*4));
      setRerBase(prev => prev + Math.floor(Math.random()*3));

      setCameras(prevCams => prevCams.map(c => {
        const delta = (Math.random() * 4) - 1.5;
        const newD = Math.min(99, Math.max(5, Math.round(c.density + delta)));
        let newStat = 'ok';
        if(newD > 85) newStat = 'crit';
        else if(newD > 60) newStat = 'warn';
        
        // Auto-alert on critical if not already alerted
        if (newStat === 'crit' && c.status !== 'crit') {
          setAlerts(old => [{
            type: 'crit',
            title: `[AUTO] ${c.zone} spike to ${newD}%`,
            body: `Density passed critical threshold. Recommending immediate reroutes.`
          }, ...old].slice(0, 5));
        }

        return {...c, density: newD, status: newStat, persons: Math.round(newD * 0.65)};
      }));
    }, 4000);
    return () => clearInterval(sim);
  }, []);

  const triggerEm = (msg: string) => {
    setAlerts(old => [{ type: 'warn', title: 'Protocol activated', body: msg }, ...old]);
    if (!msg.toLowerCase().includes('all clear')) {
      setIncidentCount(i => i + 1);
    } else {
      setIncidentCount(0);
    }
  };

  const navItem = (id: string, lbl: string, col: string) => (
    <div className={`nv ${activePage === id ? 'active' : ''}`} onClick={() => setActivePage(id)}>
      <div className="nvd" style={{background: col}}></div>{lbl}
    </div>
  );

  return (
    <>
      <div className="mode-bar">
        <div className="mode-logo">
          <div className="mode-logo-mark"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
          VenueIQ
        </div>
        <div className="mode-toggle">
          <button className={`mode-btn ${isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(true)}>Admin / Ops Panel</button>
          <button className={`mode-btn ${!isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(false)}>Attendee View</button>
        </div>
        <div className="mode-right">
          <div className="live-chip"><div className="livd"></div>System Live</div>
          <span>{time || '--:--:--'}</span>
        </div>
      </div>

      {isAdmin ? (
        <div id="admin-panel">
          <div className="topbar">
            <div className="t-logo">
              <span>{venueConfig.name}</span>
              <span className="venue-name">· {venueConfig.event}</span>
            </div>
            <div className="t-meta">
              <span>Expected <b>{venueConfig.capacity.toLocaleString()}</b></span>
              <span>Registered <b>{venueConfig.reg.toLocaleString()}</b></span>
              <span>Arrived <b style={{color:'#4ade80'}}>{arrBase.toLocaleString()}</b></span>
              <span>Cameras <b style={{color:'#4ade80'}}>{cameras.length} live</b></span>
              <span style={{color:'#4ade80'}}>{time}</span>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div className="em-btn-top" onClick={() => setActivePage('alerts')}>⚠ Emergency</div>
            </div>
          </div>

          <div className="nav">
            {navItem('overview', 'Overview', '#4ade80')}
            {navItem('crowd', 'Crowd Map', '#f59e0b')}
            {navItem('alerts', 'Alerts & Coordination', '#ef4444')}
          </div>

          {activePage === 'overview' && (
            <div className="page active">
              <div className="pg-title">Command Overview</div>
              <div className="pg-sub">Real-time venue intelligence — visitor flow, crowd density, and coordination status</div>
              
              <div className="grid4" style={{marginBottom: 24}}>
                <div className="stat"><div className="sv" style={{color:'#60a5fa'}}>{venueConfig.capacity.toLocaleString()}</div><div className="sl">Expected visitors</div></div>
                <div className="stat"><div className="sv" style={{color:'#4ade80'}}>{arrBase.toLocaleString()}</div><div className="sl">Arrived (checked in)</div></div>
                <div className="stat"><div className="sv" style={{color:'#4ade80'}}>{rerBase.toLocaleString()}</div><div className="sl">AI reroutes issued</div></div>
                <div className="stat"><div className="sv" style={{color: incidentCount > 0 ? '#ef4444' : '#4ade80'}}>{incidentCount}</div><div className="sl">Emergency incidents</div></div>
              </div>

              <div className="grid2">
                 <div className="card">
                    <div className="sec-lbl">Active Zones</div>
                    {cameras.map(c => (
                       <div key={c.id} style={{marginBottom:11}}>
                           <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                             <span style={{color:'#e2e8f0'}}>{c.zone}</span><span style={{color: scols[c.status], fontWeight:500}}>{c.density}%</span>
                           </div>
                           <div style={{background:'var(--brd)',borderRadius:3,height:5,overflow:'hidden'}}>
                             <div style={{width: `${c.density}%`, height:5, borderRadius:3, background:scols[c.status], transition: 'width 0.4s ease-in-out'}}></div>
                           </div>
                       </div>
                    ))}
                 </div>
                 <div className="card">
                    <div className="sec-lbl">Alerts</div>
                    {alerts.slice(0, 3).map((a, i) => (
                      <div key={i} className={`alcard al-${a.type}`}>
                        <div className="alind" style={{background: scols[a.type] || '#60a5fa'}}></div>
                        <div>
                          <div className="al-t">{a.title}</div>
                          <div className="al-b">{a.body}</div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          )}

          {activePage === 'crowd' && (
             <div className="page active">
                <div className="pg-title">Crowd Movement Map</div>
                <div className="pg-sub">AI heatmap with zone details</div>

                <div style={{background:'var(--bg1)', border:'1px solid var(--brd)', borderRadius:'var(--rad)', overflow:'hidden', marginBottom:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'11px 16px',borderBottom:'1px solid var(--brd)'}}>
                    <span style={{fontSize:11,color:'var(--t3)'}}>Overlays:</span>
                    <button className={`map-btn ${mapLayers.hm ? 'on' : ''}`} onClick={() => toggleMapLayer('hm')}>Heatmap</button>
                    <button className={`map-btn ${mapLayers.ai ? 'on' : ''}`} onClick={() => toggleMapLayer('ai')}>AI Tags</button>
                    <button className={`map-btn ${mapLayers.flow ? 'on' : ''}`} onClick={() => toggleMapLayer('flow')}>Flow</button>
                    <button className={`map-btn ${mapLayers.zones ? 'on' : ''}`} onClick={() => toggleMapLayer('zones')}>Zones</button>
                  </div>
                  
                  <svg width="100%" viewBox="0 0 700 360" style={{background:'#060a0f',display:'block', transition: '.3s ease-in-out'}}>
                    {/* SVG Base */}
                    <g opacity=".12" stroke="#1e2a3a" strokeWidth="1">
                      <line x1="0" y1="90" x2="700" y2="90"/><line x1="0" y1="180" x2="700" y2="180"/><line x1="0" y1="270" x2="700" y2="270"/>
                      <line x1="175" y1="0" x2="175" y2="360"/><line x1="350" y1="0" x2="350" y2="360"/><line x1="525" y1="0" x2="525" y2="360"/>
                    </g>
                    
                    {mapLayers.hm && (
                      <g style={{transition: 'opacity 0.3s ease-in-out'}}>
                        <ellipse cx="350" cy="46" rx="155" ry="36" fill="#ef4444" opacity={cameras[1].density > 80 ? 0.3 : 0.1}/>
                        <ellipse cx="190" cy="190" rx="85" ry="65" fill="#f59e0b" opacity=".18"/>
                      </g>
                    )}

                    {mapLayers.ai && (
                      <g>
                        <rect x="264" y="18" width="86" height="17" rx="3" fill="#1a0808" stroke="#7f1d1d" strokeWidth="1"/>
                        <text x="270" y="30" fill="#f87171" fontSize="9" fontWeight="600">SURGE {cameras[1].density}%</text>
                      </g>
                    )}

                    {mapLayers.zones && (
                      <g>
                        <rect x="148" y="8" width="404" height="72" rx="5" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3"/>
                        <rect x="76" y="96" width="176" height="176" rx="5" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 3"/>
                      </g>
                    )}

                    <rect x="195" y="96" width="310" height="178" rx="8" fill="#1a3a22"/>
                    <rect x="210" y="108" width="280" height="154" rx="5" fill="none" stroke="#2d6b38" strokeWidth="1"/>
                    <ellipse cx="350" cy="185" rx="40" ry="40" fill="none" stroke="#2d6b38" strokeWidth="1"/>

                    {/* Stands */}
                     <rect x="148" y="8" width="404" height="80" rx="8" fill="#ef4444" fillOpacity=".07" stroke="#ef4444" strokeWidth=".5" style={{cursor:'pointer'}} 
                           onClick={() => { setZdpShow(true); setZdData({name:'North Stand', pct:`${cameras[1].density}%`, stat:'CRITICAL', ai:'Surge detected.' }) }}/>
                     <text x="350" y="36" fill="#ef4444" fontSize="12" fontWeight="600" textAnchor="middle">North Stand</text>
                  </svg>
                </div>

                {zdpShow && (
                  <div className="zdp show">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <div><div style={{fontSize:15,fontWeight:600}}>{zdData.name}</div><div style={{color:'var(--t2)'}}>{zdData.ai}</div></div>
                      <div style={{fontSize:24,fontWeight:700, color:'#ef4444'}}>{zdData.pct}</div>
                    </div>
                  </div>
                )}
             </div>
          )}

          {activePage === 'alerts' && (
             <div className="page active">
               <div className="pg-title">Alerts & Team Coordination</div>
               <div className="grid2">
                 <div>
                   <div className="sec-lbl">Active Alerts</div>
                   {alerts.map((a, i) => (
                      <div key={i} className={`alcard al-${a.type}`}>
                        <div className="alind" style={{background: scols[a.type] || '#f59e0b'}}></div>
                        <div>
                          <div className="al-t">{a.title}</div>
                          <div className="al-b">{a.body}</div>
                        </div>
                      </div>
                    ))}
                    <div className="em-panel" style={{marginTop: 20}}>
                      <div style={{fontSize:12,fontWeight:600,color:'#fca5a5',marginBottom:12}}>Emergency Control</div>
                      <div className="em-grid">
                        <button className="ebtn eb-r" onClick={() => triggerEm('PA Warning broadcast')}>PA Warning</button>
                        <button className="ebtn eb-a" onClick={() => triggerEm('Gates opened')}>Open Exits</button>
                        <button className="ebtn eb-g" onClick={() => triggerEm('All Clear')}>All Clear</button>
                      </div>
                    </div>
                 </div>
               </div>
             </div>
          )}

        </div>
      ) : (
        <div id="attendee-panel">
          <div className="att-page">
             <div className="att-hero">
                <div>
                   <div className="att-welcome">{venueConfig.name}</div>
                   <div className="att-sub">{venueConfig.event} · Block N, Row 12, Seat 34</div>
                </div>
             </div>
             
             <div className="att-status-grid">
                <div className="att-stat"><div className="att-stat-val" style={{color:'#4ade80'}}>4.2 min</div><div className="att-stat-lbl">Avg queue</div></div>
                <div className="att-stat"><div className="att-stat-val" style={{color:'#f59e0b'}}>4 min</div><div className="att-stat-lbl">Walk to seat</div></div>
             </div>

             <div style={{padding:'16px 20px 4px'}}>
               <div className="att-alert-banner al-warn">
                 <div className="alind" style={{background:'#f59e0b',marginTop:3}}></div>
                 <div><div className="al-t" style={{fontSize:12}}>North Stand Congested</div><div className="al-b" style={{fontSize:11}}>Use Gate B or D. Route updated.</div></div>
               </div>
             </div>

             <div className="att-section">
                <div className="att-sec-title">Quick Actions</div>
                <div className="att-quick-grid">
                   <div className="att-quick"><div className="att-quick-title">Nearest Restroom</div><div className="att-quick-val" style={{color:'#4ade80'}}>0 min wait</div></div>
                   <div className="att-quick"><div className="att-quick-title">Food Stand</div><div className="att-quick-val" style={{color:'#4ade80'}}>2 min wait</div></div>
                </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
