/* eslint-disable sembiance/shorter-arrow-funs */
import {xu} from "xu";
import {path, assertEquals, assertStrictEquals, assert, base64Encode, delay} from "std";
import * as fileUtil from "../fileUtil.js";
import * as runUtil from "../runUtil.js";

const FILES_DIR = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "files");
const GLOB_DIR = path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)");

const JSONL_LINES = ["abc123", {obj : 123, abc : "123"}, {omg : true, num : 129_321_512_231}];

Deno.test("areEqual", async () =>
{
	assertStrictEquals(await fileUtil.areEqual(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "input.gif")), false);
	assertStrictEquals(await fileUtil.areEqual(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "input.png")), true);
	assertStrictEquals(await fileUtil.areEqual(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "duplicateInput.png")), true);
});

Deno.test("concat", async () =>
{
	const CONCAT_DEST_FILE_PATH = await fileUtil.genTempPath();
	await fileUtil.concat([path.join(FILES_DIR, "a.txt"), path.join(FILES_DIR, "b.txt")], CONCAT_DEST_FILE_PATH);
	assert(await fileUtil.areEqual(CONCAT_DEST_FILE_PATH, path.join(FILES_DIR, "ab.txt")));
	await fileUtil.unlink(CONCAT_DEST_FILE_PATH);
	await fileUtil.concat([path.join(FILES_DIR, "a.txt"), path.join(FILES_DIR, "b.txt")], CONCAT_DEST_FILE_PATH, {seperator : "_"});
	assert(await fileUtil.areEqual(CONCAT_DEST_FILE_PATH, path.join(FILES_DIR, "ab_sep.txt")));
	await fileUtil.unlink(CONCAT_DEST_FILE_PATH);
});

Deno.test("emptyDir", async () =>
{
	const EMPTY_DIR_PATH = await fileUtil.genTempPath();
	await Deno.mkdir(path.join(EMPTY_DIR_PATH, "subdir"), {recursive : true});
	await fileUtil.writeTextFile(path.join(EMPTY_DIR_PATH, "abc.txt"), "abc123");
	await fileUtil.writeTextFile(path.join(EMPTY_DIR_PATH, "subdir", "subfile.dat"), "DATA\nGOES\nHERE");

	assertStrictEquals(await fileUtil.exists(path.join(EMPTY_DIR_PATH, "subdir")), true);
	assertStrictEquals(await fileUtil.exists(path.join(EMPTY_DIR_PATH, "abc.txt")), true);
	assertStrictEquals(await fileUtil.exists(path.join(EMPTY_DIR_PATH, "subdir", "subfile.dat")), true);

	await fileUtil.emptyDir(EMPTY_DIR_PATH);

	assertStrictEquals(await fileUtil.exists(path.join(EMPTY_DIR_PATH, "subdir")), false);
	assertStrictEquals(await fileUtil.exists(path.join(EMPTY_DIR_PATH, "abc.txt")), false);
	assertStrictEquals(await fileUtil.exists(path.join(EMPTY_DIR_PATH, "subdir", "subfile.dat")), false);

	await fileUtil.unlink(EMPTY_DIR_PATH);
});

Deno.test("exists", async () =>
{
	assertStrictEquals(await fileUtil.exists(path.join(FILES_DIR, "input.png")), true);
	assertStrictEquals(await fileUtil.exists(path.join(FILES_DIR, "noSuchFileHereMuHahaha")), false);
	assertStrictEquals(await fileUtil.exists(path.join(FILES_DIR, "input.png", "subFileDoesNotExist")), false);
});

