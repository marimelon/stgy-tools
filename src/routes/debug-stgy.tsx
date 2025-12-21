/**
 * stgy エンコーダー/デコーダー デバッグページ
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  decodeStgyDebug,
  compareStgy,
  hexDump,
  parseBoardData,
  encodeStgy,
  extractKeyFromStgy,
  type DecodeDebugInfo,
  type CompareResult,
} from "@/lib/stgy";
import { recalculateBoardSize } from "@/lib/editor";

export const Route = createFileRoute("/debug-stgy")({
  component: StgyDebugPage,
});

function StgyDebugPage() {
  const [inputCode, setInputCode] = useState("");
  const [compareCode, setCompareCode] = useState("");
  const [activeTab, setActiveTab] = useState<"decode" | "compare">("decode");

  const debugInfo = useMemo((): DecodeDebugInfo | null => {
    if (!inputCode.trim()) return null;
    try {
      return decodeStgyDebug(inputCode.trim());
    } catch (e) {
      console.error("Decode error:", e);
      return null;
    }
  }, [inputCode]);

  const boardData = useMemo(() => {
    if (!debugInfo) return null;
    try {
      return parseBoardData(debugInfo.decompressedData);
    } catch (e) {
      console.error("Parse error:", e);
      return null;
    }
  }, [debugInfo]);

  const reEncodedCode = useMemo(() => {
    if (!boardData) return null;
    try {
      const key = extractKeyFromStgy(inputCode.trim());
      const { width, height } = recalculateBoardSize(boardData);
      const adjustedBoard = { ...boardData, width, height };
      return encodeStgy(adjustedBoard, { key });
    } catch (e) {
      console.error("Encode error:", e);
      return null;
    }
  }, [boardData, inputCode]);

  const roundTripResult = useMemo((): CompareResult | null => {
    if (!inputCode.trim() || !reEncodedCode) return null;
    return compareStgy(inputCode.trim(), reEncodedCode);
  }, [inputCode, reEncodedCode]);

  const manualCompareResult = useMemo((): CompareResult | null => {
    if (!inputCode.trim() || !compareCode.trim()) return null;
    return compareStgy(inputCode.trim(), compareCode.trim());
  }, [inputCode, compareCode]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold">stgy Encoder/Decoder Debug</h1>
        <p className="text-slate-400 text-sm mt-1">
          stgyコードの解析・比較・ラウンドトリップテスト
        </p>
      </header>

      <main className="p-4 space-y-4">
        {/* 入力エリア */}
        <section className="bg-slate-800 rounded-lg p-4">
          <label className="block text-sm text-slate-300 mb-2">
            stgyコードを入力:
          </label>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="[stgy:a...]"
            className="w-full h-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-cyan-500"
          />
        </section>

        {/* タブ切り替え */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("decode")}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === "decode"
                ? "bg-cyan-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Decode Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compare")}
            className={`px-4 py-2 rounded text-sm ${
              activeTab === "compare"
                ? "bg-cyan-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Compare
          </button>
        </div>

        {activeTab === "decode" && debugInfo && (
          <div className="space-y-4">
            {/* 基本情報 */}
            <Section title="Basic Info">
              <InfoRow label="Key" value={`${debugInfo.key} (char: '${debugInfo.keyChar}')`} />
              <InfoRow label="CRC32 Stored" value={`0x${debugInfo.crc32Stored.toString(16).padStart(8, "0")}`} />
              <InfoRow label="CRC32 Calculated" value={`0x${debugInfo.crc32Calculated.toString(16).padStart(8, "0")}`} />
              <InfoRow label="CRC32 Match" value={debugInfo.crc32Stored === debugInfo.crc32Calculated ? "Yes" : "NO - MISMATCH!"} />
              <InfoRow label="Compressed Size" value={`${debugInfo.compressedData.length} bytes`} />
              <InfoRow label="Decompressed Size" value={`${debugInfo.decompressedData.length} bytes (expected: ${debugInfo.decompressedLength})`} />
            </Section>

            {/* ヘッダー */}
            <Section title="Header">
              <InfoRow label="Version" value={debugInfo.header.version.toString()} />
              <InfoRow label="Width" value={debugInfo.header.width.toString()} />
              <InfoRow label="Height" value={debugInfo.header.height.toString()} />
            </Section>

            {/* フィールド一覧 */}
            <Section title="Fields">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {debugInfo.fields.map((field, i) => (
                  <FieldRow key={i} field={field} />
                ))}
              </div>
            </Section>

            {/* パースされたデータ */}
            {boardData && (
              <Section title="Parsed BoardData">
                <pre className="text-xs font-mono bg-slate-700 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(boardData, null, 2)}
                </pre>
              </Section>
            )}

            {/* ラウンドトリップ結果 */}
            <Section title="Round-trip Test">
              {roundTripResult ? (
                <div className="space-y-2">
                  <InfoRow
                    label="Match"
                    value={roundTripResult.match ? "Yes - Perfect match!" : "No - Mismatch"}
                    highlight={!roundTripResult.match}
                  />
                  <InfoRow
                    label="Binary Match"
                    value={roundTripResult.binaryMatch ? "Yes" : "No"}
                    highlight={!roundTripResult.binaryMatch}
                  />
                  {roundTripResult.binaryDiff.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-slate-400 mb-1">
                        Binary differences ({roundTripResult.binaryDiff.length}):
                      </div>
                      <div className="text-xs font-mono bg-slate-700 p-2 rounded max-h-32 overflow-y-auto">
                        {roundTripResult.binaryDiff.slice(0, 20).map((d, i) => (
                          <div key={i}>
                            offset {d.offset.toString(16).padStart(4, "0")}: {d.original.toString(16).padStart(2, "0")} {"-> "} {d.reEncoded.toString(16).padStart(2, "0")}
                          </div>
                        ))}
                        {roundTripResult.binaryDiff.length > 20 && (
                          <div>... and {roundTripResult.binaryDiff.length - 20} more</div>
                        )}
                      </div>
                    </div>
                  )}
                  {reEncodedCode && (
                    <div className="mt-2">
                      <div className="text-sm text-slate-400 mb-1">Re-encoded code:</div>
                      <textarea
                        readOnly
                        value={reEncodedCode}
                        className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-xs font-mono resize-none"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">Enter a valid stgy code to test</div>
              )}
            </Section>

            {/* バイナリダンプ */}
            <Section title="Binary Hex Dump (Decompressed)">
              <pre className="text-xs font-mono bg-slate-700 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
                {hexDump(debugInfo.decompressedData)}
              </pre>
            </Section>

            {/* Base64ペイロード */}
            <Section title="Base64 Payload (after decryption)">
              <textarea
                readOnly
                value={debugInfo.base64Payload}
                className="w-full h-20 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-xs font-mono resize-none"
              />
            </Section>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-4">
            <Section title="Compare with another code">
              <label className="block text-sm text-slate-300 mb-2">
                比較対象のstgyコード:
              </label>
              <textarea
                value={compareCode}
                onChange={(e) => setCompareCode(e.target.value)}
                placeholder="[stgy:a...]"
                className="w-full h-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 text-sm font-mono resize-none focus:outline-none focus:border-cyan-500"
              />
            </Section>

            {manualCompareResult && (
              <Section title="Comparison Result">
                <div className="space-y-2">
                  <InfoRow
                    label="String Match"
                    value={manualCompareResult.match ? "Yes - Identical!" : "No - Different"}
                    highlight={!manualCompareResult.match}
                  />
                  <InfoRow label="Original Key" value={manualCompareResult.originalKey.toString()} />
                  <InfoRow label="Compare Key" value={manualCompareResult.reEncodedKey.toString()} />
                  <InfoRow
                    label="Binary Match"
                    value={manualCompareResult.binaryMatch ? "Yes" : "No"}
                    highlight={!manualCompareResult.binaryMatch}
                  />
                  {manualCompareResult.binaryDiff.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm text-slate-400 mb-1">
                        Binary differences ({manualCompareResult.binaryDiff.length}):
                      </div>
                      <div className="text-xs font-mono bg-slate-700 p-2 rounded max-h-64 overflow-y-auto">
                        {manualCompareResult.binaryDiff.map((d, i) => (
                          <div key={i}>
                            offset {d.offset.toString(16).padStart(4, "0")}: {d.original.toString(16).padStart(2, "0")} {"-> "} {d.reEncoded.toString(16).padStart(2, "0")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>
        )}

        {!debugInfo && inputCode.trim() && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            Failed to decode the stgy string. Please check the format.
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-slate-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-slate-200 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-slate-400 w-36">{label}:</span>
      <span className={highlight ? "text-red-400 font-semibold" : "text-slate-200"}>
        {value}
      </span>
    </div>
  );
}

function FieldRow({ field }: { field: { offset: number; fieldId: number; fieldName: string; description: string; rawData: Uint8Array } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-700 rounded p-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left flex items-center gap-2"
      >
        <span className="text-cyan-400 font-mono text-xs w-16">
          @{field.offset.toString(16).padStart(4, "0")}
        </span>
        <span className="text-yellow-400 font-mono text-xs w-8">
          F{field.fieldId}
        </span>
        <span className="text-slate-200 text-sm flex-1">{field.description}</span>
        <span className="text-slate-500 text-xs">{expanded ? "-" : "+"}</span>
      </button>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-slate-600">
          <div className="text-xs font-mono text-slate-400 break-all">
            Raw: {Array.from(field.rawData).map((b) => b.toString(16).padStart(2, "0")).join(" ")}
          </div>
        </div>
      )}
    </div>
  );
}
