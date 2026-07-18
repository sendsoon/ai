import { loadConfig } from './config.js';
import {
  SendSoonErrorCode,
  createError,
  mapHttpError,
  mapNetworkError,
} from './errors.js';
import { httpRequest } from './http.js';
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

interface ApiSendEmailResponse {
  message_id?: string;
  id?: string;
  status?: string;
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

export class SendSoonClient {
  sendEmail(request: SendRequest): Promise<SendResult> {
    const config = loadConfig();

    if (!config.apiKey) {
      return Promise.resolve(
        failureResult(createError(SendSoonErrorCode.AUTH_ERROR)),
      );
    }

    const payload: Record<string, string> = {
      to: request.to,
      subject: request.subject,
      body: request.body,
      content_type: request.content_type ?? 'text/plain',
    };

    if (request.from_alias !== undefined) {
      payload.from_alias = request.from_alias;
    }

    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/emails/send`;

    return httpRequest({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          return failureResult(mapHttpError(response.status, response.body));
        }

        let data: ApiSendEmailResponse = {};
        try {
          data = JSON.parse(response.body) as ApiSendEmailResponse;
        } catch {
          return failureResult(
            createError(
              SendSoonErrorCode.SERVER_ERROR,
              'SendSoon API returned an invalid response.',
            ),
          );
        }

        const messageId = data.message_id ?? data.id ?? 'pending';
        if (messageId === 'pending') {
          console.warn('[sendsoon-connect] API response missing message_id');
        }

        return successResult(messageId);
      })
      .catch(() => Promise.resolve(failureResult(mapNetworkError())));
  }

  ipLookup(request: IpLookupRequest): Promise<IpLookupResult> {
    const config = loadConfig();

    if (!config.apiKey) {
      return Promise.resolve(
        ipLookupFailureResult(createError(SendSoonErrorCode.AUTH_ERROR)),
      );
    }

    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/ip/lookup?ip=${encodeURIComponent(request.ip)}`;

    return httpRequest({
      method: 'GET',
      url,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          return ipLookupFailureResult(mapHttpError(response.status, response.body));
        }

        let data: ApiIpLookupResponse;
        try {
          data = JSON.parse(response.body) as ApiIpLookupResponse;
        } catch {
          return ipLookupFailureResult(
            createError(
              SendSoonErrorCode.SERVER_ERROR,
              'SendSoon API returned an invalid response.',
            ),
          );
        }

        return ipLookupSuccessResult({
          ip: data.ip,
          ip2region: data.ip2region,
          network: data.network,
          source: data.source,
        });
      })
      .catch(() => Promise.resolve(ipLookupFailureResult(mapNetworkError())));
  }

  markitdownConvert(
    request: MarkitdownConvertRequest,
  ): Promise<MarkitdownConvertResult> {
    const config = loadConfig();

    if (!config.apiKey) {
      return Promise.resolve(
        markitdownFailureResult(createError(SendSoonErrorCode.AUTH_ERROR)),
      );
    }

    const url = `${config.baseUrl.replace(/\/$/, '')}/v1/markitdown/convert`;

    return httpRequest({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        filename: request.filename,
        contentBase64: request.content_base64,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return markitdownFailureResult(mapHttpError(response.status, response.body));
        }

        let data: ApiMarkitdownConvertResponse;
        try {
          data = JSON.parse(response.body) as ApiMarkitdownConvertResponse;
        } catch {
          return markitdownFailureResult(
            createError(
              SendSoonErrorCode.SERVER_ERROR,
              'SendSoon API returned an invalid response.',
            ),
          );
        }

        return markitdownSuccessResult(data.filename, data.markdown);
      })
      .catch(() => Promise.resolve(markitdownFailureResult(mapNetworkError())));
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
