import { describe, expect, it } from "vitest";
import {
  ALPHABET_TABLE,
  KEY_TABLE,
  base64CharToValue,
  valueToBase64Char,
} from "../tables";

describe("tables", () => {
  describe("base64CharToValue", () => {
    it("should convert A-Z to 0-25", () => {
      expect(base64CharToValue("A")).toBe(0);
      expect(base64CharToValue("Z")).toBe(25);
      expect(base64CharToValue("M")).toBe(12);
    });

    it("should convert a-z to 26-51", () => {
      expect(base64CharToValue("a")).toBe(26);
      expect(base64CharToValue("z")).toBe(51);
      expect(base64CharToValue("m")).toBe(38);
    });

    it("should convert 0-9 to 52-61", () => {
      expect(base64CharToValue("0")).toBe(52);
      expect(base64CharToValue("9")).toBe(61);
      expect(base64CharToValue("5")).toBe(57);
    });

    it("should convert - to 62", () => {
      expect(base64CharToValue("-")).toBe(62);
    });

    it("should convert _ to 63", () => {
      expect(base64CharToValue("_")).toBe(63);
    });

    it("should throw on invalid character", () => {
      expect(() => base64CharToValue("!")).toThrow();
    });
  });

  describe("valueToBase64Char", () => {
    it("should convert 0-25 to A-Z", () => {
      expect(valueToBase64Char(0)).toBe("A");
      expect(valueToBase64Char(25)).toBe("Z");
      expect(valueToBase64Char(12)).toBe("M");
    });

    it("should convert 26-51 to a-z", () => {
      expect(valueToBase64Char(26)).toBe("a");
      expect(valueToBase64Char(51)).toBe("z");
      expect(valueToBase64Char(38)).toBe("m");
    });

    it("should convert 52-61 to 0-9", () => {
      expect(valueToBase64Char(52)).toBe("0");
      expect(valueToBase64Char(61)).toBe("9");
      expect(valueToBase64Char(57)).toBe("5");
    });

    it("should convert 62 to -", () => {
      expect(valueToBase64Char(62)).toBe("-");
    });

    it("should convert 63 to _", () => {
      expect(valueToBase64Char(63)).toBe("_");
    });

    it("should throw on invalid value", () => {
      expect(() => valueToBase64Char(-1)).toThrow();
      expect(() => valueToBase64Char(64)).toThrow();
    });
  });

  describe("round trip", () => {
    it("should convert back and forth correctly", () => {
      for (let i = 0; i < 64; i++) {
        const char = valueToBase64Char(i);
        const value = base64CharToValue(char);
        expect(value).toBe(i);
      }
    });
  });

  describe("KEY_TABLE", () => {
    it("should have entries for all valid key characters", () => {
      // Some sample checks
      expect(KEY_TABLE["+"]).toBe("N");
      expect(KEY_TABLE["-"]).toBe("P");
      expect(KEY_TABLE.A).toBe("D");
      expect(KEY_TABLE.a).toBe("i");
      expect(KEY_TABLE["0"]).toBe("x");
    });
  });

  describe("ALPHABET_TABLE", () => {
    it("should have entries for custom alphabet", () => {
      // Some sample checks
      expect(ALPHABET_TABLE.b).toBe("-");
      expect(ALPHABET_TABLE["2"]).toBe("0");
      expect(ALPHABET_TABLE.f).toBe("A");
    });
  });
});