Deno.test("genTempPath", async () =>
{
	const r = await fileUtil.genTempPath();
	assertStrictEquals(r.startsWith("/mnt/ram/tmp"), true);
	assertStrictEquals(await fileUtil.exists(r), false);
	assertStrictEquals((await fileUtil.genTempPath("/tmp")).startsWith("/tmp"), true);
	assertStrictEquals((await fileUtil.genTempPath(undefined, ".png")).endsWith(".png"), true);

	let tempPaths = await [].pushSequence(1, 100_000).parallelMap(() => fileUtil.genTempPath());
	assertStrictEquals(tempPaths.unique().length, tempPaths.length);

	tempPaths = await [].pushSequence(1, 10000).parallelMap(() => fileUtil.genTempPath(undefined, [].pushSequence(97, 122).pickRandom(Math.randomInt(0, 4)).map(v => String.fromCharCode(v)).join(""), {maxFilenameLength : 8}));
	assertStrictEquals(tempPaths.unique().length, tempPaths.length);
	assertStrictEquals(tempPaths.every(v => path.basename(v).length<=8), true);
});

Deno.test("gunzip", async () =>
{
	assertStrictEquals(new TextDecoder().decode(await fileUtil.gunzip(path.join(FILES_DIR, "gzipped.gz"))), "prefix\nabc\n123\nxyz");
});

Deno.test("lock", async () =>
{
	const counterFilePath = await fileUtil.genTempPath(undefined, ".counter");
	await fileUtil.writeTextFile(counterFilePath, "0");

	const lockFilePath = await fileUtil.genTempPath(undefined, ".lock");
	async function increaseCounter()
	{
		const lockFile = await fileUtil.lock(lockFilePath);
		const counter = +(await fileUtil.readTextFile(counterFilePath));
		await fileUtil.writeTextFile(counterFilePath, (counter+1).toString());
		await fileUtil.unlock(lockFile);
		return counter;
	}

	const MAX_COUNTER = 1000;
	const r = [];
	for(let i=0;i<MAX_COUNTER;i++)
		r.push(increaseCounter());
	assertEquals((await Promise.all(r)).sortMulti(), [].pushSequence(0, MAX_COUNTER-1));

	await fileUtil.unlink(counterFilePath);
	await fileUtil.unlink(lockFilePath);
});

Deno.test("longPaths", async () =>
{
	const tmpDirPath = await fileUtil.genTempPath();
	await Deno.mkdir(tmpDirPath);
	await Deno.copyFile(path.join(FILES_DIR, "longPath.tar"), path.join(tmpDirPath, "longPath.tar"));
	await runUtil.run("tar", ["-xf", "longPath.tar"], {cwd : tmpDirPath});

	const srcFilePath = path.join(tmpDirPath, "wip/file/elarch-201205-Avtomatika.iso§/AdbeRdr1010_ru_RU.exe§/ARCHIVE_7Z/131§/Data1.cab§/AcroRd32.dll§/ASWF/10003§/images/69_com.adobe.portfolio.skins.BestExperienceAlertSkin__embed_mxml_____________assets_AX_Port_UpgradeReader_XL_N_png_10874260….adobe.portfolio.skins.BestExperienceAlertSkin__embed_mxml_____________assets_AX_Port_UpgradeReader_XL_N_png_1087426077/portfolio.managers.ThumbnailManager_videoImage_com.adobe.portfolio.mana/Details_Styles__embed_css_assets_CalendarIcon_pn/data.txt");
	assertStrictEquals(await fileUtil.readTextFile(srcFilePath), "Hello, World!\n");
	
	const destFilePath = path.join(path.dirname(srcFilePath), "dataOut.txt");
	await fileUtil.writeTextFile(destFilePath, "Hello, World 2!\n");
	assertStrictEquals(await fileUtil.readTextFile(destFilePath), "Hello, World 2!\n");

	await fileUtil.unlink(tmpDirPath, {recursive : true});
});

