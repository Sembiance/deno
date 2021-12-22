import {xu} from "xu";
import {crypto} from "std";		// eslint-disable-line no-redeclare

export async function hashData(algorithm, data)
{
	return (new Uint8Array(await crypto.subtle.digest(algorithm, data))).asHex();
}

export async function hashFile(algorithm, filePath)
{
	return hashData(algorithm, await Deno.readFile(filePath, null));
}
