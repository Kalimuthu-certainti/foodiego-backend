"use strict";

/**
 * Unit tests for utils/csv.toCsv — header generation + RFC 4180 escaping.
 * Pure function, no store/HTTP involved.
 */

const { toCsv } = require("../../src/utils/csv");

describe("utils/csv toCsv", () => {
  it("emits a header inferred from the first row, then one line per row", () => {
    const csv = toCsv([
      { period: "2026-01", net: 100 },
      { period: "2026-02", net: 250 },
    ]);
    expect(csv).toBe("period,net\n2026-01,100\n2026-02,250");
  });

  it("honors an explicit column order and selects only those columns", () => {
    const csv = toCsv(
      [{ net: 250, period: "2026-02", gross: 300 }],
      ["period", "net"]
    );
    expect(csv).toBe("period,net\n2026-02,250");
  });

  it("renders null and undefined cells as empty", () => {
    const csv = toCsv(
      [{ a: null, b: undefined, c: 0 }],
      ["a", "b", "c"]
    );
    expect(csv).toBe("a,b,c\n,,0");
  });

  it("quotes values containing commas", () => {
    const csv = toCsv([{ name: "Burger, Fries" }]);
    expect(csv).toBe('name\n"Burger, Fries"');
  });

  it("quotes and doubles embedded double-quotes", () => {
    const csv = toCsv([{ name: 'He said "hi"' }]);
    expect(csv).toBe('name\n"He said ""hi"""');
  });

  it("quotes values containing newlines and carriage returns", () => {
    const csv = toCsv([{ note: "line1\nline2" }]);
    expect(csv).toBe('note\n"line1\nline2"');

    const cr = toCsv([{ note: "a\rb" }]);
    expect(cr).toBe('note\n"a\rb"');
  });

  it("does not quote plain values", () => {
    const csv = toCsv([{ name: "Plain Value 123" }]);
    expect(csv).toBe("name\nPlain Value 123");
  });

  it("returns just an empty header line for an empty row set", () => {
    expect(toCsv([])).toBe("");
  });

  it("treats a non-array input as empty", () => {
    expect(toCsv(null)).toBe("");
    expect(toCsv(undefined)).toBe("");
  });

  it("emits only the header when given explicit columns but no rows", () => {
    expect(toCsv([], ["a", "b"])).toBe("a,b");
  });

  it("stringifies non-string scalar values", () => {
    const csv = toCsv(
      [{ active: true, count: 42 }],
      ["active", "count"]
    );
    expect(csv).toBe("active,count\ntrue,42");
  });
});
