import {xu} from "xu";
import * as fileUtil from "./fileUtil.js";
import {createHash} from "std";

export function hashData(algorithm, data)
{
	const hash = createHash(algorithm);
	hash.update(data);
	return hash.toString();
}

export async function hashFile(algorithm, filePath)
{
	const hash = createHash(algorithm);
	hash.update(await fileUtil.readFile(filePath, null));
	return hash.toString();
}
