import {path, assertEquals, assertStrictEquals} from "std";
import * as fileUtil from "../fileUtil.js";

const FILES_DIR = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "files");
const GLOB_DIR = path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)");

Deno.test("areEqual", async () =>
{
	assertStrictEquals(await fileUtil.areEqual(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "input.gif")), false);
	assertStrictEquals(await fileUtil.areEqual(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "input.png")), true);
	assertStrictEquals(await fileUtil.areEqual(path.join(FILES_DIR, "input.png"), path.join(FILES_DIR, "duplicateInput.png")), true);
});

Deno.test("exists", async () =>
{
	assertStrictEquals(await fileUtil.exists(path.join(FILES_DIR, "input.png")), true);
	assertStrictEquals(await fileUtil.exists(path.join(FILES_DIR, "noSuchFileHereMuHahaha")), false);
});

Deno.test("genTempPath", async () =>
{
	const r = await fileUtil.genTempPath();
	assertStrictEquals(r.startsWith("/mnt/ram/tmp"), true);
	assertStrictEquals(await fileUtil.exists(r), false);
	assertStrictEquals((await fileUtil.genTempPath("/tmp")).startsWith("/tmp"), true);
	assertStrictEquals((await fileUtil.genTempPath(undefined, ".png")).endsWith(".png"), true);
});

Deno.test("readFile", async () =>	// eslint-disable-line sembiance/shorter-arrow-funs
{
	assertStrictEquals(await fileUtil.readFile(path.join(FILES_DIR, "a.txt")), "abc\n");
});

Deno.test("readFileBytes", async () =>
{
	const a = await fileUtil.readFileBytes(path.join(FILES_DIR, "test.png"), 4);
	assertEquals(a, new Uint8Array([0x89, 0x50, 0x4E, 0x47]));
});

Deno.test("searchReplace", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	await Deno.copyFile("/mnt/compendium/DevLab/deno/xutil/test/files/ab.txt", tmpFilePath);
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), "prefix\nabc\n123\nxyz");
	await fileUtil.searchReplace(tmpFilePath, "abc", "yah, something 777 else now");
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), "prefix\nyah, something 777 else now\n123\nxyz");
	await fileUtil.searchReplace(tmpFilePath, /\d+/g, "numbers");
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), "prefix\nyah, something numbers else now\nnumbers\nxyz");
	await fileUtil.unlink(tmpFilePath);
});

Deno.test("tree", async () =>
{
	let r = await fileUtil.tree(GLOB_DIR);
	assertEquals(r.sort(), [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt")
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
	assertEquals(r, [
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir"),
		path.join(FILES_DIR, "globTest/A_dir_with[brackets]_and?(parenthesis)/subdir")
	]);

	r = await fileUtil.tree(GLOB_DIR, {nofile : true, nodir : true});
	assertStrictEquals(r.length, 0);
});

Deno.test("unlink", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	const data = "this is just\na test";
	await fileUtil.writeFile(tmpFilePath, data);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	await fileUtil.unlink(tmpFilePath);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), false);
	await fileUtil.unlink(tmpFilePath);	// yes, call it twice to ensure that no error is reported
	assertStrictEquals(await fileUtil.exists(tmpFilePath), false);
});

Deno.test("writeFile", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	const data = "this is just\na test";
	await fileUtil.writeFile(tmpFilePath, data);
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), data);
	await fileUtil.writeFile(tmpFilePath, "more", undefined, {append : true});
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), `${data}more`);
	await fileUtil.unlink(tmpFilePath);
});

