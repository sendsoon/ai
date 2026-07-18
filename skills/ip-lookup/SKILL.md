---
name: ip-lookup
description: Look up geolocation and ISP info for a public IP address through the ip_lookup MCP tool. Use when the user wants to 查IP, IP归属地查询, geolocate an address, or check ISP/ASN info for a public IPv4/IPv6 address.
---

# IP Lookup — ip_lookup

Look up country/region/city/ISP info for a public IP address through the `ip_lookup` MCP tool.

## When to use

- User says **查IP**, **IP 归属地**, **look up this IP**, or asks where an IP address is located
- Investigating traffic source, deliverability troubleshooting, or geo-fencing decisions

## Prerequisites

- MCP server `sendsoon-connect` running with `ip_lookup` registered
- Environment variable `SENDSOON_API_KEY` set (never commit real keys)

## Tool: `ip_lookup`

### Parameters

| Parameter | Required | Description |
|-----------|----------|--------------|
| `ip` | Yes | Public IPv4 or IPv6 address. Private/reserved/loopback/multicast addresses are rejected. |

### Example

```json
{
  "ip": "8.8.8.8"
}
```

## Success response

```json
{
  "success": true,
  "ip": "8.8.8.8",
  "ip2region": {
    "country": "United States",
    "countryCode": "US",
    "region": "",
    "city": "",
    "postalCode": "",
    "timezone": "",
    "latitude": null,
    "longitude": null
  },
  "network": {
    "isp": "Google LLC",
    "asn": "",
    "organization": "Google LLC"
  },
  "source": "local"
}
```

## Error handling

Always inspect `success`. On failure, use `error.code` and `error.retryable`:

| `error.code` | Action |
|--------------|--------|
| `INVALID_INPUT` | `ip` is empty — provide a valid IP |
| `AUTH_ERROR` | Verify `SENDSOON_API_KEY` is configured or hasn't been revoked |
| `RATE_LIMITED` | Wait and retry if `retryable` is true |
| `SERVER_ERROR` / `NETWORK_ERROR` | Retry later if `retryable` is true |

Do not retry automatically when `retryable` is false — e.g. a private/reserved IP will always fail validation, retrying won't help.

## Out of scope

- Batch IP lookups → call the tool once per IP, no bulk endpoint today
- Client-facing "what's my IP" detection → this tool only looks up an IP you already have
