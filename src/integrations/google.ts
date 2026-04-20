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
