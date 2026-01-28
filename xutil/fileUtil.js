import {xu} from "xu";
import * as runUtil from "./runUtil.js";
import {path, toArrayBuffer, TextLineStream} from "std";

/** returns true if files a and b are equals. Calls out to 'cmp' due to how optimized that program is for speed */
export async function areEqual(a, b)
{
	const {status} = await runUtil.run("cmp", ["--silent", a, b]);
	return !!status.success;
}

export async function concat(srcFilePaths, destFilePath, {seperator}={})
{
	const destFile = await Deno.open(destFilePath, {read : false, write : true, append : true, truncate : false, create : true});
	const seperatorData = typeof seperator==="string" ? new TextEncoder().encode(seperator) : seperator;
	for(let i=0;i<srcFilePaths.length;i++)
	{
		const srcFile = await Deno.open(srcFilePaths[i], {read : true, write : false});
		await srcFile.readable.pipeTo(destFile.writable, {preventClose : true});

		if(seperatorData && i<(srcFilePaths.length-1))
			await (new Blob([seperatorData])).stream().pipeTo(destFile.writable, {preventClose : true});
	}

	destFile.close();
}

/** Empties the dirPath, deleting anything in it without deleting the actual directory itself **/
export async function emptyDir(dirPath)
{
	const srcPaths = await tree(dirPath, {depth : 1});
	await srcPaths.parallelMap(async srcPath => await unlink(srcPath, {recursive : true}));
}

/** Returns true if the file/dir v exists, false otherwise */
export async function exists(v, {lstat}={})
{
	try
	{
		await Deno[lstat ? "lstat" : "stat"](v);
		return true;
	}
	catch(err)
	{
		// If we get a NotFound error, then we simply return false
		if(err instanceof Deno.errors.NotFound)
			return false;

		// If any part of the checked path that is marked as a directory is actually a file, an error is thrown, so we check for that and then clearly return false as the subFile doesn't exist within a file
		if(err?.message?.toLowerCase()?.startsWith("not a directory"))
			return false;

		// If the filename is too long, just return false
		if(err?.message?.toLowerCase()?.startsWith("file name too long"))
			return false;
		
		// Otherwise we probably got a permission denied or some other error, so throw that
		throw err;
	}
}

let TMP_DIR_PATH = null;
/** Finds a unique (at time of checking) temporary file path to use */
export async function genTempPath(prefix, suffix=".tmp", {maxFilenameLength}={})
{
	// One time initialization check to see if our preferred /mnt/ram/tmp directory exists or not
	if(TMP_DIR_PATH===null)
	{
		try { TMP_DIR_PATH = (Deno.statSync("/mnt/ram/tmp").isDirectory ? "/mnt/ram/tmp" : "/tmp");	}	// Synchronous to avoid potential race conditions with multiple calls to genTempPath()
		catch {	TMP_DIR_PATH = "/tmp"; }
	}
	
	let r;
	let randPart;
	const fullPrefix = path.join(prefix?.startsWith("/") ? "" : TMP_DIR_PATH, prefix || "");

	do
	{
		randPart = xu.randStr();
		if(maxFilenameLength && maxFilenameLength<(randPart.length+suffix.length))
			randPart = randPart.split("").pickRandom(maxFilenameLength-suffix.length).join("");
		r = path.join(fullPrefix, `${randPart}${suffix}`);
	} while(await exists(r));

	return r;
}

/** Will gunzip the given filePath */
export async function gunzip(filePath)
{
	return await toArrayBuffer(await (await Deno.open(filePath)).readable.pipeThrough(new DecompressionStream("gzip")));
}

// The 'lockCount' thing is only needed as a workaround for a bug in deno that restricts number of pending locks to 32: https://github.com/denoland/deno/issues/22504
let lockCount = 0;
export async function lock(file)
{
	file = typeof file==="string" ? await Deno.open(file, {append : true, create : true}) : file;
	if(lockCount>20)
		await xu.waitUntil(() => lockCount<20);
	lockCount++;
	await file.lock(true);
	lockCount--;
	return file;
}

export async function unlock(file)
{
	if(!file.unlock)
		throw new Error("Requires a Deno.FsFile passed in");
	await file.unlock();
	file.close();
}

