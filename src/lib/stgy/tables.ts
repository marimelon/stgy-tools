/**
 * stgy format conversion tables
 */

/**
 * KEY_TABLE: Key character -> key value (0-63) conversion
 */
export const KEY_TABLE: Record<string, string> = {
	"+": "N",
	"-": "P",
	"0": "x",
	"1": "g",
	"2": "0",
	"3": "K",
	"4": "8",
	"5": "S",
	"6": "J",
	"7": "2",
	"8": "s",
	"9": "Z",
	A: "D",
	B: "F",
	C: "t",
	D: "T",
	E: "6",
	F: "E",
	G: "a",
	H: "V",
	I: "c",
	J: "p",
	K: "L",
	L: "M",
	M: "m",
	N: "e",
	O: "j",
	P: "9",
	Q: "X",
	R: "B",
	S: "4",
	T: "R",
	U: "Y",
	V: "7",
	W: "_",
	X: "n",
	Y: "O",
	Z: "b",
	a: "i",
	b: "-",
	c: "v",
	d: "H",
	e: "C",
	f: "A",
	g: "r",
	h: "W",
	i: "o",
	j: "d",
	k: "I",
	l: "q",
	m: "h",
	n: "U",
	o: "l",
	p: "k",
	q: "3",
	r: "f",
	s: "y",
	t: "5",
	u: "G",
	v: "w",
	w: "1",
	x: "u",
	y: "z",
	z: "Q",
};

/**
 * ALPHABET_TABLE: Custom character -> standard Base64 character conversion
 */
export const ALPHABET_TABLE: Record<string, string> = {
	b: "-",
	"2": "0",
	w: "1",
	"7": "2",
	q: "3",
	S: "4",
	t: "5",
	E: "6",
	V: "7",
	"4": "8",
	P: "9",
	f: "A",
	R: "B",
	e: "C",
	A: "D",
	F: "E",
	B: "F",
	u: "G",
	d: "H",
	k: "I",
	"6": "J",
	"3": "K",
	K: "L",
	L: "M",
	"+": "N",
	Y: "O",
	"-": "P",
	z: "Q",
	T: "R",
	"5": "S",
	D: "T",
	n: "U",
	H: "V",
	h: "W",
	Q: "X",
	U: "Y",
	"9": "Z",
	W: "_",
	G: "a",
	Z: "b",
	I: "c",
	j: "d",
	N: "e",
	r: "f",
	"1": "g",
	m: "h",
	a: "i",
	O: "j",
	p: "k",
	o: "l",
	M: "m",
	X: "n",
	i: "o",
	J: "p",
	l: "q",
	g: "r",
	"8": "s",
	C: "t",
	x: "u",
	c: "v",
	v: "w",
	"0": "x",
	s: "y",
	y: "z",
};

/**
 * Base64 character -> value (0-63) conversion
 * A-Z: 0-25, a-z: 26-51, 0-9: 52-61, -: 62, _: 63
 */
export function base64CharToValue(char: string): number {
	const code = char.charCodeAt(0);
	if (code >= 65 && code <= 90) {
		// A-Z
		return code - 65;
	}
	if (code >= 97 && code <= 122) {
		// a-z
		return code - 97 + 26;
	}
	if (code >= 48 && code <= 57) {
		// 0-9
		return code - 48 + 52;
	}
	if (char === "-") {
		return 62;
	}
	if (char === "_") {
		return 63;
	}
	throw new Error(`Invalid base64 character: ${char}`);
}

/**
 * Value (0-63) -> Base64 character conversion
 */
export function valueToBase64Char(value: number): string {
	if (value < 0 || value > 63) {
		throw new Error(`Invalid base64 value: ${value}`);
	}
	if (value < 26) {
		// A-Z
		return String.fromCharCode(65 + value);
	}
	if (value < 52) {
		// a-z
		return String.fromCharCode(97 + value - 26);
	}
	if (value < 62) {
		// 0-9
		return String.fromCharCode(48 + value - 52);
	}
	if (value === 62) {
		return "-";
	}
	return "_";
}
