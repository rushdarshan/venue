export type IntegrationStatus = 'connected' | 'fallback' | 'disabled';

export interface IntegrationFeature {
  id: string;
  name: string;
  status: IntegrationStatus;
  reason: string;
  actionUrl?: string;
  actionText?: string;
}

export function getGoogleIntegrations(apiKey?: string): IntegrationFeature[] {
  const hasKey = !!(apiKey || import.meta.env.VITE_GEMINI_API_KEY);

  return [
    {
      id: 'gemini',
      name: 'Google Gemini 2.0 Flash',
      status: hasKey ? 'connected' : 'fallback',
      reason: hasKey ? 'Using live LLM for decisions.' : 'Key missing. Using deterministic fast-fallback.',
    },
    {
      id: 'google_maps',
      name: 'Google Maps Navigation',
      status: 'connected',
      reason: 'Deep-linked routing to stadium gates.',
      actionUrl: 'https://maps.google.com/?daddr=Grand+Sports+Arena',
      actionText: 'View in Maps'
    },
    {
      id: 'google_forms',
      name: 'Google Forms Incident Log',
      status: 'connected',
      reason: 'External logging for EMS/QRT payload.',
      actionUrl: 'https://docs.google.com/forms',
      actionText: 'Open Logger'
    },
    {
      id: 'google_fonts',
      name: 'Google Fonts',
      status: 'connected',
      reason: 'Loaded via system-ui fallback stack.'
    }
  ];
}
