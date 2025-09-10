export type MaybeProfile = {
  display_name?: string | null;
  name?: string | null;
  handle?: string | null;
} | null | undefined;

export function profileDisplayName(p: MaybeProfile): string {
  if (!p) return '—';
  return p.display_name?.trim()
    || p.name?.trim()
    || (p.handle ? `@${p.handle}` : '—');
}
