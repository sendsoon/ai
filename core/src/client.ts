import { loadConfig } from './config.js';
import {
  SendSoonErrorCode,
  createError,
  mapHttpError,
  mapNetworkError,
} from './errors.js';
import { httpRequest } from './http.js';
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
}

export const defaultClient = new SendSoonClient();

export function sendEmail(request: SendRequest): Promise<SendResult> {
  return defaultClient.sendEmail(request);
}
