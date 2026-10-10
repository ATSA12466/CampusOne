export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function isToday(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  return date.toDateString() === now.toDateString();
}
