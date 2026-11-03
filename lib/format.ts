/** `YYYY-MM-DD` → `YYYY/MM/DD` */
export function formatDate(date: string): string {
  return date.replaceAll("-", "/");
}
