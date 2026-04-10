putMany(keys, vals)
	{
		const keysEncoded = keys.map(k => this.encoder.encode(k));
		const keysBuffer = new Uint8Array(keysEncoded.map(v => v.length).sum()+(keys.length*4));
		for(let i=0, pos=0;i<keys.length;i++)
		{
			keysBuffer.setUInt32LE(pos, keysEncoded[i].length);
			pos+=4;
			keysBuffer.set(keysEncoded[i], pos);
			pos+=keysEncoded[i].length;
		}

		const valsBuffer = new Uint8Array(vals.map(v => v.length).sum()+(vals.length*4));
		for(let i=0, pos=0;i<vals.length;i++)
		{
			valsBuffer.setUInt32LE(pos, vals[i].length);
			pos+=4;
			valsBuffer.set(vals[i], pos);
			pos+=vals[i].length;
		}

		return !!this.sparkey.symbols.putMany(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keys.length, keysBuffer, valsBuffer);
	}

	putTexts(keys, vals)
	{
		return this.putMany(keys, vals.map(v => this.encoder.encode(v)));
	}
