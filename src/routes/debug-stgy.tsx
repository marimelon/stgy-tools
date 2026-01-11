/**
 * stgy encoder/decoder debug page
 */

import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { DebugHeader } from "@/components/debug/DebugHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateDebugPageMeta } from "@/lib/seo";
import {
	assignBoardObjectIds,
	type CompareResult,
	compareStgy,
	type DecodeDebugInfo,
	decodeStgyDebug,
	encodeStgy,
	hexDump,
	parseBoardData,
} from "@/lib/stgy";

const seo = generateDebugPageMeta("stgy Encoder/Decoder Debug");

export const Route = createFileRoute("/debug-stgy")({
	component: StgyDebugPage,
	head: () => seo,
});

function StgyDebugPage() {
	const [inputCode, setInputCode] = useState("");
	const [compareCode, setCompareCode] = useState("");
	const [activeTab, setActiveTab] = useState<"decode" | "compare">("decode");
	const inputCodeId = useId();
	const compareCodeId = useId();

	const debugInfo = ((): DecodeDebugInfo | null => {
		if (!inputCode.trim()) return null;
		try {
			return decodeStgyDebug(inputCode.trim());
		} catch (e) {
			console.error("Decode error:", e);
			return null;
		}
	})();

	const boardData = (() => {
		if (!debugInfo) return null;
		try {
			const parsed = parseBoardData(debugInfo.decompressedData);
			return assignBoardObjectIds(parsed);
		} catch (e) {
			console.error("Parse error:", e);
			return null;
		}
	})();

	const reEncodedCode = ((): string | null => {
		if (!boardData) return null;
		try {
			return encodeStgy(boardData);
		} catch (e) {
			console.error("Encode error:", e);
			return null;
		}
	})();

	const roundTripResult = ((): CompareResult | null => {
		if (!inputCode.trim() || !reEncodedCode) return null;
		return compareStgy(inputCode.trim(), reEncodedCode);
	})();

	const manualCompareResult = ((): CompareResult | null => {
		if (!inputCode.trim() || !compareCode.trim()) return null;
		return compareStgy(inputCode.trim(), compareCode.trim());
	})();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<DebugHeader
				title="stgy Encoder/Decoder Debug"
				description="stgy code analysis, comparison, and round-trip testing"
			/>

			<main className="p-4 space-y-4 max-w-6xl mx-auto">
				<section className="bg-card border border-border rounded-lg p-4">
					<Label htmlFor={inputCodeId} className="mb-2 block">
						Enter stgy code:
					</Label>
					<Textarea
						id={inputCodeId}
						value={inputCode}
						onChange={(e) => setInputCode(e.target.value)}
						placeholder="[stgy:a...]"
						className="h-24 font-mono text-sm"
					/>
				</section>

				<div className="flex gap-2">
					<Button
						variant={activeTab === "decode" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("decode")}
					>
						Decode Analysis
					</Button>
					<Button
						variant={activeTab === "compare" ? "default" : "outline"}
						size="sm"
						onClick={() => setActiveTab("compare")}
					>
						Compare
					</Button>
				</div>

				{activeTab === "decode" && debugInfo && (
					<div className="space-y-4">
						<Section title="Basic Info">
							<InfoRow
								label="Key"
								value={`${debugInfo.key} (char: '${debugInfo.keyChar}')`}
							/>
							<InfoRow
								label="CRC32 Stored"
								value={`0x${debugInfo.crc32Stored.toString(16).padStart(8, "0")}`}
							/>
							<InfoRow
								label="CRC32 Calculated"
								value={`0x${debugInfo.crc32Calculated.toString(16).padStart(8, "0")}`}
							/>
							<InfoRow
								label="CRC32 Match"
								value={
									debugInfo.crc32Stored === debugInfo.crc32Calculated
										? "Yes"
										: "NO - MISMATCH!"
								}
								highlight={debugInfo.crc32Stored !== debugInfo.crc32Calculated}
							/>
							<InfoRow
								label="Compressed Size"
								value={`${debugInfo.compressedData.length} bytes`}
							/>
							<InfoRow
								label="Decompressed Size"
								value={`${debugInfo.decompressedData.length} bytes (expected: ${debugInfo.decompressedLength})`}
							/>
						</Section>

						<Section title="Header">
							<InfoRow
								label="Version"
								value={debugInfo.header.version.toString()}
							/>
							<InfoRow
								label="Content Length"
								value={`${debugInfo.header.contentLength} (0x${debugInfo.header.contentLength.toString(16)})`}
							/>
							<InfoRow
								label="Section Length"
								value={`${debugInfo.header.sectionContentLength} (0x${debugInfo.header.sectionContentLength.toString(16)})`}
							/>
						</Section>

						<Section title="Fields">
							<div className="space-y-2 max-h-96 overflow-y-auto">
								{debugInfo.fields.map((field) => (
									<FieldRow
										key={`${field.offset}-${field.fieldId}`}
										field={field}
									/>
								))}
							</div>
						</Section>

						{boardData && (
							<Section title="Parsed BoardData">
								<pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
									{JSON.stringify(boardData, null, 2)}
								</pre>
							</Section>
						)}

						<Section title="Round-trip Test">
							{roundTripResult ? (
								<div className="space-y-2">
									<InfoRow
										label="Match"
										value={
											roundTripResult.match
												? "Yes - Perfect match!"
												: "No - Mismatch"
										}
										highlight={!roundTripResult.match}
									/>
									<InfoRow
										label="Binary Match"
										value={roundTripResult.binaryMatch ? "Yes" : "No"}
										highlight={!roundTripResult.binaryMatch}
									/>
									{roundTripResult.binaryDiff.length > 0 && (
										<div className="mt-2">
											<div className="text-sm text-muted-foreground mb-1">
												Binary differences ({roundTripResult.binaryDiff.length}
												):
											</div>
											<div className="text-xs font-mono bg-muted p-2 rounded max-h-32 overflow-y-auto">
												{roundTripResult.binaryDiff.slice(0, 20).map((d) => (
													<div key={d.offset}>
														offset {d.offset.toString(16).padStart(4, "0")}:{" "}
														{d.original.toString(16).padStart(2, "0")} {"->"}{" "}
														{d.reEncoded.toString(16).padStart(2, "0")}
													</div>
												))}
												{roundTripResult.binaryDiff.length > 20 && (
													<div>
														... and {roundTripResult.binaryDiff.length - 20}{" "}
														more
													</div>
												)}
											</div>
										</div>
									)}
									{reEncodedCode && (
										<div className="mt-2">
											<div className="text-sm text-muted-foreground mb-1">
												Re-encoded code:
											</div>
											<Textarea
												readOnly
												value={reEncodedCode}
												className="h-20 font-mono text-xs"
											/>
										</div>
									)}
								</div>
							) : (
								<div className="text-muted-foreground">
									Enter a valid stgy code to test
								</div>
							)}
						</Section>

						<Section title="Binary Hex Dump (Decompressed)">
							<pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-64 overflow-y-auto whitespace-pre">
								{hexDump(debugInfo.decompressedData)}
							</pre>
						</Section>

						<Section title="Base64 Payload (after decryption)">
							<Textarea
								readOnly
								value={debugInfo.base64Payload}
								className="h-20 font-mono text-xs"
							/>
						</Section>
					</div>
				)}

				{activeTab === "compare" && (
					<div className="space-y-4">
						<Section title="Compare with another code">
							<Label htmlFor={compareCodeId} className="mb-2 block">
								stgy code to compare:
							</Label>
							<Textarea
								id={compareCodeId}
								value={compareCode}
								onChange={(e) => setCompareCode(e.target.value)}
								placeholder="[stgy:a...]"
								className="h-24 font-mono text-sm"
							/>
						</Section>

						{manualCompareResult && (
							<Section title="Comparison Result">
								<div className="space-y-2">
									<InfoRow
										label="String Match"
										value={
											manualCompareResult.match
												? "Yes - Identical!"
												: "No - Different"
										}
										highlight={!manualCompareResult.match}
									/>
									<InfoRow
										label="Original Key"
										value={manualCompareResult.originalKey.toString()}
									/>
									<InfoRow
										label="Compare Key"
										value={manualCompareResult.reEncodedKey.toString()}
									/>
									<InfoRow
										label="Binary Match"
										value={manualCompareResult.binaryMatch ? "Yes" : "No"}
										highlight={!manualCompareResult.binaryMatch}
									/>
									{manualCompareResult.binaryDiff.length > 0 && (
										<div className="mt-2">
											<div className="text-sm text-muted-foreground mb-1">
												Binary differences (
												{manualCompareResult.binaryDiff.length}):
											</div>
											<div className="text-xs font-mono bg-muted p-2 rounded max-h-64 overflow-y-auto">
												{manualCompareResult.binaryDiff.map((d) => (
													<div key={d.offset}>
														offset {d.offset.toString(16).padStart(4, "0")}:{" "}
														{d.original.toString(16).padStart(2, "0")} {"->"}{" "}
														{d.reEncoded.toString(16).padStart(2, "0")}
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
					<div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
						<AlertCircle className="size-5" />
						<p>Failed to decode the stgy string. Please check the format.</p>
					</div>
				)}
			</main>
		</div>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="bg-card border border-border rounded-lg p-4">
			<h2 className="text-lg font-semibold mb-3 font-display">{title}</h2>
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
			<span className="text-muted-foreground w-36">{label}:</span>
			{highlight ? (
				<Badge variant="destructive">{value}</Badge>
			) : (
				<span className="font-mono">{value}</span>
			)}
		</div>
	);
}

function FieldRow({
	field,
}: {
	field: {
		offset: number;
		fieldId: number;
		fieldName: string;
		description: string;
		rawData: Uint8Array;
	};
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="bg-muted rounded p-2">
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className="w-full text-left flex items-center gap-2"
			>
				{expanded ? (
					<ChevronDown className="size-4 text-muted-foreground" />
				) : (
					<ChevronRight className="size-4 text-muted-foreground" />
				)}
				<span className="text-accent font-mono text-xs w-16">
					@{field.offset.toString(16).padStart(4, "0")}
				</span>
				<span className="text-primary font-mono text-xs w-8">
					F{field.fieldId}
				</span>
				<span className="text-sm flex-1">{field.description}</span>
			</button>
			{expanded && (
				<div className="mt-2 pt-2 border-t border-border ml-6">
					<div className="text-xs font-mono text-muted-foreground break-all">
						Raw:{" "}
						{Array.from(field.rawData)
							.map((b) => b.toString(16).padStart(2, "0"))
							.join(" ")}
					</div>
				</div>
			)}
		</div>
	);
}
