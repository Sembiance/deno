import {xu} from "xu";
import {path} from "std";
import {fileUtil} from "xutil";

export class Sparkey
{
	constructor(dbFilePathPrefix)
	{
		this.encoder = new TextEncoder();
		this.decoder = new TextDecoder();
		this.dbFilePathPrefixBuffer = this.encoder.encode(dbFilePathPrefix);

		this.sparkey = Deno.dlopen(path.join(import.meta.dirname, "sparkey.so"), {
			get     : { parameters : ["buffer", "u32", "buffer", "u32", "u64"], result : "buffer" },
			put     : { parameters : ["buffer", "u32", "buffer", "u32", "buffer", "u32"], result : "u8" },
			putMany : { parameters : ["buffer", "u32", "u32", "buffer", "buffer"], result : "u8" }
		});
	}

	get(k, maxLen=0)
	{
		const keyBuffer = this.encoder.encode(k);
		const callResult = this.sparkey.symbols.get(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length, maxLen);
		if(!callResult)
			return;

		const dataView = new Deno.UnsafePointerView(callResult);
		const r = new Uint8Array(dataView.getUint32());
		dataView.copyInto(r, 4);

		return r;
	}

	getText(k, maxLen)
	{
		const r = this.get(k, maxLen);
		return r ? this.decoder.decode(r) : undefined;
	}

	put(k, v)
	{
		const keyBuffer = this.encoder.encode(k);
		return !!this.sparkey.symbols.put(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length, v, v.length);
	}

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

	putText(key, val)
	{
		return this.put(key, this.encoder.encode(val));
	}

	async truncate()
	{
		await fileUtil.unlink(`${this.decoder.decode(this.dbFilePathPrefixBuffer)}.spi`, {recusive : true});
		await fileUtil.unlink(`${this.decoder.decode(this.dbFilePathPrefixBuffer)}.spl`, {recusive : true});
	}

	unload()
	{
		this.sparkey.close();
	}
}
