import { describe, expect, it } from "vitest";
import { isUuid, validateHouse, validateMessage, validateName } from "@/lib/validate";

describe("validateName", () => {
  it("rejects 1 character", () => {
    expect(validateName("A")).toBeNull();
  });
  it("accepts 2 characters", () => {
    expect(validateName("Ab")).toBe("Ab");
  });
  it("accepts Thai names", () => {
    expect(validateName("ป้านภา")).toBe("ป้านภา");
  });
  it("rejects 31 characters", () => {
    expect(validateName("a".repeat(31))).toBeNull();
  });
  it("accepts 30 characters", () => {
    expect(validateName("a".repeat(30))).toBe("a".repeat(30));
  });
  it("trims surrounding whitespace", () => {
    expect(validateName("  Napa  ")).toBe("Napa");
  });
});

describe("validateHouse", () => {
  it("accepts up to 20 characters", () => {
    expect(validateHouse("a".repeat(20))).toBe("a".repeat(20));
  });
  it("rejects 21 characters", () => {
    expect(validateHouse("a".repeat(21))).toBeNull();
  });
  it("returns null for empty (optional)", () => {
    expect(validateHouse("")).toBeNull();
    expect(validateHouse("   ")).toBeNull();
  });
  it("trims before validating", () => {
    expect(validateHouse(" 88/4 ")).toBe("88/4");
  });
});

describe("validateMessage", () => {
  it("rejects empty after trim", () => {
    expect(validateMessage("")).toBeNull();
    expect(validateMessage("   ")).toBeNull();
  });
  it("accepts 1 character", () => {
    expect(validateMessage("a")).toBe("a");
  });
  it("accepts 500 characters", () => {
    expect(validateMessage("a".repeat(500))).toBe("a".repeat(500));
  });
  it("rejects 501 characters", () => {
    expect(validateMessage("a".repeat(501))).toBeNull();
  });
});

describe("isUuid", () => {
  it("accepts a well-formed uuid", () => {
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
  });
  it("rejects non-uuid strings", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
  it("rejects non-string values", () => {
    expect(isUuid(123)).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
