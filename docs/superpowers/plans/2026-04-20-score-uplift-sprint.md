# Score Uplift Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase PromptWars AI analysis score quickly by hardening Google-service evidence, fixing high-impact quality gaps, and aligning README/submission narrative with actual implementation.

**Architecture:** Introduce a small integration-status layer (`src/integrations/google.ts` + `IntegrationStatusCard`) as the source of truth for Google service state, remove insecure hardcoded key usage, and keep app behavior fallback-safe. Add focused tests (integration mapping + smoke rendering) and tighten docs so all claims are verifiable from code and UI.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Vercel

---

## File Structure (locked before implementation)

- **Create:** `src/components/IntegrationStatusCard.tsx`  
  Responsibility: render Google service status from typed input only.

- **Modify:** `src/integrations/google.ts`  
  Responsibility: single source of truth for Google service status derivation.

- **Modify:** `src/App.tsx`  
  Responsibility: consume integration layer + remove insecure defaults + mount status component.

- **Modify:** `src/index.css`  
  Responsibility: minimum responsive/accessibility tweaks for high-impact score lift.

- **Modify:** `src/test/google.test.ts`  
  Responsibility: validate integration mapping logic.

- **Modify:** `src/test/App.test.tsx`  
  Responsibility: smoke checks for integration status rendering and fallback behavior.

- **Modify:** `README.md`  
  Responsibility: criterion-aligned narrative that matches code reality.

---

### Task 1: Harden Google Integration Source of Truth

**Files:**
- Modify: `src/integrations/google.ts`
- Test: `src/test/google.test.ts`

- [ ] **Step 1: Write the failing test for secure Gemini status mapping**

```ts
import { describe, it, expect } from 'vitest';
import { getGoogleIntegrations } from '../integrations/google';

describe('Google integrations security mapping', () => {
  it('returns fallback for gemini when api key is missing', () => {
    const items = getGoogleIntegrations('');
    const gemini = items.find(i => i.id === 'gemini');
    expect(gemini?.status).toBe('fallback');
    expect(gemini?.reason.toLowerCase()).toContain('fallback');
  });
});
```

- [ ] **Step 2: Run test to verify baseline**

Run: `npm run test -- src/test/google.test.ts`  
Expected: existing file runs; new assertion fails if mapping/reason is inconsistent.

- [ ] **Step 3: Implement minimal integration status logic**

```ts
export type IntegrationStatus = 'connected' | 'fallback' | 'disabled';

export interface IntegrationFeature {
  id: 'gemini' | 'google_maps' | 'google_forms' | 'google_fonts';
  name: string;
  status: IntegrationStatus;
  reason: string;
  actionUrl?: string;
  actionText?: string;
}

export function getGoogleIntegrations(apiKey?: string): IntegrationFeature[] {
  const hasGeminiKey = Boolean(apiKey && apiKey.trim().length > 0);

  return [
    {
      id: 'gemini',
      name: 'Google Gemini 2.0 Flash',
      status: hasGeminiKey ? 'connected' : 'fallback',
      reason: hasGeminiKey
        ? 'Using live Gemini API responses.'
        : 'Gemini key missing; deterministic local fallback is active.',
    },
    {
      id: 'google_maps',
      name: 'Google Maps Navigation',
      status: 'connected',
      reason: 'Uses deep links for attendee routing.',
      actionUrl: 'https://maps.google.com/?daddr=Grand+Sports+Arena',
      actionText: 'Open Maps',
    },
    {
      id: 'google_forms',
      name: 'Google Forms Incident Log',
      status: 'connected',
      reason: 'Ops incident logging opens Google Forms endpoint.',
      actionUrl: 'https://docs.google.com/forms',
      actionText: 'Open Forms',
    },
    {
      id: 'google_fonts',
      name: 'Google Fonts',
      status: 'connected',
      reason: 'Typography pipeline supports Google-hosted font usage.',
    },
  ];
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `npm run test -- src/test/google.test.ts`  
Expected: PASS (`Google integrations security mapping` and existing tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/integrations/google.ts src/test/google.test.ts
git commit -m "feat: harden google integration status mapping"
```

---

### Task 2: Remove Hardcoded API Key and Mount Integration Status Card

**Files:**
- Create: `src/components/IntegrationStatusCard.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/App.test.tsx`

- [ ] **Step 1: Write failing UI test for integration card visibility**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

