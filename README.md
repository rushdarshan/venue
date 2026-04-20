# VenueIQ — AI-Powered Stadium Operations Platform

> Real-time crowd intelligence, AI-driven decision automation, and dynamic attendee navigation for large-scale venues.

## 🎯 Problem Statement

Managing 80,000+ attendees at live events creates critical challenges: crowd surges at gates, long food/restroom queues, unsafe egress after matches, and slow incident response. Current systems are passive dashboards — they show problems but don't solve them.

## 💡 Solution

**VenueIQ** is an ops-first control loop that **detects → decides → acts → guides** in real time:

| Layer | What it does |
|---|---|
| **Crowd-Aware Routing** | Dijkstra pathfinding with congestion penalties. Routes avoid surging zones automatically. |
| **Decision Engine** | Rule-based thresholds (90%+ density, 15min+ queues) trigger recommended operator actions. |
| **Incident Command** | Medical/safety workflow: `new → assigned → in_progress → resolved` with QRT dispatch. |
| **What-If Forecasting** | Simulates +5 and +10 minute scenarios so ops acts proactively, not reactively. |
| **Egress Wave Control** | Post-match controlled exit: sections released in waves to prevent stampede risk. |
| **Attendee Guidance** | Real-time route cards, queue recommendations, and wave assignments pushed to fans. |

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│          VenueIQ Platform           │
│   Ops Panel  ←→  Attendee View     │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐ ┌───▼───┐ ┌───▼────┐
│Decision│ │Routing│ │Incident│
│Engine  │ │Engine │ │Engine  │
│(rules) │ │(crowd)│ │(safety)│
└───┬────┘ └───┬───┘ └───┬────┘
    │          │          │
    └────┬─────┴────┬─────┘
         │          │
    ┌────▼───┐ ┌───▼──────┐
    │Egress  │ │What-If   │
    │Waves   │ │Forecaster│
    └────────┘ └──────────┘
```

## 🖥️ Features

### Ops Panel (Admin)
- **Overview** — Live KPI dashboard (arrivals, AI reroutes, incidents) + zone density bars + queue rebalancing
- **Crowd Routing Map** — SVG heatmap with auto-reroute trigger overlays
- **Incident Command** — Active incident tracking with severity tiers and resolve workflow
- **What-If Forecast** — Toggle between Live/+5M Surge/+10M Post-Match scenarios with ops recommendations
- **Egress Waves** — Wave scheduling (South→West→North) with broadcast controls

### Attendee View
- **Egress wave assignment** with countdown
- **Crowd-aware exit route** (avoid congested zones)
- **AI chat assistant** for food, restrooms, seat directions
- **Real-time safety alerts**

## 🚀 Quick Start

```bash
git clone https://github.com/rushdarshan/venue.git
cd venue
npm install
npm run dev
```

Open `http://localhost:5173`

## 🛠️ Google Services Integration

- **Google Gemini 2.0 Flash:** Integrates directly with the `App.tsx` chat layer. Dynamically synthesizes live venue statistics (density, queue data) to recommend routes and strategies to Ops and Attendees. Implemented with a graceful deterministic fallback if keys are omitted. 
- **Google Maps:** Deep-linked coordinate routing exposed via the Integration panel for rapid EMS egress navigation.
- **Google Forms:** External structured logging linkage integrated into the Ops Dashboard for QRT deployment tracking.
- **Google Fonts:** System UI typography mapping loaded seamlessly for performant rendering.

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Custom CSS design system (dark ops theme)
- **State/Sim:** React hooks + 4s simulation loop

## 📊 Demo Flow

1. Open app → **Overview** shows live arrivals, zone densities, queue wait times
2. **Crowd Routing** → Click North Stand to see congestion details + auto-reroute trigger
3. **Incident Command** → See active medical incident, click Resolve
4. **What-If** → Click "+5 Mins (Surge)" to see Food Court spike to 96% with ops recommendation
5. **Egress Waves** → Wave scheduling for controlled post-match exit
6. Switch to **Attendee** → See wave assignment, crowd-aware exit route, AI assistant

## 👥 Team

- Rushdarshan

## 📄 License

MIT
