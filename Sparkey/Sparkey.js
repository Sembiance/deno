/* eslint-disable camelcase, new-cap */
import {xu} from "xu";
import {path} from "std";
import {fileUtil, runUtil} from "xutil";

const ZSTD_LEVEL = 22;

export class Sparkey
{
	static async create(dbFilePathPrefix)
	{
		const db = new this();
		db.textEncoder = new TextEncoder();
		db.textDecoder = new TextDecoder();
		db.dbFilePathPrefix = dbFilePathPrefix;
		db.dbFilePathPrefixBuffer = db.textEncoder.encode(dbFilePathPrefix);

		db.sparkey = Deno.dlopen(path.join(import.meta.dirname, "sparkey.so"), {
			get         : { parameters : ["buffer", "u32", "buffer", "u32", "u64"], result : "buffer" },
			getLength   : { parameters : ["buffer", "u32", "buffer", "u32"], result : "u64" },
			delete      : { parameters : ["buffer", "u32", "buffer", "u32"], result : "u8" },
			put         : { parameters : ["buffer", "u32", "buffer", "u32", "buffer", "u32"], result : "u8" },
			putMany     : { parameters : ["buffer", "u32", "u32", "buffer", "buffer"], result : "u8" },
			extractFile : { parameters : ["buffer", "u32", "buffer", "u32", "buffer", "u32"], result : "u64" },
			compressAll : { parameters : ["buffer", "u32", "buffer", "u32", "buffer", "u32", "i32"], result : "u8" },
			freeBuffer  : { parameters : ["pointer"], result : "void" }
		});

		const dictFilePath = `${dbFilePathPrefix}.dict`;
		if(await fileUtil.exists(dictFilePath))
			await db.compressInit(dictFilePath);

		return db;
	}

	getLength(k)
	{
		const keyBuffer = this.textEncoder.encode(k);
		const len = this.sparkey.symbols.getLength(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length);
		return len>=Number.MIN_SAFE_INTEGER && len<=Number.MAX_SAFE_INTEGER ? Number(len) : len;
	}

	get(k, maxLen=0, {skipDecompress}={})
	{
		const keyBuffer = this.textEncoder.encode(k);
		const callResult = this.sparkey.symbols.get(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length, maxLen);
		if(!callResult)
			return;

		const dataView = new Deno.UnsafePointerView(callResult);
		const r = new Uint8Array(dataView.getUint32());
		dataView.copyInto(r, 4);

		this.sparkey.symbols.freeBuffer(callResult);

		return this.compressed && !skipDecompress ? this.decompressValue(r) : r;
	}

	getText(k, maxLen)
	{
		const r = this.get(k, maxLen);
		return r ? this.textDecoder.decode(r) : undefined;
	}

	async extractFile(k, filePath, {skipDecompress}={})
	{
		const keyBuffer = this.textEncoder.encode(k);
		const filePathBuffer = this.textEncoder.encode(filePath);
		const size = this.sparkey.symbols.extractFile(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length, filePathBuffer, filePathBuffer.length);
		if(this.compressed && !skipDecompress)
		{
			const tmpFilePath = await fileUtil.genTempPath(path.dirname(filePath));
			await runUtil.run("zstd", ["-d", "-D", `${this.dbFilePathPrefix}.dict`, filePath, "-o", tmpFilePath]);
			await Deno.rename(tmpFilePath, filePath);
			return (await Deno.stat(filePath)).size;
		}
		return size;
	}

	put(k, v, {skipCompress}={})
	{
		const keyBuffer = this.textEncoder.encode(k);
		const data = this.compressed && !skipCompress ? this.compressValue(v) : v;
		return !!this.sparkey.symbols.put(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length, data, data.length);
	}

	putText(key, val)
	{
		return this.put(key, this.textEncoder.encode(val));
	}

	async putFile(k, filePath, {skipCompress}={})
	{
		let status, stderr;
		if(this.compressed && !skipCompress)
		{
			const tmpFilePath = await fileUtil.genTempPath();
			await runUtil.run("zstd", ["-D", `${this.dbFilePathPrefix}.dict`, filePath, "-o", tmpFilePath]);
			({status, stderr} = await runUtil.run("/mnt/compendium/DevLab/apps/sparkey/sparkeyPutFile", [this.dbFilePathPrefix, k, tmpFilePath]));
			await fileUtil.unlink(tmpFilePath);
		}
		else
		{
			({status, stderr} = await runUtil.run("/mnt/compendium/DevLab/apps/sparkey/sparkeyPutFile", [this.dbFilePathPrefix, k, filePath]));
		}

		if(!status?.success)
			throw new Error(`Sparkey putFile failed: ${stderr}`);
	}

	putMany(keys, vals)
	{
		if(this.compressed)
			throw new Error("putMany not supported when compressed");

		const keysEncoded = keys.map(k => this.textEncoder.encode(k));
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
		if(this.compressed)
			throw new Error("putTexts not supported when compressed");

		return this.putMany(keys, vals.map(v => this.textEncoder.encode(v)));
	}

	delete(k)
	{
		const keyBuffer = this.textEncoder.encode(k);
		return !!this.sparkey.symbols.delete(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, keyBuffer, keyBuffer.length);
	}

	async truncate()
	{
		await fileUtil.unlink(`${this.dbFilePathPrefix}.spi`, {recursive : true});
		await fileUtil.unlink(`${this.dbFilePathPrefix}.spl`, {recursive : true});
		await fileUtil.unlink(`${this.dbFilePathPrefix}.dict`, {recursive : true});
	}

	async listKeys()
	{
		return (await runUtil.run("/mnt/compendium/DevLab/apps/sparkey/sparkeyListKeys", [this.dbFilePathPrefix]))?.stdout?.replace(/\0$/, "")?.split("\0").filter(v => v?.length);
	}

