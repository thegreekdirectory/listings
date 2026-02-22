export function formatRelativeDate(inputDate) {
  const now = new Date();
  const date = new Date(inputDate);
  const diffMs = now - date;
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} HR ago`;
  }

  if (diffMs < 14 * day) {
    const days = Math.floor(diffMs / day);
    if (days >= 7) return '1 week ago';
    return `${days} days ago`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return `${date.getFullYear()}`;
}
