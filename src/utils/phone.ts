import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

export const digitsOnly = (s?: string) => (s ?? "").replace(/\D/g, "");

export const toE164 = (
  raw: string,
  defaultCountry?: CountryCode,
): string | null => {
  try {
    const pn = parsePhoneNumberFromString(raw, defaultCountry);
    return pn ? pn.format("E.164") : null;
  } catch {
    return null;
  }
};
