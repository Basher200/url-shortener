export function getLinkStatus(link, now = new Date()) {
  if (!link.isActive) return "disabled";
  if (link.expiresAt !== null && link.expiresAt <= now) return "expired";
  return "active";
}