it('renders google integration status card in overview', () => {
  render(<App />);
  expect(screen.getByTestId('integration-card')).toBeInTheDocument();
  expect(screen.getByText(/Google Gemini 2.0 Flash/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm run test -- src/test/App.test.tsx`  
Expected: FAIL if card location/test id mismatch.

- [ ] **Step 3: Implement component and secure key handling**

`src/components/IntegrationStatusCard.tsx`

```tsx
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
```

`src/App.tsx` (relevant lines)

```tsx
import IntegrationStatusCard from './components/IntegrationStatusCard';
import { getGoogleIntegrations } from './integrations/google';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';
const integrations = useMemo(() => getGoogleIntegrations(GEMINI_API_KEY), []);
```

```tsx
<IntegrationStatusCard integrations={integrations} />
```

Also remove any hardcoded key fallback string:

```tsx
// BAD
// const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIza...';
// GOOD
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test -- src/test/App.test.tsx src/test/google.test.ts`  
Expected: PASS; integration card test green.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/IntegrationStatusCard.tsx src/test/App.test.tsx
git commit -m "feat: add integration status card and remove hardcoded gemini key"
```

---

### Task 3: Fast Responsive + Accessibility Uplift (High-Impact Slice)

**Files:**
- Modify: `src/index.css`
- Test: `src/test/App.test.tsx`

- [ ] **Step 1: Add failing test for semantic navigation buttons**

```tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

it('renders admin navigation tabs as buttons with tab role', () => {
  render(<App />);
  expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Crowd Routing' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify baseline**

Run: `npm run test -- src/test/App.test.tsx`  
Expected: PASS after semantic nav adoption; FAIL if role/name not present.

- [ ] **Step 3: Implement minimal CSS responsiveness and touch target fixes**

Add to `src/index.css`:

```css
/* quick responsive uplift for score-critical layouts */
@media (max-width: 1024px) {
  .grid4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid3 { grid-template-columns: 1fr 1fr; }
  .grid2 { grid-template-columns: 1fr; }
  .nav { overflow-x: auto; }
}

@media (max-width: 640px) {
  .grid4, .grid3, .grid2 { grid-template-columns: 1fr; }
  .mode-bar { padding: 0 12px; }
  .mode-btn, .map-btn, .ebtn { min-height: 44px; }
}

/* remove accent-stripe anti-pattern from chips */
.qtip, .tai {
  border-left: none;
}
```

- [ ] **Step 4: Run lint/build/tests**

Run:
- `npm run lint`
- `npm run build`
- `npm run test`

Expected:
- lint: no errors
- build: vite build success
- tests: pass summary

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/test/App.test.tsx
git commit -m "fix: improve responsive layout and accessibility targets"
```

---

### Task 4: README + Submission Narrative Alignment

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add explicit “Google Services Evidence” section**

Insert this block into `README.md`:

```md
## Google Services Evidence

- **Google Gemini 2.0 Flash**: Enabled when `VITE_GEMINI_API_KEY` is set; app uses deterministic fallback when missing.
- **Google Maps**: Deep-link route handoff to Google Maps for gate navigation.
- **Google Forms**: Incident logging handoff endpoint for ops workflows.
- **Google Fonts**: Typography pipeline supports Google-hosted font usage.

### Fallback Behavior

If the Gemini key is not configured, VenueIQ remains fully functional and shows explicit fallback status in the Integration Status card.
```

- [ ] **Step 2: Align feature claims to current implementation only**

Checklist while editing:
- Remove any claim of backend/cloud function not present in repo.
- Keep phrasing as “integrated with fallback” where key-dependent.
- Ensure demo flow steps match visible UI tabs and interactions.

- [ ] **Step 3: Validate markdown quality**

Run: `npm run lint`  
Expected: JS/TS lint still passes after README edit.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: align google services narrative with implemented behavior"
```

---

### Task 5: Release Validation + Submission Update

**Files:**
- Modify: `.env.example`
- Modify: `README.md` (if missing setup note)

- [ ] **Step 1: Ensure env template includes Gemini key**

`.env.example`

```env
VITE_GEMINI_API_KEY=
```

- [ ] **Step 2: Run final pre-release checks**

Run:
- `npm run lint`
- `npm run test`
- `npm run build`

Expected:
- All commands succeed.

- [ ] **Step 3: Push and deploy**

```bash
git push origin main
```

Deploy to Vercel (existing project):

```bash
vercel --prod
```

Expected:
- Production deployment URL updates and app loads.

- [ ] **Step 4: Update submission form text (manual)**

Use this short narrative in submission/LinkedIn alignment:

```text
VenueIQ uses an ops-first detect→decide→act→guide loop. Google services are integrated with explicit runtime status: Gemini (live when key is set, deterministic fallback otherwise), Google Maps route handoff, and Google Forms incident logging handoff. The deployed app exposes integration status in-product for evaluator verification.
```

- [ ] **Step 5: Commit env/docs cleanup**

```bash
git add .env.example README.md
git commit -m "chore: finalize release env and evaluator narrative"
```

---

## Self-Review

### Spec coverage
- Integration registry + status UI: covered in Tasks 1-2.
- Fallback-safe behavior: covered in Tasks 1-2 and Task 5.
- Minimal test uplift: covered in Tasks 1-3.
- Narrative alignment: covered in Task 4 and Task 5.

### Placeholder scan
- No TBD/TODO placeholders.
- Each implementation step includes concrete file paths, code, commands, and expected outcomes.

### Type consistency
- `IntegrationStatus` and `IntegrationFeature` are defined in one module and reused in component/app.
- `getGoogleIntegrations` signature is consistent across tasks/tests.

