import { randomUUID } from 'node:crypto';
import { loadConfig } from './config.js';
import {
  SendSoonErrorCode,
  createError,
  mapHttpError,
  mapNetworkError,
} from './errors.js';
import { httpRequest, type HttpRequestOptions, type HttpResponse } from './http.js';
import type {
  IpLookupRequest,
  IpLookupResult,
  IpNetworkInfo,
  IpRegionInfo,
} from './types/ip-lookup.js';
import {
  ipLookupFailureResult,
  ipLookupSuccessResult,
} from './types/ip-lookup.js';
import type {
  MarkitdownConvertRequest,
  MarkitdownConvertResult,
} from './types/markitdown.js';
import {
  markitdownFailureResult,
  markitdownSuccessResult,
} from './types/markitdown.js';
import type { SendRequest } from './types/send-request.js';
import {
  failureResult,
  successResult,
  type SendResult,
} from './types/send-result.js';
import {
  validateBaseUrl,
  validateMarkitdownRequest,
  validatePublicIp,
  validateSendRequest,
} from './validation.js';

interface ApiSendEmailResponse {
  success?: boolean;
  message_id?: string;
  id?: string;
  status?: string;
  remaining?: number;
}

interface ApiIpLookupResponse {
  ip: string;
  ip2region: IpRegionInfo;
  network: IpNetworkInfo;
  source: string;
}

interface ApiMarkitdownConvertResponse {
  filename: string;
  markdown: string;
}

