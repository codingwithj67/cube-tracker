// Builds an absolute URL from wherever the app is actually running, so the
// QR always resolves correctly once deployed — no placeholder domain to
// remember to swap in later, and it works the same on any Vercel preview
// URL, the production domain, or localhost during dev.
export function buildQrUrl(id: string): string {
  return `${window.location.origin}/u/${id}`;
}
