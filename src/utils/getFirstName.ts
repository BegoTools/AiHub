export function getFirstName(
  displayName?: string | null,
  userMetadata?: { full_name?: string; name?: string } | null,
  email?: string | null
): string {
  const full = displayName
    || userMetadata?.full_name
    || userMetadata?.name
    || email?.split('@')[0]
    || 'User';
  return full.split(' ')[0];
}
