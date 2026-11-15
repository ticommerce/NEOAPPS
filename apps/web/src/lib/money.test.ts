import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyToCents } from "./money";

describe("parseMoneyToCents", () => {
  it.each([
    ["3500", 350000],
    ["3 500", 350000],
    ["₡3.500", 350000],
    ["3,500", 350000],
    ["12.50", 1250],
    ["12,5", 1250],
    ["1.234,50", 123450],
    ["1,234.50", 123450],
    ["1.234.567", 123456700],
    ["0", 0],
  ])("%s -> %i", (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-5", "1.2345", "12,3,4x"])("rechaza %j", (input) => {
    expect(parseMoneyToCents(input)).toBeNull();
  });
});

describe("formatMoney", () => {
  it("muestra colones sin decimales cuando son enteros", () => {
    expect(formatMoney(350000).replace(/\s/g, " ")).toBe("₡3 500");
  });
  it("muestra decimales cuando hacen falta", () => {
    expect(formatMoney(1250, "USD", "en-US")).toBe("$12.50");
  });
});
