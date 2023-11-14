import {xu} from "xu";
import {crypto} from "std";
import {runUtil, fileUtil} from "xutil";

const MAX_INLINE_FILE_SIZE = xu.GB*2;

export async function hashData(algorithm, dataRaw)
{
	const data = typeof dataRaw==="string" ? new TextEncoder().encode(dataRaw) : dataRaw;
	return (new Uint8Array(await crypto.subtle.digest(algorithm, data))).asHex();
}

export async function hashFile(algorithm, filePath)
{
	if(!await fileUtil.exists(filePath))
		return null;

	// anything larger than a certain size, call out to an external program
	// in theory Uint8Array can handle a maximum of 32bit, but that's 4GB of memory usage, so let's aim for half that or 2GB (or whatever I set above)
	if((await Deno.stat(filePath)).size>MAX_INLINE_FILE_SIZE)
	{
		const algoProgs =
		{
			"blake3" : ["b3sum", ["--no-names"], v => v.trim()],
			"SHA-1"  : ["sha1sum", [], v => v.trim().split(" ")[0]]
		};
		if(!(algorithm in algoProgs))
			throw new Error(`Hashing algorithm ${algorithm} not supported for huge files > ${MAX_INLINE_FILE_SIZE} bytes`);

		const {stdout} = await runUtil.run(algoProgs[algorithm][0], [...algoProgs[algorithm][1], filePath]);
		return algoProgs[algorithm][2](stdout);
	}

	return hashData(algorithm, await Deno.readFile(filePath, null));
}
