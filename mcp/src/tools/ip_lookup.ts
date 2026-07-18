import {
  ipLookupFailureResult,
  SendSoonClient,
  SendSoonErrorCode,
  createError,
  type IpLookupResult,
} from '@sendsoon/core';
import * as z from 'zod/v4';

const ipLookupInputSchema = {
  ip: z.string().describe('Public IPv4 or IPv6 address to look up'),
};

const ipLookupOutputSchema = {
  success: z.boolean(),
  ip: z.string().optional(),
  ip2region: z
    .object({
      country: z.string(),
      countryCode: z.string(),
      region: z.string(),
      city: z.string(),
      postalCode: z.string(),
      timezone: z.string(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
    })
    .optional(),
  network: z
    .object({
      isp: z.string(),
      asn: z.string(),
      organization: z.string(),
    })
    .optional(),
  source: z.string().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      retryable: z.boolean(),
    })
    .optional(),
};

export type IpLookupInput = {
  ip: string;
};

export type IpLookupOutput = IpLookupResult;

function validateIpLookupInput(input: IpLookupInput): IpLookupResult | null {
  if (!input.ip.trim()) {
    return ipLookupFailureResult(
      createError(
        SendSoonErrorCode.INVALID_INPUT,
        'ip is required and cannot be empty.',
      ),
    );
  }

  return null;
}

function formatToolResult(result: IpLookupResult) {
  const structuredContent = JSON.parse(JSON.stringify(result)) as Record<
    string,
    unknown
  >;
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    structuredContent,
  };
}

export const ipLookupToolDefinition = {
  name: 'ip_lookup' as const,
  config: {
    title: 'IP 归属查询',
    description:
      'Look up geolocation and ISP info for a public IPv4 or IPv6 address via SendSoon API. Rejects private/reserved/loopback addresses.',
    inputSchema: ipLookupInputSchema,
    outputSchema: ipLookupOutputSchema,
  },
  createHandler(client: SendSoonClient) {
    return async (input: IpLookupInput) => {
      const validationError = validateIpLookupInput(input);
      if (validationError) {
        return formatToolResult(validationError);
      }

      const result = await client.ipLookup({ ip: input.ip.trim() });
      return formatToolResult(result);
    };
  },
};
