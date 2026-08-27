export interface SendSoonConfig {
  apiKey: string | undefined;
  baseUrl: string;
}

const DEFAULT_BASE_URL = 'https://www.sendsoonai.com';

export function loadConfig(): SendSoonConfig {
  return {
    apiKey: process.env.SENDSOON_API_KEY?.trim() || undefined,
    baseUrl: DEFAULT_BASE_URL,
  };
}
