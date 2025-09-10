export function logSb(label: string, resp: any) {
  const { status, statusText, error } = resp || {};
  // eslint-disable-next-line no-console
  console.group(`[supabase] ${label}`);
  // eslint-disable-next-line no-console
  console.log('status:', status, statusText);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('error.message:', error.message);
    // eslint-disable-next-line no-console
    console.error('error.code:', error.code);
    // eslint-disable-next-line no-console
    console.error('error.hint:', (error as any)?.hint);
    // eslint-disable-next-line no-console
    console.error('error.details:', (error as any)?.details);
  }
  // eslint-disable-next-line no-console
  console.groupEnd();
}
