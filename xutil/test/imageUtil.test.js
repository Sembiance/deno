import {assertStrictEquals} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import * as imageUtil from "../imageUtil.js";
import * as path from "https://deno.land/std@0.111.0/path/mod.ts";

const FILES_DIR = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "files");

Deno.test("getWidthHeight", async () =>
{
	const [width, height] = await imageUtil.getWidthHeight(path.join(FILES_DIR, "input.png"));
	assertStrictEquals(width, 1487);
	assertStrictEquals(height, 1500);
});

Deno.test("randomCrop", async () =>
{
	const tmpFilePath = "/mnt/ram/tmp/input.png";
	await imageUtil.randomCrop(path.join(FILES_DIR, "input.png"), tmpFilePath, 640, 480);
	const [width, height] = await imageUtil.getWidthHeight(tmpFilePath);
	await Deno.remove(tmpFilePath);
	assertStrictEquals(width, 640);
	assertStrictEquals(height, 480);
});
