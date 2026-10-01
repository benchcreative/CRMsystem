import type { Source } from "@prisma/client";

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

// Public input — cap it so a crafted link can't stuff arbitrarily long
// strings into the database.
const MAX_UTM_LENGTH = 200;

export function cleanUtmValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, MAX_UTM_LENGTH);
  return trimmed || null;
}

export function pickUtmParams(
  params: Record<string, string | string[] | undefined>
): UtmParams {
  const utm: UtmParams = {};
  for (const key of UTM_KEYS) {
    const raw = params[key];
    const value = cleanUtmValue(Array.isArray(raw) ? raw[0] : raw);
    if (value) utm[key] = value;
  }
  return utm;
}

const SOURCE_ALIASES: Record<string, Source> = {
  facebook: "facebook",
  fb: "facebook",
  instagram: "facebook",
  meta: "facebook",
  google: "google",
};

export function sourceFromUtm(utmSource: string | null): Source {
  if (!utmSource) return "website";
  return SOURCE_ALIASES[utmSource.trim().toLowerCase()] ?? "website";
}
