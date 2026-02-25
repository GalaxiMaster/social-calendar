export function formatHour(h: number) {
  const normalized = h % 24;
  const display = normalized % 12 || 12;
  const period = normalized < 12 ? "am" : "pm";
  return `${display} ${period}`;
}

export function toLocalDateFormatted(dateTimeStr: string) {
  return new Date(dateTimeStr).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
