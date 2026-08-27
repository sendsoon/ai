import {
  ipLookupFailureResult,
  validatePublicIp,
  type IpLookupResult,
  type SendSoonClient,
} from '../core/index.js';
import * as z from 'zod/v4';
import { formatToolResult } from './format.js';

const ipLookupInputSchema = {
  ip: z.string().trim().min(1).describe('Public IPv4 or IPv6 address to look up'),
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

export const ipLookupToolDefinition = {
  name: 'ip_lookup' as const,
  config: {
    title: 'IP 归属查询',
    description:
      'Look up geolocation and ISP info for a public IPv4 or IPv6 address via SendSoon',
    inputSchema: ipLookupInputSchema,
    outputSchema: ipLookupOutputSchema,
  },
  createHandler(client: SendSoonClient) {
    return async (input: IpLookupInput) => {
      const ip = input.ip.trim();
      const validationError = validatePublicIp(ip);
      if (validationError) {
        return formatToolResult(ipLookupFailureResult(validationError));
      }

      const result = await client.ipLookup({ ip });
      return formatToolResult(result);
    };
  },
};
