

/** Allows finding more advanced items such as strings or sub arrays */
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
	Uint8Array.prototype.getString = function getString(offset, len)
	{
		return new TextDecoder().decode(this.subarray(offset, offset+len));
	};
}

/** Creates convienance methods for set/get int/uint values */
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
