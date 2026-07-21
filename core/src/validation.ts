import { isIP } from 'node:net';
import { SendSoonErrorCode, createError, type SendSoonError } from './errors.js';
import {
  MAX_MARKITDOWN_FILE_BYTES,
  type MarkitdownConvertRequest,
} from './types/markitdown.js';
import {
  MAX_BODY_LENGTH,
  MAX_FROM_ALIAS_LENGTH,
  MAX_SUBJECT_LENGTH,
  type SendRequest,
} from './types/send-request.js';

const SUPPORTED_MARKITDOWN_EXTENSIONS = new Set([
  '.pdf', '.pptx', '.docx', '.xlsx', '.xls', '.jpg', '.jpeg', '.png',
  '.gif', '.bmp', '.tiff', '.mp3', '.wav', '.m4a', '.html', '.htm',
  '.csv', '.json', '.xml', '.zip', '.epub', '.txt', '.md',
]);

function ipv4Bytes(address: string): number[] {
  return address.split('.').map(Number);
}

function isPublicIpv4(address: string): boolean {
  const [a, b, c] = ipv4Bytes(address);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function expandIpv6(address: string): number[] | null {
  const normalized = address.toLowerCase().split('%')[0];
  const [leftRaw, rightRaw, ...extra] = normalized.split('::');
  if (extra.length > 0) {
    return null;
  }

  const parseSide = (side: string): number[] | null => {
    if (!side) return [];
    const result: number[] = [];
    for (const part of side.split(':')) {
      if (part.includes('.')) {
        if (isIP(part) !== 4) return null;
        const bytes = ipv4Bytes(part);
        result.push(bytes[0] * 256 + bytes[1], bytes[2] * 256 + bytes[3]);
      } else if (/^[0-9a-f]{1,4}$/.test(part)) {
        result.push(Number.parseInt(part, 16));
      } else {
        return null;
      }
    }
    return result;
  };

  const left = parseSide(leftRaw);
  const right = parseSide(rightRaw ?? '');
  if (!left || !right) return null;

  if (rightRaw === undefined) {
    return left.length === 8 ? left : null;
  }

  const missing = 8 - left.length - right.length;
  return missing >= 1 ? [...left, ...Array<number>(missing).fill(0), ...right] : null;
}

function isPublicIpv6(address: string): boolean {
  const groups = expandIpv6(address);
  if (!groups) return false;

  const [first, second] = groups;
  const allZero = groups.every((group) => group === 0);
  const loopback = groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1;
  const mappedIpv4 = groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff;
  if (mappedIpv4) {
    const embedded = `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
    return isPublicIpv4(embedded);
  }

  if ((first & 0xe000) !== 0x2000) return false;

  return !(
    allZero ||
    loopback ||
    (first & 0xfe00) === 0xfc00 ||
    (first & 0xffc0) === 0xfe80 ||
    (first & 0xff00) === 0xff00 ||
    (first === 0x2001 && second === 0x0db8) ||
    (first === 0x0100 && second === 0)
  );
}

export function validatePublicIp(ip: string): SendSoonError | null {
  const version = isIP(ip);
  if (version === 0) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'ip must be a valid IPv4 or IPv6 address.');
  }

  const isPublic = version === 4 ? isPublicIpv4(ip) : isPublicIpv6(ip);
  return isPublic
    ? null
    : createError(
        SendSoonErrorCode.INVALID_INPUT,
        'ip must be public; private, reserved, loopback, link-local, and multicast addresses are not supported.',
      );
}

export function validateSendRequest(request: SendRequest): SendSoonError | null {
  const email = request.to.trim();
  const at = email.lastIndexOf('@');
  const local = at > 0 ? email.slice(0, at) : '';
  const domain = at > 0 ? email.slice(at + 1) : '';
  const validDomain = domain.length <= 253 && domain.split('.').length >= 2 &&
    domain.split('.').every((label) =>
      label.length > 0 && label.length <= 63 &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label),
    );
  if (
    email.length > 254 || local.length > 64 || !local ||
    local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
    /[\s@]/.test(local) || !validDomain
  ) {
    return createError(SendSoonErrorCode.INVALID_RECIPIENT);
  }
  if (!request.subject.trim()) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'Subject is required and cannot be empty.');
  }
  if (request.subject.length > MAX_SUBJECT_LENGTH) {
    return createError(SendSoonErrorCode.INVALID_INPUT, `Subject must be at most ${MAX_SUBJECT_LENGTH} characters.`);
  }
  if (!request.body.trim()) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'Body is required and cannot be empty.');
  }
  if (Buffer.byteLength(request.body, 'utf8') > MAX_BODY_LENGTH) {
    return createError(SendSoonErrorCode.PAYLOAD_TOO_LARGE);
  }
  if (request.from_alias && request.from_alias.length > MAX_FROM_ALIAS_LENGTH) {
    return createError(SendSoonErrorCode.INVALID_INPUT, `from_alias must be at most ${MAX_FROM_ALIAS_LENGTH} characters.`);
  }
  if (request.idempotency_key !== undefined) {
    const key = request.idempotency_key.trim();
    if (!key || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
      return createError(
        SendSoonErrorCode.INVALID_INPUT,
        'idempotency_key must be 1-128 characters using letters, numbers, dot, underscore, colon, or hyphen.',
      );
    }
  }
  return null;
}

function normalizeBase64(value: string): string | null {
  const normalized = value.replace(/\s/g, '');
  if (!normalized || /[^A-Za-z0-9+/=]/.test(normalized) || /=/.test(normalized.slice(0, -2))) {
    return null;
  }
  if (normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    return null;
  }
  const decoded = Buffer.from(normalized, 'base64');
  const canonical = decoded.toString('base64').replace(/=+$/, '');
  return canonical === normalized.replace(/=+$/, '') ? normalized : null;
}

export function decodedBase64ByteLength(value: string): number | null {
  const normalized = normalizeBase64(value);
  return normalized === null ? null : Buffer.from(normalized, 'base64').byteLength;
}

export function validateMarkitdownRequest(request: MarkitdownConvertRequest): SendSoonError | null {
  const filename = request.filename.trim();
  if (!filename) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'filename is required and cannot be empty.');
  }
  if (filename.includes('/') || filename.includes('\\') || filename.includes('\0')) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'filename must be a base name without path separators.');
  }
  const dot = filename.lastIndexOf('.');
  const extension = dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  if (!SUPPORTED_MARKITDOWN_EXTENSIONS.has(extension)) {
    return createError(SendSoonErrorCode.INVALID_INPUT, `Unsupported file extension: ${extension || '(none)'}.`);
  }

  const byteLength = decodedBase64ByteLength(request.content_base64);
  if (byteLength === null) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'content_base64 must contain valid Base64 data.');
  }
  if (byteLength === 0) {
    return createError(SendSoonErrorCode.INVALID_INPUT, 'The file cannot be empty.');
  }
  if (byteLength > MAX_MARKITDOWN_FILE_BYTES) {
    return createError(SendSoonErrorCode.PAYLOAD_TOO_LARGE);
  }
  return null;
}

export function validateBaseUrl(baseUrl: string): SendSoonError | null {
  try {
    const url = new URL(baseUrl);
    const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
      return createError(SendSoonErrorCode.INVALID_CONFIG, 'SENDSOON_API_BASE_URL must use HTTPS (HTTP is allowed only for localhost).');
    }
    if (url.username || url.password) {
      return createError(SendSoonErrorCode.INVALID_CONFIG, 'SENDSOON_API_BASE_URL must not include credentials.');
    }
    if (url.search || url.hash) {
      return createError(SendSoonErrorCode.INVALID_CONFIG, 'SENDSOON_API_BASE_URL must not include a query string or fragment.');
    }
    return null;
  } catch {
    return createError(SendSoonErrorCode.INVALID_CONFIG, 'SENDSOON_API_BASE_URL must be a valid URL.');
  }
}

export const MARKITDOWN_EXTENSIONS = [...SUPPORTED_MARKITDOWN_EXTENSIONS];
