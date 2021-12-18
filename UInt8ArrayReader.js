export class UInt8ArrayReader
{
	constructor(arr, {endianness="be", pos=0}={})
	{
		this.arr = arr;
		this.endianness = endianness.toUpperCase();
		this.pos = pos;
	}

	pre(v=0)
	{
		this.pos+=v;
		return this.pos-v;
	}

	post(v=0)
	{
		this.pos+=v;
		return this.pos;
	}

	getEndianness(swap) { return swap ? (this.endianness==="BE" ? "LE" : "BE") : this.endianness; }

	length() { return this.arr.length; }
	eof() { return this.pos>=this.arr.length; }
	skip(v) { this.pos+=v; }
	setPOS(v) { this.pos = v; }
	debug(len=(this.arr.length-1)-this.pos)
	{
		return `0x${[].pushSequence(this.pos, this.pos+(len-1)).map(v => this.arr.getUInt8(v).toString(16).toUpperCase()).join("")}`;
	}

	// Returns a new UInt8ArrayReader that is made up of a subsection of the current buf
	sub(len) { return new UInt8ArrayReader(Uint8Array.from(this.arr.subarray(this.pos, this.post(len)))); }

	// Reads a string of the given len with the given encoding
	str(len, encoding="ascii") { return this.arr.getString(this.pos, this.post(len), encoding); }

	// Reads a signed or unsigned byte
	int8() { return this.arr.getInt8(this.pre(1)); }
	uint8() { return this.arr.getUInt8(this.pre(1)); }

	// Reads a signed or unsigned short
	int16(swap) { return this.arr[`getInt16${this.getEndianness(swap)}`](this.pre(2)); }
	uint16(swap) { return this.arr[`getUInt16${this.getEndianness(swap)}`](this.pre(2)); }

	// Reads a signed or unsigned long
	int32(swap) { return this.arr[`getInt32${this.getEndianness(swap)}`](this.pre(4)); }
	uint32(swap) { return this.arr[`getUInt32${this.getEndianness(swap)}`](this.pre(4)); }
}
