import {assertEquals, assertStrictEquals} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import * as fileUtil from "../fileUtil.js";
import * as path from "https://deno.land/std@0.111.0/path/mod.ts";

const FILES_DIR = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "files");
const GLOB_DIR = path.join(FILES_DIR, "globTest", "A_dir_with[brackets]_and?(parenthesis)");

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

Deno.test("tree", async () =>
{
	let r = await fileUtil.tree(GLOB_DIR);
	assertEquals(r, [
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt"
	]);

	r = await fileUtil.tree(GLOB_DIR, {nodir : true});
	assertEquals(r, [
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file1.txt",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt"
	]);

	r = await fileUtil.tree(GLOB_DIR, {nodir : true, regex : /2\.txt$/});
	assertEquals(r, [
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/file2.txt"
	]);

	r = await fileUtil.tree(GLOB_DIR, {nodir : true, regex : /subdir\/.*3\.txt$/});
	assertEquals(r, [
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir/file3.txt"
	]);

	r = await fileUtil.tree(GLOB_DIR, {nofile : true});
	assertEquals(r, [
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/emptyDir",
		"/mnt/compendium/DevLab/deno/xutil/test/files/globTest/A_dir_with[brackets]_and?(parenthesis)/subdir"
	]);

	r = await fileUtil.tree(GLOB_DIR, {nofile : true, nodir : true});
	assertStrictEquals(r.length, 0);
});

Deno.test("writeFile", async () =>
{
	const tmpFilePath = await fileUtil.genTempPath();
	const data = "this is just\na test";
	await fileUtil.writeFile(tmpFilePath, data);
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), data);
	await fileUtil.writeFile(tmpFilePath, "more", undefined, {append : true});
	assertStrictEquals(await fileUtil.readFile(tmpFilePath), `${data}more`);
});