	async compact(dbNewPrefix)
	{
		return !!(await runUtil.run("/mnt/compendium/DevLab/apps/sparkey/sparkeyCompact", [this.dbFilePathPrefix, ...(dbNewPrefix ? [dbNewPrefix] : [])]))?.status?.success;
	}

	async compressInit()
	{
		if(this.compressed)
			throw new Error("already compressed");

		this.compressed = true;

		this.zstd = Deno.dlopen("libzstd.so", {
			ZSTD_createCCtx            : { parameters : [], result : "pointer" },
			ZSTD_createDCtx            : { parameters : [], result : "pointer" },
			ZSTD_createCDict           : { parameters : ["buffer", "usize", "i32"], result : "pointer" },
			ZSTD_createDDict           : { parameters : ["buffer", "usize"], result : "pointer" },
			ZSTD_compress_usingCDict   : { parameters : ["pointer", "buffer", "usize", "buffer", "usize", "pointer"], result : "usize"},
			ZSTD_decompress_usingDDict : { parameters : ["pointer", "buffer", "usize", "buffer", "usize", "pointer"], result : "usize" },
			ZSTD_compressBound         : { parameters : ["usize"], result : "usize" },
			ZSTD_getFrameContentSize   : { parameters : ["buffer", "usize"], result : "u64" },
			ZSTD_isError               : { parameters : ["usize"], result : "u32" },
			ZSTD_freeCCtx              : { parameters : ["pointer"], result : "usize" },
			ZSTD_freeDCtx              : { parameters : ["pointer"], result : "usize" },
			ZSTD_freeCDict             : { parameters : ["pointer"], result : "usize" },
			ZSTD_freeDDict             : { parameters : ["pointer"], result : "usize" }
		});

		this.compressContext = this.zstd.symbols.ZSTD_createCCtx();
		this.decompressContext = this.zstd.symbols.ZSTD_createDCtx();
		
		const dictData = await Deno.readFile(`${this.dbFilePathPrefix}.dict`);
		this.compressDict = this.zstd.symbols.ZSTD_createCDict(dictData, dictData.length, ZSTD_LEVEL);
		this.decompressDict = this.zstd.symbols.ZSTD_createDDict(dictData, dictData.length);
	}

	compressValue(v)
	{
		const buffer = new Uint8Array(Number(this.zstd.symbols.ZSTD_compressBound(v.length)));
		const result = this.zstd.symbols.ZSTD_compress_usingCDict(this.compressContext, buffer, buffer.length, v, v.length, this.compressDict);
		if(this.zstd.symbols.ZSTD_isError(result))
			throw new Error("zstd compress failed");
		return buffer.subarray(0, Number(result));
	}

	decompressValue(v)
	{
		const origSizeRaw = this.zstd.symbols.ZSTD_getFrameContentSize(v, v.length);
		if(origSizeRaw === 0xFFFFFFFFFFFFFFFFn || origSizeRaw === 0xFFFFFFFFFFFFFFFEn)	// eslint-disable-line unicorn/numeric-separators-style
			throw new Error("zstd decompress failed: unknown or error frame content size");

		const buffer = new Uint8Array(Number(origSizeRaw));
		const result = this.zstd.symbols.ZSTD_decompress_usingDDict(this.decompressContext, buffer, buffer.length, v, v.length, this.decompressDict);
		if(this.zstd.symbols.ZSTD_isError(result))
			throw new Error("zstd decompress failed");
		return buffer;
	}

	async compress({sampleCount=5000}={})
	{
		if(this.compressed)
			throw new Error("already compressed");
		
		const trainDirPath = await fileUtil.genTempPath();
		await Deno.mkdir(trainDirPath);

		for(const key of (await this.listKeys()).pickRandom(sampleCount))
			await this.extractFile(key, path.join(trainDirPath, xu.randStr()));

		const {stdout, stderr} = await runUtil.run("zstd", ["--train", "-r", trainDirPath, "-o", `${this.dbFilePathPrefix}.dict`, "--maxdict=65536"]);
		if(!await fileUtil.exists(`${this.dbFilePathPrefix}.dict`))
			throw new Error(`zstd failed with stdout ${stdout} and stderr: ${stderr}`);
		await fileUtil.unlink(trainDirPath);

		await this.compressInit();

		const dictData = await Deno.readFile(`${this.dbFilePathPrefix}.dict`);
		const tmpPrefix = await fileUtil.genTempPath(path.dirname(this.dbFilePathPrefix));
		const tmpPrefixBuffer = this.textEncoder.encode(tmpPrefix);

		const result = this.sparkey.symbols.compressAll(this.dbFilePathPrefixBuffer, this.dbFilePathPrefixBuffer.length, tmpPrefixBuffer, tmpPrefixBuffer.length, dictData, dictData.length, ZSTD_LEVEL);
		if(!result)
			throw new Error("compressAll failed");

		await Deno.rename(`${tmpPrefix}.spl`, `${this.dbFilePathPrefix}.spl`);
		await Deno.rename(`${tmpPrefix}.spi`, `${this.dbFilePathPrefix}.spi`);

		await this.compact();
	}

	unload()
	{
		this.sparkey.close();
		if(this.zstd)
		{
			this.zstd.symbols.ZSTD_freeCCtx(this.compressContext);
			this.zstd.symbols.ZSTD_freeDCtx(this.decompressContext);
			this.zstd.symbols.ZSTD_freeCDict(this.compressDict);
			this.zstd.symbols.ZSTD_freeDDict(this.decompressDict);
			this.zstd.close();
		}
	}
}