export async function mkdir(dirPath, {force, recursive}={})
{
	try
	{
		await Deno.mkdir(dirPath, {recursive : !!recursive});
	}
	catch
	{
		if(!force)
			return;
		
		let parentDirPath = dirPath;
		while(parentDirPath!=="/")
		{
			if((await xu.tryFallbackAsync(async () => await Deno.stat(parentDirPath)))?.isFile)	// eslint-disable-line no-loop-func
				await Deno.remove(parentDirPath);

			parentDirPath = path.dirname(parentDirPath);
		}

		await Deno.mkdir(dirPath, {recursive : !!recursive});
	}
}

export async function monitor(dirPath, cb)
{
	const linecb = async line =>
	{
		if(line.startsWith("Setting up watches"))
			return;

		if(line.trim()==="Watches established.")
			return await cb({type : "ready"});

		let {when, events, filePath} = line.match(/^(?<when>\d+) (?<events>[^ ]+) (?<filePath>.+)$/)?.groups || {};		// eslint-disable-line prefer-const
		if(!when)
			return console.error(`Failed to parse inotifywait line: ${line}`);
	
		events = events.split(",");

		const o = {when : new Date((+when*xu.SECOND)), filePath};
		if(events.includesAny(["CREATE", "MOVED_TO"]))
			o.type = "create";
		else if(events.includes("CLOSE_WRITE"))
			o.type = "modify";
		else if(events.includesAny(["DELETE", "MOVED_FROM"]))
			o.type = "delete";
		else
			o.type = `UNKNOWN: ${events.join(",")}`;
		
		await cb(o);
	};

	const {p} = await runUtil.run("inotifywait", ["-mr", "--timefmt", "%s", "--format", "%T %e %w%f", "-e", "create", "-e", "close_write", "-e", "delete", "-e", "moved_from", "-e", "moved_to", dirPath], {detached : true, stdoutcb : linecb, stderrcb : linecb});
	return {stop : async () => await runUtil.kill(p, "SIGKILL")};
}

/** Safely moves a file from src to dest, will try to just rename it, but will copy and remove original if needed */
export async function move(src, dest)
{
	if(!(await exists(src)))
		return;
		
	if(src===dest)
		throw new Error(`src and dest are identical: ${src}`);

	if(await exists(dest))
		await unlink(dest, {recursive : true});
	
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
	await writeTextFile(filePath, data.toString("utf8")[typeof data==="string" ? "replaceAll" : "replace"](findMe, replaceWith));
}

/** Reads in a JSON L file, line by line, calling async cb(line) for each line read */
export async function readJSONLFile(filePath, cb, {dontParse}={})
{
	const lines = [];
	cb ||= line =>
	{
		if(!line)
			return;
		
		lines.push(line);
	};

	if(filePath.toLowerCase().endsWith(".gz"))
	{
		await runUtil.run("pigz", ["-dc", filePath], {stdoutcb : async line => await cb(dontParse ? line : xu.parseJSON(line), line)});
	}
	else
	{
		for await (const line of (await Deno.open(filePath)).readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream()))
			await cb(dontParse ? line : xu.parseJSON(line), line);
	}

	if(lines.length>0)
		return lines;
}

/** reads in byteCount bytes from filePath and returns a Uint8Array */
export async function readFileBytes(filePath, byteCount, offset=null)
{
	const bytesToRead = Math.min(byteCount, (await Deno.stat(filePath)).size-(offset || 0));

	const f = await Deno.open(filePath, {read : true});
	if(offset!==null)
		await f.seek(offset, offset<0 ? Deno.SeekMode.End : Deno.SeekMode.Start);
	const buf = new Uint8Array(bytesToRead);
	let bytesRead = 0;
	while(bytesRead<buf.length)
	{
		const readCount = await f.read(buf.subarray(bytesRead));
		if(readCount===null)
			break;
		bytesRead += readCount;
	}
	
	f.close();
	return buf;
}

