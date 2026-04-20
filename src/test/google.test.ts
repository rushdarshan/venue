import { describe, it, expect } from 'vitest';
import { getGoogleIntegrations } from '../integrations/google';

describe('Google Integrations', () => {
  it('maps key presence to connected status for Gemini', () => {
    const integrations = getGoogleIntegrations('fake-key');
    const gemini = integrations.find(i => i.id === 'gemini');
    expect(gemini?.status).toBe('connected');
  });

  it('maps key absence to fallback status for Gemini', () => {
    const integrations = getGoogleIntegrations('');
    const gemini = integrations.find(i => i.id === 'gemini');
    expect(gemini?.status).toBe('fallback');
  });

  it('always explicitly includes Maps integration links', () => {
    const integrations = getGoogleIntegrations('');
    const maps = integrations.find(i => i.id === 'google_maps');
    expect(maps?.status).toBe('connected');
    expect(maps?.actionUrl).toContain('maps.google.com');
  });
});
