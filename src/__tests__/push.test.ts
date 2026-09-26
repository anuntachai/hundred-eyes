import { describe, expect, it } from "vitest";
import { urlBase64ToUint8Array } from "@/lib/push";

describe("urlBase64ToUint8Array", () => {
  it("decodes a known vector", () => {
    expect(Array.from(urlBase64ToUint8Array("AQID"))).toEqual([1, 2, 3]);
  });

  it("adds padding when needed", () => {
    expect(Array.from(urlBase64ToUint8Array("AQ"))).toEqual([1]);
    expect(Array.from(urlBase64ToUint8Array("AQIDBA"))).toEqual([1, 2, 3, 4]);
  });

  it("converts url-safe characters - and _ to + and /", () => {
    expect(Array.from(urlBase64ToUint8Array("--__"))).toEqual([0xfb, 0xef, 0xff]);
  });
});
