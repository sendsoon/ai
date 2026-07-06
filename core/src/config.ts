export interface SendSoonConfig {
  apiKey: string | undefined;
  baseUrl: string;
}

const DEFAULT_BASE_URL = 'https://api.sendsoonai.com';

export function loadConfig(): SendSoonConfig {
  return {
    apiKey: process.env.SENDSOON_API_KEY?.trim() || undefined,
    baseUrl: process.env.SENDSOON_API_BASE_URL?.trim() || DEFAULT_BASE_URL,
  };
}