Deno.test("mkdir", async () =>
{
	const baseTempDirPath = await fileUtil.genTempPath();
	let tempDirPath = baseTempDirPath;
	await fileUtil.mkdir(tempDirPath);
	assert((await Deno.stat(tempDirPath)).isDirectory);

	tempDirPath = path.join(tempDirPath, "a", "b", "c");
	await fileUtil.mkdir(tempDirPath, {recursive : true});
	assert((await Deno.stat(tempDirPath)).isDirectory);

	tempDirPath = path.join(tempDirPath, "file");
	await fileUtil.writeTextFile(tempDirPath, "Hello, World!");
	tempDirPath = path.join(tempDirPath, "nope");
	await fileUtil.mkdir(tempDirPath, {recursive : true, force : true});
	assert((await Deno.stat(tempDirPath)).isDirectory);

	await fileUtil.unlink(baseTempDirPath, {recursive : true});
});

Deno.test("monitor", async () =>
{
	const dirFilePath = await fileUtil.genTempPath();
	await Deno.mkdir(dirFilePath);
	
	const aFilePath = path.join(dirFilePath, "a.txt");
	await fileUtil.writeTextFile(aFilePath, "Hello, World!");

	const subDirPath = path.join(dirFilePath, "subdir");
	await Deno.mkdir(subDirPath);

	const bFilePath = path.join(subDirPath, "b.txt");
	await fileUtil.writeTextFile(bFilePath, "Hello, World!");

	const tmpOtherFilePath = await fileUtil.genTempPath(undefined, ".txt");
	await fileUtil.writeTextFile(tmpOtherFilePath, "Some crazy file from ANOTHER WORLD");

	let ready = false;
	let done = false;
	const events = [];
	const expectedEvents = [
		"ready", "create c.txt", "modify c.txt",
		"modify c.txt",
		"delete c.txt",
		"create d.txt", "modify d.txt",
		"delete d.txt",
		"create c.txt",
		"delete c.txt", "create subdir/d.txt",
		"delete subdir/d.txt", "delete subdir/b.txt", "delete subdir",	// sometimes the d.txt and b.txt order can change
		"create c.txt", "modify c.txt"
	];
	const monitorcb = async ({type, filePath}) =>		// eslint-disable-line require-await
	{
		if(type==="ready")
		{
			ready = true;
			events.push(type);
			return;
		}

		events.push(`${type} ${path.relative(dirFilePath, filePath)}`);
		if(events.length===expectedEvents.length)
			done = true;
	};

	const {stop} = await fileUtil.monitor(dirFilePath, monitorcb);
	await xu.waitUntil(() => ready, {timeout : xu.SECOND*10});
	
	const cFilePath = path.join(dirFilePath, "c.txt");
	await fileUtil.writeTextFile(cFilePath, "Hello, World!");
	await delay(250);
	await fileUtil.writeTextFile(cFilePath, "Hello, World! 2");
	await fileUtil.unlink(cFilePath);

	let dFilePath = path.join(dirFilePath, "d.txt");
	await fileUtil.writeTextFile(dFilePath, "Hello, World!");
	await fileUtil.move(dFilePath, cFilePath);
	dFilePath = path.join(subDirPath, "d.txt");
	await fileUtil.move(cFilePath, dFilePath);
	await fileUtil.unlink(subDirPath, {recursive : true});

	await Deno.copyFile(aFilePath, path.join(dirFilePath, "c.txt"));

	// my monitor thing doesn't currently handle rsync move replace in place that rsync does (unless --inplace is set)
	// I did make a queued version that does support that in sandbox/legacy/
	//await runUtil.run("rsync", ["-aH", tmpOtherFilePath, path.join(dirFilePath, "c.txt")], {liveOutput : true});

	await xu.waitUntil(() => done, {timeout : xu.SECOND*10});

	await stop();

	await fileUtil.unlink(tmpOtherFilePath);

	assertEquals(events, expectedEvents);
});

