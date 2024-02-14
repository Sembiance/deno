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

		this.sparkey = Deno.dlopen(path.join(xu.dirname(import.meta), "sparkey.so"), {
			get : { parameters : ["buffer", "u32", "buffer", "u32", "u64"], result : "buffer" },
			put : { parameters : ["buffer", "u32", "buffer", "u32", "buffer", "u32"], result : "u8" }
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

	putText(k, v)
	{
		return this.put(k, this.encoder.encode(v));
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
