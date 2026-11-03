/**
 * 実在する年月日かを判定する。
 * Date.UTC / new Date(y, ...) は年 0〜99 を 1900 年代に読み替えるため使わず、
 * setUTCFullYear で組み立ててから成分を照合する。
 */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(0);
  dt.setUTCFullYear(year, month - 1, day);
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` 形式で、かつ実在する日付か */
export function isValidDateString(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  return isRealDate(Number(m[1]), Number(m[2]), Number(m[3]));
}

const DATETIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/;

/** UTC の ISO 8601 形式（`YYYY-MM-DDTHH:mm:ss(.sss)Z`）で、かつ実在する日時か */
export function isValidUtcDateTime(value: string): boolean {
  const m = DATETIME_RE.exec(value);
  if (!m) return false;
  const [hour, minute, second] = [Number(m[4]), Number(m[5]), Number(m[6])];
  if (hour > 23 || minute > 59 || second > 59) return false;
  return isRealDate(Number(m[1]), Number(m[2]), Number(m[3]));
}