Deno.test("move", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	await Deno.copyFile(path.join(FILES_DIR, "input.png"), path.join(tmpFilePath));
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	assertStrictEquals((await Deno.stat(tmpFilePath)).size, 3_328_508);
	let destFilePath = await fileUtil.genTempPath();
	await fileUtil.move(tmpFilePath, destFilePath);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), false);
	assertStrictEquals(await fileUtil.exists(destFilePath), true);
	assertStrictEquals((await Deno.stat(destFilePath)).size, 3_328_508);
	await fileUtil.unlink(destFilePath);

	await Deno.copyFile(path.join(FILES_DIR, "input.png"), path.join(tmpFilePath));
	destFilePath = await fileUtil.genTempPath("/tmp");
	await fileUtil.move(tmpFilePath, destFilePath);
	await fileUtil.unlink(destFilePath);
});

Deno.test("moveAll", async () =>
{
	const srcDirPath = await fileUtil.genTempPath();
	await Deno.mkdir(srcDirPath);
	await Deno.copyFile(path.join(FILES_DIR, "input.png"), path.join(srcDirPath, "input.png"));
	await Deno.copyFile(path.join(FILES_DIR, "sm.tar.gz"), path.join(srcDirPath, "sm.tar.gz"));
	await Deno.mkdir(path.join(srcDirPath, "subdir"));
	await Deno.copyFile(path.join(FILES_DIR, "TSCOMP.EXE"), path.join(srcDirPath, "subdir", "TSCOMP.EXE"));

	assertStrictEquals(await fileUtil.exists(path.join(srcDirPath, "input.png")), true);
	assertStrictEquals(await fileUtil.exists(path.join(srcDirPath, "sm.tar.gz")), true);
	assertStrictEquals(await fileUtil.exists(path.join(srcDirPath, "subdir", "TSCOMP.EXE")), true);

	const destDirPath = await fileUtil.genTempPath();
	await Deno.mkdir(destDirPath);
	
	assertStrictEquals(await fileUtil.exists(path.join(destDirPath, "input.png")), false);
	assertStrictEquals(await fileUtil.exists(path.join(destDirPath, "sm.tar.gz")), false);
	assertStrictEquals(await fileUtil.exists(path.join(destDirPath, "subdir", "TSCOMP.EXE")), false);

	await fileUtil.moveAll(srcDirPath, destDirPath);

	assertStrictEquals(await fileUtil.exists(path.join(srcDirPath, "input.png")), false);
	assertStrictEquals(await fileUtil.exists(path.join(srcDirPath, "sm.tar.gz")), false);
	assertStrictEquals(await fileUtil.exists(path.join(srcDirPath, "subdir", "TSCOMP.EXE")), false);
	
	assertStrictEquals(await fileUtil.exists(path.join(destDirPath, "input.png")), true);
	assertStrictEquals(await fileUtil.exists(path.join(destDirPath, "sm.tar.gz")), true);
	assertStrictEquals(await fileUtil.exists(path.join(destDirPath, "subdir", "TSCOMP.EXE")), true);

	await fileUtil.unlink(srcDirPath, {recursive : true});
	await fileUtil.unlink(destDirPath, {recursive : true});
});

Deno.test("readFileBytes", async () =>
{
	let a = await fileUtil.readFileBytes(path.join(FILES_DIR, "test.png"), 4);
	assertEquals(a, new Uint8Array([0x89, 0x50, 0x4E, 0x47]));

	a = await fileUtil.readFileBytes(path.join(FILES_DIR, "test.png"), 4, -8);
	assertEquals(a, new Uint8Array([0x49, 0x45, 0x4E, 0x44]));

	a = await fileUtil.readFileBytes(path.join(FILES_DIR, "test.png"), 4, 58);
	assertEquals(a, new TextEncoder().encode("IDAT"));
});

