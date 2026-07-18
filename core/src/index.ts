export {
  SendSoonClient,
  defaultClient,
  ipLookup,
  markitdownConvert,
  sendEmail,
} from './client.js';
export { loadConfig, type SendSoonConfig } from './config.js';
export {
  SendSoonErrorCode,
  createError,
  mapHttpError,
  mapNetworkError,
  mapValidationError,
  type SendSoonError,
  type SendSoonErrorCode as SendSoonErrorCodeType,
} from './errors.js';
export { httpRequest, type HttpRequestOptions, type HttpResponse } from './http.js';
export {
  ipLookupFailureResult,
  ipLookupSuccessResult,
  type IpLookupRequest,
  type IpLookupResult,
  type IpLookupResultFailure,
  type IpLookupResultSuccess,
  type IpNetworkInfo,
  type IpRegionInfo,
} from './types/ip-lookup.js';
export {
  MAX_MARKITDOWN_FILE_BYTES,
  markitdownFailureResult,
  markitdownSuccessResult,
  type MarkitdownConvertRequest,
  type MarkitdownConvertResult,
  type MarkitdownConvertResultFailure,
  type MarkitdownConvertResultSuccess,
} from './types/markitdown.js';
export {
  MAX_BODY_LENGTH,
  MAX_FROM_ALIAS_LENGTH,
  MAX_SUBJECT_LENGTH,
  type ContentType,
  type SendRequest,
} from './types/send-request.js';
export {
  failureResult,
  successResult,
  type SendResult,
  type SendResultFailure,
  type SendResultSuccess,
} from './types/send-result.js';
