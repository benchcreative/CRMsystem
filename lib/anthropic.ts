import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// Built lazily rather than at module load, matching lib/twilio.ts: a
// missing API key should surface as a caught, logged failure at send time,
// not a crash on import.
export function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}
