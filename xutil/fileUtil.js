import {xu} from "xu";
import * as runUtil from "./runUtil.js";
import {path, readLines, streams} from "std";

/** returns true if files a and b are equals. Calls out to 'cmp' due to how optimized that program is for speed */
export async function areEqual(a, b)
{
	const {status} = await runUtil.run("cmp", ["--silent", a, b]);
	return !!status.success;
}

/** Empties the dirPath, deleting anything in it **/
export async function emptyDir(dirPath)
{
	const srcPaths = await tree(dirPath, {depth : 1});
	await srcPaths.parallelMap(async srcPath => await unlink(srcPath, {recursive : true}));
}

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
		r = path.join(fullPrefix, `${xu.randStr()}${suffix}`);
	while(await exists(r));

	return r;
}

/** Will gunzip the given filePath */
export async function gunzip(filePath)
{
	return await streams.readAll(streams.readerFromStreamReader(await (await Deno.open(filePath)).readable.pipeThrough(new DecompressionStream("gzip")).getReader()));
}

/** Safely moves a file from src to dest, will try to just rename it, but will copy and remove original if needed */
export async function move(src, dest)
{
	if(!(await exists(src)))
		return;
		
	if(src===dest)
		throw new Error(`src and dest are identical: ${src}`);

	if(await exists(dest))
		await unlink(dest);
	
	await Deno.rename(src, dest).catch(async () =>
	{
		const tmpDest = await genTempPath(path.dirname(dest));
		await Deno.copyFile(src, tmpDest);
		await Deno.rename(tmpDest, dest);
		if(await exists(dest))
			await unlink(src);
	});
}

/** Moves all the files/dirs within src to dest **/
export async function moveAll(src, dest, {unlinkSrc}={})
{
	const srcPaths = await tree(src, {depth : 1});
	await srcPaths.parallelMap(async srcPath => await move(srcPath, path.join(dest, path.basename(srcPath))));
	if(unlinkSrc)
		await unlink(src);
}

/** Replaces the given findMe (which can be text or a regular expression) with replaceWith in the given filePath */
export async function searchReplace(filePath, findMe, replaceWith)
{
	if(!(await exists(filePath)))
		return;
	
	const data = await readTextFile(filePath);
	await Deno.writeTextFile(filePath, data.toString("utf8")[typeof data==="string" ? "replaceAll" : "replace"](findMe, replaceWith));
}

/** Reads in a JSON L file, line by line, calling async cb(line) for each line read */
export async function readJSONLFile(filePath, cb)
{
	const lines = [];
	if(!cb)
	{
		cb = line =>	// eslint-disable-line no-param-reassign
		{
			if(!line)
				return;
			
			lines.push(line);
		};
	}

	if(filePath.toLowerCase().endsWith(".gz"))
	{
		await runUtil.run("gunzip", ["-c", filePath], {stdoutcb : async line =>	await cb(xu.parseJSON(line), line)});
	}
	else
	{
		const file = await Deno.open(filePath);
		for await(const line of readLines(file))
			await cb(xu.parseJSON(line), line);
		file.close();
	}

	if(lines.length>0)
		return lines;
}

/** reads in byteCount bytes from filePath and returns a Uint8Array */
export async function readFileBytes(filePath, byteCount)
{
	const f = await Deno.open(filePath);
	const buf = new Uint8Array(byteCount);
	await Deno.read(f.rid, buf);
	Deno.close(f.rid);
	return buf;
}

/** reads in the entire file at filePath and converts to encoding. This is because Deno.readTextFile as of 1.21 will throw an exception on ANY invalid UTF-8 chars which is NOT ideal */
export async function readTextFile(filePath, encoding="utf-8")
{
	return new TextDecoder(encoding).decode(await Deno.readFile(filePath));
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
export async function tree(root, {nodir=false, nofile=false, regex, depth=Number.MAX_SAFE_INTEGER, _originalRoot=root}={})
{
	if(depth===0 || !(await exists(root)))
		return [];

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
			r.push(...await tree(entryPath, {nodir, nofile, regex, _originalRoot, depth : depth-1}));
	}

	return r;
}

/** removes the file or directory, but only if it exists */
export async function unlink(targetPath, o={})
{
	if(!(await exists(targetPath)))
		return;
	
	return await Deno.remove(targetPath, o);
}

/** writes all the 'lines' as JSON L file to filePath */
export async function writeJSONLFile(filePath, lines)
{
	const gz = filePath.toLowerCase().endsWith(".gz");
	
	const file = await Deno.open(gz ? path.join(path.dirname(filePath), path.basename(filePath, ".gz")) : filePath, {create : true, write : true, truncate : true});
	const encoder = new TextEncoder();

	for(const line of lines)
		await streams.writeAll(file, encoder.encode(`${JSON.stringify(line)}\n`));

	file.close();

	if(gz)
		runUtil.run("gzip", ["-f", path.join(path.dirname(filePath), path.basename(filePath, ".gz"))]);
}
