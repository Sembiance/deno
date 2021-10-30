import {xu} from "xu";
import * as path from "https://deno.land/std@0.111.0/path/mod.ts";

/** Returns true if the file/dir v exists, false otherwise */
export async function exists(v)
{
	try
	{
		await Deno.stat(v);
		return true;
	}
	catch(err)
	{
		// If we get a NotFound error, then we simply return false
		if(err instanceof Deno.errors.NotFound)
			return false;
		
		// Otherwise we probably got a permission denied or some other error, so throw that
		throw err;
	}
}

let TMP_DIR_PATH = null;
/** Finds a unique (at time of checking) temporary file path to use */
export async function genTempPath(prefix, suffix=".tmp")
{
	// One time initialization check to see if our preferred /mnt/ram/tmp directory exists or not
	if(TMP_DIR_PATH===null)
	{
		try { TMP_DIR_PATH = (Deno.statSync("/mnt/ram/tmp").isDirectory ? "/mnt/ram/tmp" : "/tmp");	}	// Synchronouse to avoid potential race conditions with multiple calls to genTempPath()
		catch {	TMP_DIR_PATH = "/tmp"; }
	}
	
	let r = null;
	const fullPrefix = path.join(prefix?.startsWith("/") ? "" : TMP_DIR_PATH, prefix || "");

	do
		r = path.join(fullPrefix, ((`${performance.now()}`).replaceAll(".", "") + Math.randomInt(0, 1_000_000)) + suffix);
	while(await exists(r));		// eslint-disable-line no-await-in-loop

	return r;
}

/** Reads all content from the given filePath and decodes it as encoding (default utf-8) */
export async function readFile(filePath, encoding="utf-8")
{
	const data = await Deno.readFile(filePath);
	return (encoding ? (new TextDecoder(encoding)).decode(data) : data);
}

/** Returns a recursive list of all files and directories contained in dirPath.
 * Options:
 *  regex	If set, the relative path from the root must match this regex to be included
 * 	nodir	Set to true to omit directories from the results
 *  nofile	Set to true to omit files from the results
 *
 * Deno's fs.expandGlob() isn't anywhere close to being ready for prime time usage, lots of weird bugs (glob is hard to get right)
 * Likewise, fs.walk() suffers from issues such as throwing exceptions whenever it encounters non-standard files, such as sockets
 * Deno.readDir() doesn't suffer from these problems, so I've rolled my own simplified blog with a simple regex match
 */
export async function tree(root, {nodir=false, nofile=false, regex, _originalRoot=root}={})
{
	if(!(await Deno.stat(root))?.isDirectory)
		throw new Error(`root ${root} must be a directory`);

	if(regex && regex instanceof RegExp===false)
		throw new TypeError(`regex must be an actual RegExp to avoid all sorts of edge cases when matching`);

	const r = [];
	for await(const entry of Deno.readDir(root))
	{
		const entryPath = path.join(root, entry.name);
		if((!regex || regex.test(path.relative(_originalRoot, entryPath))) && ((entry.isDirectory && !nodir) || (!entry.isDirectory && !nofile)))
			r.push(entryPath);

		if(entry.isDirectory)
			r.push(...await tree(entryPath, {nodir, nofile, regex, _originalRoot}));
	}

	return r;
}

/** Reads all content from the given filePath and decodes it as encoding (default utf-8) */
export async function writeFile(filePath, data, encoding="utf-8", {append=false}={})
{
	await Deno.writeFile(filePath, (encoding ? (new TextEncoder(encoding)).encode(data) : data), {append});
}
