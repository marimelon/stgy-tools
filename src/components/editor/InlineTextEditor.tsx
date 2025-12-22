/**
 * インラインテキストエディタコンポーネント
 *
 * テキストオブジェクトをダブルクリックで直接編集するためのコンポーネント
 */

import { useState, useEffect, useRef } from "react";
import type { BoardObject } from "@/lib/stgy";

interface InlineTextEditorProps {
  /** 編集対象のオブジェクト */
  object: BoardObject;
  /** 編集終了コールバック */
  onEndEdit: (save: boolean, text?: string) => void;
}

/**
 * インラインテキストエディタ
 */
export function InlineTextEditor({ object, onEndEdit }: InlineTextEditorProps) {
  const [text, setText] = useState(object.text ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // 初期フォーカス
  useEffect(() => {
    // 次フレームでフォーカス（foreignObjectのレンダリング待ち）
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // IME入力中は無視
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      onEndEdit(true, text);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onEndEdit(false);
    }
  };

  const handleBlur = () => {
    onEndEdit(true, text);
  };

  // 幅を動的に計算（最小120px、テキスト長に応じて拡張）
  const fontSize = 14 * (object.size / 100);
  const estimatedWidth = Math.max(120, text.length * fontSize * 0.7 + 40);
  const height = fontSize + 16;

  // テキストの色（opacity が 0 の場合は完全不透明として扱う）
  const textOpacity = object.color.opacity === 0 ? 1 : object.color.opacity / 100;
  const textColor = `rgba(${object.color.r}, ${object.color.g}, ${object.color.b}, ${textOpacity})`;

  return (
    <foreignObject
      x={object.position.x - estimatedWidth / 2}
      y={object.position.y - height / 2}
      width={estimatedWidth}
      height={height}
      transform={`rotate(${object.rotation} ${object.position.x} ${object.position.y})`}
      style={{ overflow: "visible" }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        style={{
          width: "100%",
          height: "100%",
          textAlign: "center",
          border: "2px solid #22d3ee",
          borderRadius: "4px",
          backgroundColor: "rgba(30, 41, 59, 0.95)",
          outline: "none",
          padding: "0 8px",
          fontSize: `${fontSize}px`,
          color: textColor,
          boxSizing: "border-box",
        }}
      />
    </foreignObject>
  );
}
