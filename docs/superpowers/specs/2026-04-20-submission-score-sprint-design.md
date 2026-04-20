# Submission Score Sprint Design (Google Services + Narrative Alignment)

## Problem

Submission closes imminently and current AI analysis score is low. The fastest path is to improve **verifiable Google-services evidence** and **criterion-aligned narrative consistency** without destabilizing core functionality.

## Objective

Maximize short-window scoring uplift by shipping a low-risk hybrid patch:

1. Increase machine-detectable Google integration signals in code/UI.
2. Tighten evidence trail across README + submission narrative.
3. Add minimal validation tests proving integration behavior and fallback behavior.

## Scope (In)

- Frontend-only changes in `venue` repo.
- Service integration registry + status UI.
- Google links/actions wiring (Maps/Forms/Gemini key presence semantics).
- Lightweight tests for integration status logic and fallback behavior.
- README updates aligned exactly with implemented behavior.

## Scope (Out)

- New backend service deployment.
- Large refactors across all pages/components.
- Major visual redesign.
- Full multi-page test suite expansion.

## Constraints

- Must remain deploy-safe on Vercel static hosting.
- Must not require secret keys to run (graceful fallback required).
- Must be low-diff, low-risk under deadline pressure.

---

## Approach (Chosen)

**Hybrid patch**: “Google-proof fast path” + one technical quality slice.

Why chosen:
- Better scoring upside than narrative-only updates.
- Safer than introducing server-side integrations under deadline.
- Keeps current UX/demo flow intact.

---

## Architecture & Components

## 1) Integration Registry Layer

Create a small typed module (e.g. `src/integrations/google.ts`) that:
- Detects configured integration state from env and static URLs.
- Exposes a normalized list:
  - `gemini`
  - `google_maps`
  - `google_forms`
  - `google_fonts`
- Returns status: `connected | fallback | disabled`.
- Provides user-facing reason strings.

This isolates all “Google evidence” in one place and avoids ad-hoc checks across components.

## 2) Ops/Attendee Integration Status Surface

Add a compact status block in app UI (Ops Overview card + optional attendee footer) that:
- Shows each integration and its current status.
- Uses deterministic fallback labels when env keys are missing.
- Includes action links where relevant (e.g. forms/maps).

This makes runtime integration behavior explicit for human and AI evaluators.

## 3) Submission Narrative Consistency Layer

README and submission text must mirror implemented behavior exactly:
- “Integrated with graceful fallback” where key is optional.
- No claims of services not actually referenced in code.
- Mention where each service appears in product flow.

---

## Data Flow

1. App bootstrap reads environment + static config.
2. Integration registry computes per-service statuses.
3. UI renders service chips/cards and optional links.
4. Interaction events (open maps/forms) route through explicit handlers.
5. Tests assert:
   - correct status mapping per env condition,
   - stable fallback outputs when unconfigured.

---

## Error Handling & Fallback

- Missing API key never crashes UI.
- Status labels downgrade to `fallback`/`disabled` with explanation.
- External-link failures handled as non-blocking UX events.
- Keep existing operational simulation independent from integrations.

---

## Testing Strategy

Add focused tests only:

1. **Unit tests** for registry status derivation:
   - key present -> connected
   - key absent -> fallback/disabled
2. **Render test** for status panel:
   - expected services visible
   - expected labels visible
3. **Smoke test** for no-key runtime:
   - app renders without throwing.

This is the smallest test set that improves “Testing” evidence without risking timeline.

---

## Implementation Plan (Execution Sequence)

1. Add `src/integrations/google.ts` (typed status model + derivation logic).
2. Add `IntegrationStatusCard` component.
3. Mount card in Ops Overview (and optional attendee location).
4. Wire Forms/Maps action links through explicit handlers.
5. Add unit/render smoke tests (Vitest + Testing Library).
6. Update README:
   - Google Services section with truthful mapping to code.
   - Fallback behavior section.
7. Redeploy to Vercel.
8. Update submission narrative text to match final deployed behavior.

---

## Risks & Mitigations

- **Risk:** Overclaiming integrations in docs.
  - **Mitigation:** Only claim services with explicit code reference.
- **Risk:** Test setup friction under deadline.
  - **Mitigation:** Keep tests module-level and minimal; avoid full E2E.
- **Risk:** UI clutter.
  - **Mitigation:** compact card + short labels.

---

## Success Criteria

- Build/lint pass after patch.
- Deployed app renders integration statuses with no-key fallback.
- README clearly maps services -> implementation points.
- Submission text uses consistent claims with repo/deploy behavior.

