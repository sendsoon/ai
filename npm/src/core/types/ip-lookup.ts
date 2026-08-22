import type { SendSoonError } from '../errors.js';

export interface IpLookupRequest {
  ip: string;
}

export interface IpRegionInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postalCode: string;
  timezone: string;
  latitude: number | null;
  longitude: number | null;
}

export interface IpNetworkInfo {
  isp: string;
  asn: string;
  organization: string;
}

export interface IpLookupResultSuccess {
  success: true;
  ip: string;
  ip2region: IpRegionInfo;
  network: IpNetworkInfo;
  source: string;
}

export interface IpLookupResultFailure {
  success: false;
  error: SendSoonError;
}

export type IpLookupResult = IpLookupResultSuccess | IpLookupResultFailure;

export function ipLookupSuccessResult(
  data: Omit<IpLookupResultSuccess, 'success'>,
): IpLookupResultSuccess {
  return { success: true, ...data };
}

export function ipLookupFailureResult(error: SendSoonError): IpLookupResultFailure {
  return { success: false, error };
}
