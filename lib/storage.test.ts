import { describe, expect, it, vi } from "vitest";
import { NOT_FOUND, loadRecords, mutateRecords, writeRecords } from "./storage";
import { STORAGE_KEY, type StoredRecord } from "./types";

const record: StoredRecord = {
  id: "a1",
  category: "映画",
  title: "君の名は",
  createdAt: "2026-11-01T03:17:13.000Z",
};

function mockStorage(initial: string | null) {
  let value = initial;
  return {
    getItem: vi.fn((key: string) => (key === STORAGE_KEY ? value : null)),
    setItem: vi.fn((_key: string, v: string) => {
      value = v;
    }),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: 0,
    get current() {
      return value;
    },
  };
}

const asStorage = (s: ReturnType<typeof mockStorage>) => s as unknown as Storage;

describe("loadRecords", () => {
  it("キーがない → ok と []。setItem は呼ばれない", () => {
    const s = mockStorage(null);
    expect(loadRecords(asStorage(s))).toEqual({ status: "ok", records: [] });
    expect(s.setItem).not.toHaveBeenCalled();
  });

  it("正常データ → ok", () => {
    const s = mockStorage(JSON.stringify([record]));
    expect(loadRecords(asStorage(s))).toEqual({ status: "ok", records: [record] });
  });

  it("不正な JSON → corrupt。setItem は呼ばれない", () => {
    const s = mockStorage("{not json");
    expect(loadRecords(asStorage(s)).status).toBe("corrupt");
    expect(s.setItem).not.toHaveBeenCalled();
    expect(s.current).toBe("{not json");
  });

  it("配列でない → corrupt", () => {
    const s = mockStorage("{}");
    expect(loadRecords(asStorage(s)).status).toBe("corrupt");
  });

  it('tags ["旅行", " 旅行"] → corrupt。元の文字列は不変', () => {
    const raw = JSON.stringify([{ ...record, tags: ["旅行", " 旅行"] }]);
    const s = mockStorage(raw);
    expect(loadRecords(asStorage(s)).status).toBe("corrupt");
    expect(s.setItem).not.toHaveBeenCalled();
    expect(s.getItem(STORAGE_KEY)).toBe(raw);
  });

  it("getItem が例外 → readError", () => {
    const s = mockStorage(null);
    s.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(loadRecords(asStorage(s))).toEqual({ status: "readError" });
    expect(s.setItem).not.toHaveBeenCalled();
  });

  it("Storage 自体が使えない → readError", () => {
    expect(loadRecords(null)).toEqual({ status: "readError" });
  });
});

describe("writeRecords", () => {
  it("setItem が例外 → ok: false で元の値が残る", () => {
    const raw = JSON.stringify([record]);
    const s = mockStorage(raw);
    s.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(writeRecords(asStorage(s), [])).toEqual({ ok: false });
    expect(s.current).toBe(raw);
  });
});

describe("mutateRecords", () => {
  it("最新データに操作を適用して書き込む", () => {
    const s = mockStorage(JSON.stringify([record]));
    const added = { ...record, id: "b2" };
    const result = mutateRecords(asStorage(s), (fresh) => [...fresh, added]);
    expect(result).toEqual({ status: "ok", records: [record, added] });
    expect(JSON.parse(s.current!)).toEqual([record, added]);
  });

  it("読み直したデータが破損 → 書き込まず、操作も呼ばない", () => {
    const s = mockStorage("[1]");
    const op = vi.fn(() => []);
    expect(mutateRecords(asStorage(s), op).status).toBe("corrupt");
    expect(op).not.toHaveBeenCalled();
    expect(s.setItem).not.toHaveBeenCalled();
    expect(s.current).toBe("[1]");
  });

  it("読み込み例外 → readError で書き込まない", () => {
    const s = mockStorage("[]");
    s.getItem.mockImplementation(() => {
      throw new Error("x");
    });
    expect(mutateRecords(asStorage(s), () => []).status).toBe("readError");
    expect(s.setItem).not.toHaveBeenCalled();
  });

  it("書き込み失敗 → writeError で元の値が残る", () => {
    const raw = JSON.stringify([record]);
    const s = mockStorage(raw);
    s.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(mutateRecords(asStorage(s), () => []).status).toBe("writeError");
    expect(s.current).toBe(raw);
  });

  it("NOT_FOUND → notFound と最新データを返し、書き込まない", () => {
    const s = mockStorage(JSON.stringify([record]));
    const result = mutateRecords(asStorage(s), () => NOT_FOUND);
    expect(result).toEqual({ status: "notFound", records: [record] });
    expect(s.setItem).not.toHaveBeenCalled();
  });
});