export interface SendSoonClientOptions {
  apiKey?: string;
  baseUrl?: string;
  emailRecipient?: string;
  request?: (options: HttpRequestOptions) => Promise<HttpResponse>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

function parseSendEmailResponse(body: string): ApiSendEmailResponse | null {
  const value = parseJson(body);
  if (!isRecord(value)) return null;
  const messageId = value.message_id ?? value.id;
  const validMessageId = typeof messageId === 'string' && messageId.trim();
  const validSuccess = value.success === true;
  if (!validMessageId && !validSuccess) return null;
  return {
    ...(validMessageId ? { message_id: messageId } : {}),
    ...(typeof value.remaining === 'number' ? { remaining: value.remaining } : {}),
  };
}

function isStringRecord(value: unknown, keys: string[]): value is Record<string, string> {
  return isRecord(value) && keys.every((key) => typeof value[key] === 'string');
}

function parseIpLookupResponse(body: string): ApiIpLookupResponse | null {
  const value = parseJson(body);
  if (!isRecord(value) || typeof value.ip !== 'string' || typeof value.source !== 'string') {
    return null;
  }
  const regionKeys = ['country', 'countryCode', 'region', 'city', 'postalCode', 'timezone'];
  const networkKeys = ['isp', 'asn', 'organization'];
  if (!isStringRecord(value.ip2region, regionKeys) || !isStringRecord(value.network, networkKeys)) {
    return null;
  }
  const { latitude, longitude } = value.ip2region;
  const validCoordinate = (coordinate: unknown) => coordinate === null || typeof coordinate === 'number';
  if (!validCoordinate(latitude) || !validCoordinate(longitude)) return null;
  return value as unknown as ApiIpLookupResponse;
}

function parseMarkitdownResponse(body: string): ApiMarkitdownConvertResponse | null {
  const value = parseJson(body);
  return isRecord(value) &&
    typeof value.filename === 'string' && value.filename.trim().length > 0 &&
    typeof value.markdown === 'string' && value.markdown.trim().length > 0
    ? { filename: value.filename, markdown: value.markdown }
    : null;
}

function optionalAuthorizationHeader(apiKey: string | undefined): Record<string, string> {
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
}

function plainTextToHtml(value: string): string {
  const escaped = value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  return `<pre style="white-space:pre-wrap;font-family:inherit">${escaped}</pre>`;
}

function responseFilename(headers: Headers, fallback: string): string {
  const disposition = headers.get('content-disposition') ?? '';
  const encoded = disposition.match(/filename\*=UTF-8''([^;\s]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      // Fall through to the basic filename parser.
    }
  }
  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

function invalidResponseError() {
  return createError(SendSoonErrorCode.INVALID_RESPONSE);
}

export class SendSoonClient {
  private readonly options: SendSoonClientOptions;
  private readonly request: (options: HttpRequestOptions) => Promise<HttpResponse>;

  constructor(options: SendSoonClientOptions = {}) {
    this.options = options;
    this.request = options.request ?? httpRequest;
  }

  private config() {
    const environment = loadConfig();
    return {
      apiKey: this.options.apiKey?.trim() || environment.apiKey,
      baseUrl: this.options.baseUrl?.trim() || environment.baseUrl,
      emailRecipient:
        this.options.emailRecipient?.trim() || environment.emailRecipient,
    };
  }

  sendEmail(request: SendRequest): Promise<SendResult> {
    const validationError = validateSendRequest(request);
    if (validationError) return Promise.resolve(failureResult(validationError));

    const config = this.config();

    const configError = validateBaseUrl(config.baseUrl);
    if (configError) return Promise.resolve(failureResult(configError));
    if (!config.emailRecipient) {
      return Promise.resolve(failureResult(createError(
        SendSoonErrorCode.INVALID_CONFIG,
        'Set SENDSOON_EMAIL_RECIPIENT to the only address allowed for test sends.',
      )));
    }
    if (request.to.trim().toLowerCase() !== config.emailRecipient.toLowerCase()) {
      return Promise.resolve(failureResult(createError(
        SendSoonErrorCode.INVALID_RECIPIENT,
        'Recipient must match SENDSOON_EMAIL_RECIPIENT.',
      )));
    }

    const payload = {
      to: request.to,
      subject: request.subject,
      htmlContent:
        request.content_type === 'text/html'
          ? request.body
          : plainTextToHtml(request.body),
    };

    const url = `${config.baseUrl.replace(/\/$/, '')}/api/send-test-email`;

    return this.request({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...optionalAuthorizationHeader(config.apiKey),
        'Idempotency-Key': request.idempotency_key?.trim() || randomUUID(),
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          return failureResult(mapHttpError(response.status, response.body));
        }

        const data = parseSendEmailResponse(response.body);
        return data
          ? successResult(data.message_id, data.remaining)
          : failureResult(invalidResponseError());
      })
      .catch((error: unknown) => failureResult(mapNetworkError(error)));
  }

  ipLookup(request: IpLookupRequest): Promise<IpLookupResult> {
    const ip = request.ip.trim();
    const validationError = validatePublicIp(ip);
    if (validationError) return Promise.resolve(ipLookupFailureResult(validationError));

    const config = this.config();

    const configError = validateBaseUrl(config.baseUrl);
    if (configError) return Promise.resolve(ipLookupFailureResult(configError));

    const url = `${config.baseUrl.replace(/\/$/, '')}/api/ip/lookup?ip=${encodeURIComponent(ip)}`;

    return this.request({
      method: 'GET',
      url,
      headers: {
        Accept: 'application/json',
        ...optionalAuthorizationHeader(config.apiKey),
      },
    })
      .then((response) => {
        if (!response.ok) {
          return ipLookupFailureResult(mapHttpError(response.status, response.body));
        }

        const data = parseIpLookupResponse(response.body);
        if (!data) return ipLookupFailureResult(invalidResponseError());

        return ipLookupSuccessResult({
          ip: data.ip,
          ip2region: data.ip2region,
          network: data.network,
          source: data.source,
        });
      })
      .catch((error: unknown) => ipLookupFailureResult(mapNetworkError(error)));
  }

  markitdownConvert(
    request: MarkitdownConvertRequest,
  ): Promise<MarkitdownConvertResult> {
    const validationError = validateMarkitdownRequest(request);
    if (validationError) return Promise.resolve(markitdownFailureResult(validationError));

    const config = this.config();

    const configError = validateBaseUrl(config.baseUrl);
    if (configError) return Promise.resolve(markitdownFailureResult(configError));

    const url = `${config.baseUrl.replace(/\/$/, '')}/api/markitdown/convert`;
    const form = new FormData();
    form.append(
      'file',
      new Blob([Buffer.from(request.content_base64, 'base64')]),
      request.filename,
    );

    return this.request({
      method: 'POST',
      url,
      headers: {
        Accept: 'text/markdown, application/json',
        ...optionalAuthorizationHeader(config.apiKey),
      },
      body: form,
    })
      .then((response) => {
        if (!response.ok) {
          return markitdownFailureResult(mapHttpError(response.status, response.body));
        }

        const data = parseMarkitdownResponse(response.body);
        if (data) return markitdownSuccessResult(data.filename, data.markdown);

        if (!response.body.trim()) {
          return markitdownFailureResult(invalidResponseError());
        }

        const fallback = `${request.filename.replace(/\.[^.]+$/, '')}.md`;
        return markitdownSuccessResult(
          responseFilename(response.headers, fallback),
          response.body,
        );
      })
      .catch((error: unknown) => markitdownFailureResult(mapNetworkError(error)));
  }
}

export const defaultClient = new SendSoonClient();

export function sendEmail(request: SendRequest): Promise<SendResult> {
  return defaultClient.sendEmail(request);
}

export function ipLookup(request: IpLookupRequest): Promise<IpLookupResult> {
  return defaultClient.ipLookup(request);
}

export function markitdownConvert(
  request: MarkitdownConvertRequest,
): Promise<MarkitdownConvertResult> {
  return defaultClient.markitdownConvert(request);
}
