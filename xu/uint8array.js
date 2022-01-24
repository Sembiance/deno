/** returns a hex encoded string */
if(!Uint8Array.prototype.asHex)
{
	const BYTE_TO_HEX = [];
	for (let n=0;n<=0xFF;++n)
		BYTE_TO_HEX.push(n.toString(16).padStart(2, "0"));

	Uint8Array.prototype.asHex = function asHex()
	{
		const hexOctets = new Array(this.length);	// eslint-disable-line unicorn/no-new-array

		for (let i=0;i<this.length;++i)
			hexOctets[i] = BYTE_TO_HEX[this[i]];

		return hexOctets.join("");
	};
}

/** copies data from a region of the current array to the target */
if(!Uint8Array.prototype.copy)
{
	Uint8Array.prototype.copy = function copy(target, targetStart=0, sourceStart=0, sourceEnd=null)
	{
		if(sourceEnd===null)
			sourceEnd = this.length;	// eslint-disable-line no-param-reassign
		
		const sourceData = Uint8Array.from(this.subarray(sourceStart, sourceEnd));
		for(let i=0;i<sourceData.length;i++)
			target.setUInt8(targetStart+i, sourceData[i]);
	};
}

/** allows finding more advanced items such as strings or sub arrays */
if(!Uint8Array.prototype.indexOfX)
{
	Uint8Array.prototype.indexOfX = function indexOfX(x)
	{
		const m = typeof x==="string" ? new TextEncoder().encode(x) : (x instanceof Uint8Array ? x : Uint8Array.from(typeof x[Symbol.iterator]==="function" ? x : [x]));
		
		let i=0, subi=0;
		for(const v of this)
		{
			if(v===m[subi])
			{
				subi++;
				i++;
				if(m.length===subi)
					return i-m.length;
				continue;
			}

			subi = 0;
			i++;
		}
		return -1;
	};
}

/** returns len bytes at offset decoded as a string */
if(!Uint8Array.prototype.getString)
{
	Uint8Array.prototype.getString = function getString(offset, len, encoding="utf-8")
	{
		return new TextDecoder(encoding).decode(this.subarray(offset, offset+len));
	};
}

/** returns len bytes at offset decoded as a string */
if(!Uint8Array.prototype.getPascalString)
{
	Uint8Array.prototype.getPascalString = function getString(offset, encoding="utf-8")
	{
		const len = this[offset];
		return new TextDecoder(encoding).decode(this.subarray(offset+1, offset+1+len));
	};
}

/** creates convienance methods for set/get int/uint values */
for(const t of ["get", "set"])
{
	for(const x of [8, 16, 32, 64])
	{
		for(const e of ["BE", "LE"])
		{
			for(const u of ["", "U"])
			{
				const name = `${t}${x===64 ? "Big" : ""}${u}Int${x}${x===8 ? "" : e}`;
				if(!Uint8Array.prototype[name])
				{
					Uint8Array.prototype[name] = function getInt(offset=0, value)
					{
						const a=[offset];
						if(t==="set")
							a.push(value);
						if(x!==8)
							a.push(e==="LE");
						return new DataView(this.buffer)[`${t}${x===64 ? "Big" : ""}${u==="U" ? "Uint" : "Int"}${x}`](...a);
					};
				}
			}
		}
	}
}
