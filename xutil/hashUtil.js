import {xu} from "xu";
import {crypto} from "std";		// eslint-disable-line no-redeclare

export async function hashData(algorithm, dataRaw)
{
	const data = typeof dataRaw==="string" ? new TextEncoder().encode(dataRaw) : dataRaw;
	return (new Uint8Array(await crypto.subtle.digest(algorithm, data))).asHex();
}

export async function hashFile(algorithm, filePath)
{
	return hashData(algorithm, await Deno.readFile(filePath, null));
}
