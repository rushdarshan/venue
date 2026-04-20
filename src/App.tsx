import React, { useState, useEffect } from 'react';

const scols: Record<string, string> = { crit: '#ef4444', warn: '#f59e0b', ok: '#22c55e', info: '#378add' };

export default function App() {
  const [isAdmin, setIsAdmin] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [time, setTime] = useState('');
  const [incidentCount, setIncidentCount] = useState(1); // 1 active incident for demo

  const [arrBase, setArrBase] = useState(67842);
  const [rerBase, setRerBase] = useState(1247);

  const [venueConfig] = useState({
    name: 'Grand Sports Arena', event: 'IPL Final · Match Day', capacity: 80000, reg: 72450, walkin: 4200
  });

  const [cameras, setCameras] = useState([
    {id:'CAM-01',name:'Gate A Entrance',zone:'Gate Area',status:'crit',density:89,persons:47,vel:'High'},
    {id:'CAM-02',name:'North Stand Upper',zone:'North Stand',status:'crit',density:91,persons:63,vel:'High'},
    {id:'CAM-03',name:'Food Court Central',zone:'Food Court',status:'warn',density:82,persons:38,vel:'Medium'},
    {id:'CAM-04',name:'East Gate',zone:'East Stand',status:'ok',density:38,persons:18,vel:'Low'},
  ]);

  const [alerts, setAlerts] = useState([
    {id:1, type:'crit', title:'North Stand — 91% density', body:'Surge alert: restrict Gate A. Rerouting to Gate D.'},
    {id:2, type:'warn', title:'Food Court — surge predicted', body:'34% increase in 8 min. Open backup stalls B3–B6.'},
  ]);

  // Incident Workflow (CrowdFlow)
  const [incidents, setIncidents] = useState([
    {id: 'INC-092', type: 'Medical', loc: 'Gate B Concourse', status: 'In Progress', assign: 'QRT-Alpha', time: '2 mins ago'}
  ]);

  // What-If Simulation
  const [whatIfStr, setWhatIfStr] = useState('Off');

  const [mapLayers, setMapLayers] = useState({hm:true, ai:true, flow:false, zones:false});
  const [zdpShow, setZdpShow] = useState(false);
  const [zdData, setZdData] = useState<any>({});

  const toggleMapLayer = (layer: keyof typeof mapLayers) => setMapLayers(prev => ({...prev, [layer]: !prev[layer]}));

  const [adminInput, setAdminInput] = useState('');
  const [adminMsgs, setAdminMsgs] = useState([{user: false, text: "Hi! I have real-time data on every zone, gate, queue, and route. What do you need?"}]);
  
  const [attInput, setAttInput] = useState('');
  const [attMsgs, setAttMsgs] = useState([{user: false, text: "Hi! I know your seat (N-Block) and venue conditions. How can I help?"}]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toTimeString().split(' ')[0]), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sim = setInterval(() => {
      setArrBase(prev => prev + Math.floor(Math.random()*4));
      setRerBase(prev => prev + Math.floor(Math.random()*3));

      setCameras(prev => prev.map(c => {
        const delta = (Math.random() * 4) - 1.5;
        const newD = Math.min(99, Math.max(5, Math.round(c.density + delta)));
        let newStat = 'ok';
        if(newD > 85) newStat = 'crit';
        else if(newD > 60) newStat = 'warn';
        
        if (newStat === 'crit' && c.status !== 'crit') {
          setAlerts(old => [{id:Date.now(), type: 'crit', title: `[AUTO] ${c.zone} spike to ${newD}%`, body: `Recommending reroutes.`}, ...old].slice(0, 5));
        }
        return {...c, density: newD, status: newStat, persons: Math.round(newD * 0.65)};
      }));
    }, 4000);
    return () => clearInterval(sim);
  }, []);

  const triggerEm = (msg: string) => {
    setAlerts(old => [{ id:Date.now(), type: 'warn', title: 'Protocol activated', body: msg }, ...old]);
    if (!msg.toLowerCase().includes('all clear')) setIncidentCount(i => i + 1);
    else setIncidentCount(0);
  };

  const navItem = (id: string, lbl: string, col: string) => (
    <div className={`nv ${activePage === id ? 'active' : ''}`} onClick={() => setActivePage(id)}>
      <div className="nvd" style={{background: col}}></div>{lbl}
    </div>
  );

  const getAiReply = (txt: string) => {
    const ml = txt.toLowerCase();
    if(ml.includes('food') || ml.includes('queue')) return "Gate B Concessions has a 2 min wait. Gate A is 13 mins.";
    if(ml.includes('seat') || ml.includes('route')) return "ETA 4 min to N-Block via West Elevator (0 min wait).";
    if(ml.includes('north')) return "North Stand is CRITICAL (91%). East Stand is 38%.";
    return "Analyzing live data... Conditions nominal across South/East sectors.";
  }

  const handleChat = (isAdminChat: boolean) => {
    const val = isAdminChat ? adminInput : attInput;
    if(!val.trim()) return;
    
    if(isAdminChat) {
      setAdminMsgs(p => [...p, {user: true, text: val}]);
      setAdminInput('');
      setTimeout(() => setAdminMsgs(p => [...p, {user: false, text: getAiReply(val)}]), 800);
    } else {
      setAttMsgs(p => [...p, {user: true, text: val}]);
      setAttInput('');
      setTimeout(() => setAttMsgs(p => [...p, {user: false, text: getAiReply(val)}]), 800);
    }
  };

  // Queue data
  const queues = [
    {name:'Gate A Concessions', ico:'🍔', pct:91, wait:'13 min', col:'#ef4444', tip:'Use Gate B'},
    {name:'Gate B Concessions', ico:'🥤', pct:28, wait:'2 min', col:'#22c55e', tip:'Recommended'},
    {name:'Restroom Block W2', ico:'🚻', pct:22, wait:'0 min', col:'#22c55e', tip:'Nearest'},
  ];

  return (
    <>
      <div className="mode-bar">
        <div className="mode-logo">
          <div className="mode-logo-mark"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>
          VenueIQ
        </div>
        <div className="mode-toggle">
          <button className={`mode-btn ${isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(true)}>Ops Panel</button>
          <button className={`mode-btn ${!isAdmin ? 'active' : ''}`} onClick={() => setIsAdmin(false)}>Attendee</button>
        </div>
        <div className="mode-right">
          <div className="live-chip"><div className="livd"></div>Live</div>
          <span>{time}</span>
        </div>
      </div>

      {isAdmin ? (
        <div id="admin-panel">
          <div className="nav">
            {navItem('overview', 'Overview', '#4ade80')}
            {navItem('crowd', 'Crowd Routing', '#f59e0b')}
            {navItem('incidents', 'Incident Command', '#ef4444')}
            {navItem('whatif', 'What-If Forecast', '#a78bfa')}
            {navItem('egress', 'Egress Waves', '#378add')}
          </div>

          <div style={{padding: '0 24px'}}>
          {activePage === 'overview' && (
            <div className="page active" style={{paddingTop: 16}}>
              <div className="pg-title">Command Overview</div>
              <div className="grid4" style={{marginBottom: 24}}>
                <div className="stat"><div className="sv" style={{color:'#60a5fa'}}>{venueConfig.capacity.toLocaleString()}</div><div className="sl">Expected</div></div>
                <div className="stat"><div className="sv" style={{color:'#4ade80'}}>{arrBase.toLocaleString()}</div><div className="sl">Arrived</div></div>
                <div className="stat"><div className="sv" style={{color:'#4ade80'}}>{rerBase.toLocaleString()}</div><div className="sl">AI reroutes (Crowd-Aware)</div></div>
                <div className="stat"><div className="sv" style={{color: incidentCount > 0 ? '#ef4444' : '#4ade80'}}>{incidentCount}</div><div className="sl">Active Incidents</div></div>
              </div>
              <div className="grid2">
                 <div className="card">
                    <div className="sec-lbl">Active Zones (Decisions)</div>
                    {cameras.map(c => (
                       <div key={c.id} style={{marginBottom:11}}>
                           <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}>
                             <span style={{color:'#e2e8f0'}}>{c.zone}</span><span style={{color: scols[c.status], fontWeight:500}}>{c.density}%</span>
                           </div>
                           <div style={{background:'var(--brd)',borderRadius:3,height:5,overflow:'hidden'}}>
                             <div style={{width: `${c.density}%`, height:5, borderRadius:3, background:scols[c.status], transition: 'width 0.4s'}}/>
                           </div>
                       </div>
                    ))}
                 </div>
                 <div className="card">
                    <div className="sec-lbl">Queue Rebalancing</div>
                    {queues.map((q, i) => (
                      <div key={i} className="qrow" style={{marginBottom:6, padding:8}}>
                        <div className="qinfo" style={{fontSize:12, fontWeight:500, color:'#e2e8f0'}}>{q.name}</div>
                        <div className="qbar-w" style={{width:80}}>
                          <div className="qbar-bg"><div className="qbar-f" style={{width:`${q.pct}%`, background:q.col}}></div></div>
                        </div>
                        <div style={{color:q.col, fontSize:11, fontWeight:600}}>{q.wait}</div>
                      </div>
                    ))}
                    <div style={{fontSize:11, color:'#f59e0b', marginTop:8}}>* Rerouting Gate A traffic to Gate B</div>
                 </div>
              </div>
            </div>
          )}

          {activePage === 'crowd' && (
             <div className="page active" style={{paddingTop: 16}}>
                <div className="pg-title">Crowd-Aware Routing Map</div>
                <div style={{background:'var(--bg1)', border:'1px solid var(--brd)', borderRadius:'var(--rad)', overflow:'hidden', marginBottom:14}}>
                  <div style={{display:'flex',gap:8,padding:'11px 16px',borderBottom:'1px solid var(--brd)'}}>
                    <button className={`map-btn ${mapLayers.hm ? 'on' : ''}`} onClick={() => toggleMapLayer('hm')}>Heatmap</button>
                    <button className={`map-btn ${mapLayers.ai ? 'on' : ''}`} onClick={() => toggleMapLayer('ai')}>Auto-Reroute Triggers</button>
                  </div>
                  <svg width="100%" viewBox="0 0 700 360" style={{background:'#060a0f',display:'block', transition:'.3s'}}>
                    <g opacity=".12" stroke="#1e2a3a" strokeWidth="1">
                      <line x1="0" y1="90" x2="700" y2="90"/><line x1="175" y1="0" x2="175" y2="360"/>
                    </g>
                    {mapLayers.hm && (
                      <g>
                        <ellipse cx="350" cy="46" rx="155" ry="36" fill="#ef4444" opacity={cameras[1].density > 80 ? 0.3 : 0.1}/>
                        <ellipse cx="190" cy="190" rx="85" ry="65" fill="#f59e0b" opacity=".18"/>
                      </g>
                    )}
                    {mapLayers.ai && (
                      <g>
                        <rect x="264" y="18" width="86" height="17" rx="3" fill="#1a0808" stroke="#7f1d1d" strokeWidth="1"/>
                        <text x="270" y="30" fill="#f87171" fontSize="9" fontWeight="600">REROUTE {'>'} 85%</text>
                      </g>
                    )}
                    <rect x="195" y="96" width="310" height="178" rx="8" fill="#1a3a22"/>
                    <rect x="210" y="108" width="280" height="154" rx="5" fill="none" stroke="#2d6b38" strokeWidth="1"/>
                    <ellipse cx="350" cy="185" rx="40" ry="40" fill="none" stroke="#2d6b38" strokeWidth="1"/>
                    <rect x="148" y="8" width="404" height="80" rx="8" fill="#ef4444" fillOpacity=".07" stroke="#ef4444" strokeWidth=".5" style={{cursor:'pointer'}} 
                           onClick={() => { setZdpShow(true); setZdData({name:'North Stand', pct:`${cameras[1].density}%`, stat:'CRITICAL', ai:'Dijkstra weight increased (+400). Forwarding traffic to East.' }) }}/>
                    <text x="350" y="36" fill="#ef4444" fontSize="12" fontWeight="600" textAnchor="middle">North Stand</text>
                  </svg>
                </div>
                {zdpShow && (
                  <div className="zdp show">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <div><div style={{fontSize:15,fontWeight:600}}>{zdData.name}</div><div style={{color:'var(--t2)', fontSize:12, marginTop:4}}>{zdData.ai}</div></div>
                      <div style={{fontSize:24,fontWeight:700, color:'#ef4444'}}>{zdData.pct}</div>
                    </div>
                  </div>
                )}
             </div>
          )}

          {activePage === 'incidents' && (
             <div className="page active" style={{paddingTop: 16}}>
               <div className="pg-title">Incident Command Workflow</div>
               <div className="grid2">
                 <div>
                   <div className="sec-lbl">Active Incidents</div>
                   {incidents.map(inc => (
                      <div key={inc.id} className="alcard al-warn">
                        <div className="alind" style={{background:'#f59e0b'}}></div>
                        <div style={{flex:1}}>
                          <div className="al-t">{inc.id} - {inc.type}</div>
                          <div className="al-b">{inc.loc} | {inc.status}</div>
                          <div className="al-time">{inc.time} | Assigned: {inc.assign}</div>
                        </div>
                        <button className="ebtn eb-g" onClick={() => setIncidents([])} style={{padding:'4px 8px'}}>Resolve</button>
                      </div>
                    ))}
                    {incidents.length === 0 && <div style={{fontSize:12, color:'#4ade80'}}>All clear.</div>}
                 </div>
                 <div className="em-panel" style={{height:'fit-content'}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#fca5a5',marginBottom:12}}>Emergency Control Trigger</div>
                    <div className="em-grid">
                      <button className="ebtn eb-r" onClick={() => triggerEm('PA Warning broadcast')}>PA Warning</button>
                      <button className="ebtn eb-a" onClick={() => triggerEm('Gates opened')}>Force Flow Redirect</button>
                    </div>
                 </div>
               </div>
             </div>
          )}

          {activePage === 'whatif' && (
             <div className="page active" style={{paddingTop: 16}}>
               <div className="pg-title">What-If Forecasting</div>
               <div style={{display:'flex', gap:10, marginBottom:20}}>
                 <button className={`ebtn ${whatIfStr==='Off'?'eb-b':''}`} onClick={()=>setWhatIfStr('Off')}>Live Now</button>
                 <button className={`ebtn ${whatIfStr==='+5M'?'eb-b':''}`} onClick={()=>setWhatIfStr('+5M')}>+5 Mins (Surge)</button>
                 <button className={`ebtn ${whatIfStr==='+10M'?'eb-b':''}`} onClick={()=>setWhatIfStr('+10M')}>+10 Mins (Post-Match)</button>
               </div>
               <div className="grid3">
                 <div className="stat">
                   <div className="sl" style={{marginBottom:4}}>Food Court Pred:</div>
                   <div className="sv" style={{color: whatIfStr==='Off'?'#f59e0b':'#ef4444'}}>{whatIfStr==='Off'?'82%': whatIfStr==='+5M'?'96%':'91%'}</div>
                   <div className="ss">{whatIfStr==='+5M'?'Critical Surge. Action: Open B3-B6':'Monitored.'}</div>
                 </div>
                 <div className="stat">
                   <div className="sl" style={{marginBottom:4}}>Gate A Queues:</div>
                   <div className="sv" style={{color: '#f59e0b'}}>{whatIfStr==='+10M'?'24 min':'13 min'}</div>
                 </div>
                 <div className="stat">
                   <div className="sl" style={{marginBottom:4}}>Ops Recommendation:</div>
                   <div style={{fontSize:12, color:'#e2e8f0', marginTop:6}}>
                     {whatIfStr==='+5M' ? 'Pre-deploy QRT to Food Court.' : whatIfStr==='+10M' ? 'Prepare Egress Wave 1. Open Gates C, D.' : 'Sustain current routes.'}
                   </div>
                 </div>
               </div>
             </div>
          )}

          {activePage === 'egress' && (
             <div className="page active" style={{paddingTop: 16}}>
               <div className="pg-title">Post-Match Egress Control</div>
               <div className="grid2">
                 <div className="card">
                    <div className="sec-lbl">Wave Scheduling (Smart-Stadium logic)</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <div className="qrow" style={{padding:8}}><div className="qinfo">Wave 1: South & East Stands</div><div style={{color:'#4ade80',fontWeight:600}}>Released</div></div>
                      <div className="qrow" style={{padding:8}}><div className="qinfo">Wave 2: West Stand</div><div style={{color:'#f59e0b',fontWeight:600}}>Wait 5m</div></div>
                      <div className="qrow" style={{padding:8}}><div className="qinfo">Wave 3: North Stand</div><div style={{color:'#ef4444',fontWeight:600}}>Congested</div></div>
                    </div>
                 </div>
                 <div className="card">
                    <div className="sec-lbl">Push Notifications</div>
                    <button className="ebtn eb-b" style={{width:'100%'}}>Broadcast Wave 2 Exit Token to Attendee App</button>
                 </div>
               </div>
             </div>
          )}
          </div>
        </div>
      ) : (
        <div id="attendee-panel">
          <div className="att-page">
             <div className="att-hero" style={{padding:'20px 24px'}}>
                <div>
                   <div className="att-welcome">{venueConfig.name}</div>
                   <div className="att-sub">{venueConfig.event} · Block N · Section 12</div>
                </div>
             </div>

             <div className="att-status-grid" style={{padding:'16px 24px'}}>
                <div className="att-stat"><div className="att-stat-val" style={{color:'#4ade80'}}>2 min</div><div className="att-stat-lbl">Nearest Exit</div></div>
                <div className="att-stat"><div className="att-stat-val" style={{color:'#f59e0b'}}>Wave 3</div><div className="att-stat-lbl">Egress Group</div></div>
             </div>

             <div style={{padding:'16px 20px 0'}}>
               <div className="att-alert-banner al-warn">
                 <div className="alind" style={{background:'#f59e0b',marginTop:3}}></div>
                 <div><div className="al-t" style={{fontSize:12}}>Egress Notice: Wait at seat</div><div className="al-b" style={{fontSize:11}}>Your section (Wave 3) will be cleared to exit in ~10 mins via Gate D. Rerouting away from North.</div></div>
               </div>
             </div>

             <div className="att-section" style={{padding:'16px 24px'}}>
                <div className="att-sec-title">Crowd-Aware Exit Route</div>
                <div className="att-route-card">
                   <div className="att-step"><div className="att-step-dot" style={{background:'#4ade80'}}/><div><div style={{fontSize:13,color:'#e2e8f0'}}>Wait for Wave 3 Alert</div></div></div>
                   <div className="att-step"><div className="att-step-dot" style={{background:'#60a5fa'}}/><div><div style={{fontSize:13,color:'#e2e8f0'}}>Take West Concourse (Avoid North)</div></div></div>
                   <div className="att-step"><div className="att-step-dot" style={{background:'#a78bfa'}}/><div><div style={{fontSize:13,color:'#e2e8f0'}}>Exit via Gate D</div></div></div>
                </div>
             </div>

             <div className="att-section" style={{padding:'16px 24px'}}>
               <div className="chat-outer" style={{maxWidth:'100%', height:260}}>
                 <div className="chat-msgs" style={{height: 200}}>
                    {attMsgs.map((m, i) => (
                      <div key={i} className={m.user ? 'msg-u' : 'msg-a'}>
                        <div className={`bub ${m.user ? 'bub-u' : 'bub-a'}`}>{m.text}</div>
                      </div>
                    ))}
                 </div>
                 <div className="cinp-row" style={{padding:8}}>
                   <input className="cinp" value={attInput} onChange={e => setAttInput(e.target.value)} onKeyDown={e => e.key==='Enter' && handleChat(false)} placeholder="Ask assistant..."/>
                   <button className="csend" onClick={() => handleChat(false)}>Send</button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