/** reads in the entire file at filePath and converts to encoding. This is because Deno.readTextFile as of 1.21 will throw an exception on ANY invalid UTF-8 chars which is NOT ideal */
export async function readTextFile(filePath, encoding="utf-8")
{
	return new TextDecoder(encoding).decode(await Deno.readFile(filePath));
}

/** Returns a recursive list of all files and directories contained in dirPath.
 * Options:
 *  depth   	Maximum levels deep to look. Default, infinite.
 *  glob    	If set, the relative path from the root must match this glob to be included
 * 	nodir		Set to true to omit directories from the results
 *  nofile		Set to true to omit files from the results
 *  nosymlink   Set to true to omit symlinks from the results
 *  regex		If set, the relative path from the root must match this regex to be included
 *  relative	If set the returning files will be relative to root rather than absolute
 *  sort		Sort the results by depth, then alphabetically
 *
 * Deno's fs.expandGlob() isn't anywhere close to being ready for prime time usage, lots of weird bugs (glob is hard to get right)
 * Likewise, fs.walk() suffers from issues such as throwing exceptions whenever it encounters non-standard files, such as sockets
 * Deno.readDir() doesn't suffer from these problems, so I've rolled my own simplified blog with a simple regex match
 */
export async function tree(root, {depth=Number.MAX_SAFE_INTEGER, glob, nodir=false, nofile=false, nosymlink=false, regex, relative, sort, _originalRoot=root}={})
{
	if(depth===0 || !(await exists(root)))
		return [];

	if(!(await Deno.stat(root))?.isDirectory)
		throw new Error(`root ${root} must be a directory`);
	
	if(glob && regex)
		throw new Error(`glob and regex cannot both be set, pick one or the other`);
	
	if(glob)
		regex = path.globToRegExp(glob, {extended : true});

	if(regex && regex instanceof RegExp===false)
		throw new TypeError(`regex must be an actual RegExp to avoid all sorts of edge cases when matching`);

	let r = [];
	try
	{
		for await (const entry of Deno.readDir(root))	// if root dir is removed while traversing, this will throw an exception
		{
			const entryPath = path.join(root, entry.name);
			if((!regex || regex.test(path.relative(_originalRoot, entryPath))) && ((entry.isDirectory && !nodir) || (!entry.isDirectory && !nofile)) && (!entry.isSymlink || !nosymlink))
				r.push(entryPath);

			if(entry.isDirectory)
			{
				const subEntries = await tree(entryPath, {nodir, nofile, nosymlink, regex, _originalRoot, depth : depth-1});

				// I used to just do r.push(...subEntries) but if subEntries is huge like 100,000+ files, we get a maximum call stack error. So we do it this way instead
				for(const subEntry of subEntries)
					r.push(subEntry);
			}
		}
	}
	catch {}

	if(relative)
		r = r.map(v => path.relative(_originalRoot, v));

	if(sort)
		r = r.sortMulti();

	return r;
}

/** removes the file or directory, but only if it exists */
export async function unlink(targetPath, o={})
{
	if(!(await exists(targetPath)))
		return;

	if(!o.recursive && (await Deno.stat(targetPath))?.isDirectory)
		return;
	
	return await Deno.remove(targetPath, o);
}

/** writes all the 'lines' (array of Objects) as JSON L file to filePath */
export async function writeJSONLFile(filePath, lines)
{
	const gz = filePath.toLowerCase().endsWith(".gz");
	
	const file = await Deno.open(gz ? path.join(path.dirname(filePath), path.basename(filePath, ".gz")) : filePath, {create : true, write : true, truncate : true});
	const encoder = new TextEncoder();

	for(const line of lines)
		await new Blob([encoder.encode(`${JSON.stringify(line)}\n`)]).stream().pipeTo(file.writable, {preventClose : true});

	file.close();

	if(gz)
		await runUtil.run("pigz", ["-f", path.join(path.dirname(filePath), path.basename(filePath, ".gz"))]);
}

/** writes the data as text to filePath. We wrap Deno.writeTextFile() because we needed to do it for readTextFile() and this keeps clear that we always use fileUtil.* for these two ops */
export async function writeTextFile(filePath, data, options)
{
	return await Deno.writeTextFile(filePath, data, options);	// eslint-disable-line no-restricted-syntax
}