Deno.test("readJSONLFile", async () =>
{
	const lines = [];
	await fileUtil.readJSONLFile(path.join(FILES_DIR, "test.jsonl"), line => lines.push(line));
	assertEquals(JSONL_LINES, lines);

	lines.clear();
	await fileUtil.readJSONLFile(path.join(FILES_DIR, "test.jsonl"), line => lines.push(line), {dontParse : true});
	assertEquals(JSONL_LINES.map(v => JSON.stringify(v)), lines);

	lines.clear();
	await fileUtil.readJSONLFile(path.join(FILES_DIR, "test.jsonl.gz"), line => lines.push(line));
	assertEquals(JSONL_LINES, lines);

	assertEquals(JSONL_LINES, await fileUtil.readJSONLFile(path.join(FILES_DIR, "test.jsonl")));
	assertEquals(JSONL_LINES, await fileUtil.readJSONLFile(path.join(FILES_DIR, "test.jsonl.gz")));

	let count=0;
	let totalSize=0;
	await fileUtil.readJSONLFile(path.join(FILES_DIR, "5622.jsonl.gz"), o => { count++; totalSize += o.size; });
	assertStrictEquals(totalSize, 3_186_404_318);
	assertStrictEquals(count, 144_254);

	count = 0;
	await fileUtil.readJSONLFile(path.join(FILES_DIR, "1.jsonl.gz"), async () => { await delay(1); count++; });
	assertStrictEquals(count, 78);

	try
	{
		await fileUtil.readJSONLFile(path.join(FILES_DIR, "1.jsonl.gz"), () => { noVar-=otherNoVar; });	// eslint-disable-line no-undef, sonarjs/no-implicit-global, sonarjs/no-reference-error
	}
	catch(err)
	{
		assert(err.stack.includes("ReferenceError: noVar is not defined"));
	}
});

Deno.test("readTextFile", async () =>
{
	const text = await fileUtil.readTextFile("/mnt/compendium/DevLab/deno/xutil/test/files/desktop.ini");
	assertEquals(base64Encode(text), "Wy5TaGVsbENsYXNzSW5mb10NCkNvbmZpcm1GaWxlT3A9MA0KDQpbezhCRUJCMjkwLTUyRDAtMTFkMC1CN0Y0LTAwQzA0RkQ3MDZFQ31dDQpNZW51TmFtZT0mUO+/vWdpbmFzIGVuIG1pbmlhdHVyYQ0KVG9vbFRpcFRleHQ9JlDvv71naW5hcyBlbiBtaW5pYXR1cmENCkhlbHBUZXh0PU11ZXN0cmEgbG9zIGVsZW1lbnRvcyB1dGlsaXphbmRvIGxhIHZpc3RhIGRlIHDvv71naW5hcyBlbiBtaW5pYXR1cmEuDQpBdHRyaWJ1dGVzPTB4NjAwMDAwMDANCg0KW0V4dFNoZWxsRm9sZGVyVmlld3NdDQp7OEJFQkIyOTAtNTJEMC0xMWQwLUI3RjQtMDBDMDRGRDcwNkVDfT17OEJFQkIyOTAtNTJEMC0xMWQwLUI3RjQtMDBDMDRGRDcwNkVDfQ0K");
});

Deno.test("searchReplace", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	await Deno.copyFile("/mnt/compendium/DevLab/deno/xutil/test/files/ab.txt", tmpFilePath);
	assertStrictEquals(await fileUtil.readTextFile(tmpFilePath), "prefix\nabc\n123\nxyz");
	await fileUtil.searchReplace(tmpFilePath, "abc", "yah, something 777 else now");
	assertStrictEquals(await fileUtil.readTextFile(tmpFilePath), "prefix\nyah, something 777 else now\n123\nxyz");
	await fileUtil.searchReplace(tmpFilePath, /\d+/g, "numbers");
	assertStrictEquals(await fileUtil.readTextFile(tmpFilePath), "prefix\nyah, something numbers else now\nnumbers\nxyz");
	await fileUtil.unlink(tmpFilePath);
});

