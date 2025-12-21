/**
 * stgy コードから SVG 画像を生成して返す API エンドポイント
 *
 * GET /api/image?code=[stgy:a...]
 */

import { defineEventHandler, getQuery, createError, setHeader } from "h3";
import { decodeStgy } from "../../src/lib/stgy/decoder";
import { parseBoardData } from "../../src/lib/stgy/parser";
import { renderBoardToSVG } from "../utils/svgRenderer";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string | undefined;

  if (!code) {
    throw createError({
      statusCode: 400,
      message: "Missing required query parameter: code",
    });
  }

  try {
    // 1. stgy コードをデコード
    const binary = decodeStgy(code);

    // 2. バイナリをパース
    const boardData = parseBoardData(binary);

    // 3. SVG を生成
    const svg = renderBoardToSVG(boardData);

    // 4. SVG として返す
    setHeader(event, "Content-Type", "image/svg+xml");
    setHeader(event, "Cache-Control", "public, max-age=86400"); // 1日キャッシュ

    return svg;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 400,
      message: `Failed to decode stgy code: ${message}`,
    });
  }
});

