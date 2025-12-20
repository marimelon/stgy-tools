import { describe, expect, it } from "vitest";
import { decodeStgy, decodeStgyWithInfo } from "../decoder";

describe("decoder", () => {
  describe("decodeStgy", () => {
    it("should throw on invalid prefix", () => {
      expect(() => decodeStgy("invalid string")).toThrow("missing prefix");
    });

    it("should throw on missing suffix", () => {
      expect(() => decodeStgy("[stgy:aXXXXX")).toThrow("missing suffix");
    });

    it("should throw on too short data", () => {
      expect(() => decodeStgy("[stgy:aX]")).toThrow("too short");
    });

    it("should decode valid stgy string", () => {
      const stgyString =
        "[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9+UVD4FhAcsxS5tImN8GsSsHqSfbiqbA-P+yOUQ9unhordXjeMGL9gogzDY+BIgOtPiufNvO85+QJQtQ0HoGATs4AS6KNbAfZ0mBO0j7Xyr7DzEG8fCafOqcmj1p4mq-RTUxIVf5RqM+0GuS+XSB9CIBbHIKJoW3OvB8GEo0Z9+6TbKxdVBGwL5FY53igor8+TrbL7P2mEZwElDFDgDrmoxRYo-tH36+ipeUTp]";
      const result = decodeStgy(stgyString);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return decode info with decodeStgyWithInfo", () => {
      const stgyString =
        "[stgy:a7AIxEt68bIksM7YvDMlkmKJL8iH2Eq-2vDUI+1PGMl9+UVD4FhAcsxS5tImN8GsSsHqSfbiqbA-P+yOUQ9unhordXjeMGL9gogzDY+BIgOtPiufNvO85+QJQtQ0HoGATs4AS6KNbAfZ0mBO0j7Xyr7DzEG8fCafOqcmj1p4mq-RTUxIVf5RqM+0GuS+XSB9CIBbHIKJoW3OvB8GEo0Z9+6TbKxdVBGwL5FY53igor8+TrbL7P2mEZwElDFDgDrmoxRYo-tH36+ipeUTp]";
      const result = decodeStgyWithInfo(stgyString);
      expect(result.data).toBeInstanceOf(Uint8Array);
      expect(result.decompressedLength).toBe(result.data.length);
      expect(result.compressedLength).toBeGreaterThan(0);
    });
  });
});
