/**
 * Binary data reading utility
 */

export class BinaryReader {
	private view: DataView;
	private offset: number;

	constructor(data: Uint8Array) {
		this.view = new DataView(data.buffer, data.byteOffset, data.byteLength);
		this.offset = 0;
	}

	get position(): number {
		return this.offset;
	}

	get remaining(): number {
		return this.view.byteLength - this.offset;
	}

	readUint8(): number {
		const value = this.view.getUint8(this.offset);
		this.offset += 1;
		return value;
	}

	readUint16(): number {
		const value = this.view.getUint16(this.offset, true);
		this.offset += 2;
		return value;
	}

	readInt16(): number {
		const value = this.view.getInt16(this.offset, true);
		this.offset += 2;
		return value;
	}

	readUint32(): number {
		const value = this.view.getUint32(this.offset, true);
		this.offset += 4;
		return value;
	}

	readBytes(length: number): Uint8Array {
		const bytes = new Uint8Array(
			this.view.buffer,
			this.view.byteOffset + this.offset,
			length,
		);
		this.offset += length;
		return bytes;
	}

	readString(length: number): string {
		const bytes = this.readBytes(length);
		let end = bytes.indexOf(0);
		if (end === -1) end = bytes.length;
		const decoder = new TextDecoder("utf-8");
		return decoder.decode(bytes.subarray(0, end));
	}

	skip(bytes: number): void {
		this.offset += bytes;
	}

	alignTo(boundary: number): void {
		const remainder = this.offset % boundary;
		if (remainder !== 0) {
			this.offset += boundary - remainder;
		}
	}
}
