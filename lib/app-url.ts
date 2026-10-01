// Absolute base URL for links that leave the app: emails, SMS, public quote
// links and the embed snippet. Set NEXT_PUBLIC_APP_URL to the deployed
// origin (e.g. https://crm-demo.vercel.app). On Vercel, the production
// domain Vercel exposes is used if it's missing, so links still work if the
// variable is forgotten; `next dev` falls back to the local dev server.
function resolveAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const APP_URL = resolveAppUrl();