Deno.test("tree", async () =>
{
	let caughtError = null;
	try { await fileUtil.tree(path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt")); }
	catch(err) { caughtError = err; }
	assert(caughtError.toString().includes("file1.txt must be a directory"));

	try { await fileUtil.tree(GLOB_DIR, {regex : /^hrm/, glob : "**/*"}); }
	catch(err) { caughtError = err; }
	assert(caughtError.toString().includes("glob and regex cannot both be set"));

	try { await fileUtil.tree(GLOB_DIR, {regex : "NOT A REGEX"}); }
	catch(err) { caughtError = err; }
	assert(caughtError.toString().includes("regex must be an actual RegExp"));

	let r = await fileUtil.tree(GLOB_DIR);
	assertEquals(r.sort(), [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt")
	]);

	r = await fileUtil.tree(GLOB_DIR, {relative : true});
	assertEquals(r.sort(), [
		"emptyDir",
		"file1.txt",
		"file2.txt",
		"subdir",
		"subdir/file3.txt"
	]);

	r = await fileUtil.tree(path.join(FILES_DIR, "globTestSort"), {sort : true});
	assertEquals(r.sort(), [
		path.join(FILES_DIR, "globTestSort", "1"),
		path.join(FILES_DIR, "globTestSort", "2"),
		path.join(FILES_DIR, "globTestSort", "5")
	]);

	r = await fileUtil.tree(GLOB_DIR, {depth : 1});
	assertEquals(r.sort(), [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir")
	]);

	r = await fileUtil.tree(GLOB_DIR, {nodir : true});
	assertEquals(r.sort(), [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt")
	]);

	r = await fileUtil.tree(GLOB_DIR, {nodir : true, regex : /2\.txt$/});
	assertEquals(r, [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt")
	]);

	r = await fileUtil.tree(GLOB_DIR, {nodir : true, regex : /subdir\/.*3\.txt$/});
	assertEquals(r, [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt")
	]);

	r = await fileUtil.tree(GLOB_DIR, {nofile : true});
	assert(r.includesAll([
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir")
	]));

	r = await fileUtil.tree(GLOB_DIR, {nofile : true, nodir : true});
	assertStrictEquals(r.length, 0);

	r = await fileUtil.tree("/some/path/that/does/not/exist");
	assertStrictEquals(r.length, 0);

	const tmpDirPath = await fileUtil.genTempPath();
	await runUtil.run("tar", ["-xf", path.join(FILES_DIR, "hugeDirTree.tar")], {cwd : tmpDirPath});
	r = await fileUtil.tree(path.join(tmpDirPath, "hugeDirTree"), {nodir : true});
	await fileUtil.unlink(tmpDirPath, {recursive : true});
	assertStrictEquals(r.length, 130_282);

	r = await fileUtil.tree(path.join(FILES_DIR, "globTestSymlink"), {nosymlink : true, nodir : true, relative : true, sort : true});
	assertEquals(r, [
		path.join("A_dir_with[brackets]_and?(parenthesis)/file1.txt"),
		path.join("A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt")
	]);
});

Deno.test("unlink", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	const data = "this is just\na test";
	await fileUtil.writeTextFile(tmpFilePath, data);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	await fileUtil.unlink(tmpFilePath);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), false);
	await fileUtil.unlink(tmpFilePath);	// yes, call it twice to ensure that no error is reported
	assertStrictEquals(await fileUtil.exists(tmpFilePath), false);
});

Deno.test("writeJSONLFile", async () =>
{
	let tmpFilePath = await fileUtil.genTempPath(undefined, ".jsonl");
	await fileUtil.writeJSONLFile(tmpFilePath, JSONL_LINES);
	assertStrictEquals(await fileUtil.areEqual(tmpFilePath, path.join(FILES_DIR, "test.jsonl")), true);
	await fileUtil.unlink(tmpFilePath);

	tmpFilePath = await fileUtil.genTempPath(undefined, ".jsonl.gz");
	await fileUtil.writeJSONLFile(tmpFilePath, JSONL_LINES);
	const {stdout} = await runUtil.run("gunzip", ["-c", tmpFilePath]);
	assertEquals(JSONL_LINES.map(v => JSON.stringify(v)).join("\n"), stdout.trim());
	await fileUtil.unlink(tmpFilePath);
});
