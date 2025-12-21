/**
 * SVG座標変換ユーティリティ
 */

import type { Position } from "@/lib/stgy";

/**
 * スクリーン座標をSVG座標に変換
 * @param e ポインターイベント
 * @param svgElement SVG要素
 * @returns SVG座標系での位置
 */
export function screenToSVG(
  e: { clientX: number; clientY: number },
  svgElement: SVGSVGElement
): Position {
  const rect = svgElement.getBoundingClientRect();
  const viewBox = svgElement.viewBox.baseVal;

  // SVGの表示サイズ
  const displayWidth = rect.width;
  const displayHeight = rect.height;

  // viewBoxのサイズ (デフォルトは表示サイズと同じ)
  const viewBoxWidth = viewBox.width || displayWidth;
  const viewBoxHeight = viewBox.height || displayHeight;

  // スケール
  const scaleX = viewBoxWidth / displayWidth;
  const scaleY = viewBoxHeight / displayHeight;

  // SVG座標に変換
  const x = (e.clientX - rect.left) * scaleX + (viewBox.x || 0);
  const y = (e.clientY - rect.top) * scaleY + (viewBox.y || 0);

  return { x, y };
}

/**
 * 2点間の角度を計算 (度数法)
 * @param center 中心点
 * @param point 対象点
 * @returns 角度 (-180 to 180)
 */
export function calculateRotation(center: Position, point: Position): number {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const radians = Math.atan2(dy, dx);
  // ラジアンを度に変換し、SVGの座標系に合わせて調整 (上が0度)
  let degrees = (radians * 180) / Math.PI + 90;
  // -180 to 180 に正規化
  if (degrees > 180) degrees -= 360;
  if (degrees < -180) degrees += 360;
  return Math.round(degrees);
}

/**
 * 位置をキャンバス範囲内にクランプ
 * @param pos 位置
 * @param canvas キャンバスサイズ
 * @returns クランプされた位置
 */
export function clampToCanvas(
  pos: Position,
  canvas: { width: number; height: number }
): Position {
  return {
    x: Math.max(0, Math.min(canvas.width, pos.x)),
    y: Math.max(0, Math.min(canvas.height, pos.y)),
  };
}

/**
 * 位置をグリッドにスナップ
 * @param pos 位置
 * @param gridSize グリッドサイズ
 * @returns スナップされた位置
 */
export function snapToGrid(pos: Position, gridSize: number): Position {
  return {
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  };
}

/**
 * 2点間の距離を計算
 */
export function distance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
