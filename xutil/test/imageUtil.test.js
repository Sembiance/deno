import {xu} from "xu";
import {path, assert, assertStrictEquals} from "std";
import * as imageUtil from "../imageUtil.js";
import * as fileUtil from "../fileUtil.js";

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
	await fileUtil.unlink(tmpFilePath);
	assertStrictEquals(width, 640);
	assertStrictEquals(height, 480);
});

Deno.test("getInfo", async () =>
{
	let r = await imageUtil.getInfo(path.join(FILES_DIR, "input.png"));
	assertStrictEquals(r.width, 1487);
	assertStrictEquals(r.height, 1500);
	assertStrictEquals(r.colorCount, 355_646);
	assertStrictEquals(r.format, "PNG");
	assertStrictEquals(r.canvasWidth, 1487);
	assertStrictEquals(r.canvasHeight, 1500);
	assertStrictEquals(r.size, 3_328_508);
	assertStrictEquals(r.opaque, false);
	assertStrictEquals(r.compressionType, "Zip");

	r = await imageUtil.getInfo(path.join(FILES_DIR, "yoda.gif"));
	assertStrictEquals(r.width, 640);
	assertStrictEquals(r.height, 481);
	assertStrictEquals(r.colorCount, 152);
	assertStrictEquals(r.format, "GIF");
	assertStrictEquals(r.canvasWidth, 640);
	assertStrictEquals(r.canvasHeight, 481);
	assertStrictEquals(r.size, 197_663);
	assertStrictEquals(r.opaque, true);
	assertStrictEquals(r.compressionType, "LZW");

	// this file should cause imagemagick to consume all RAM, unless it's been fixed: https://github.com/ImageMagick/ImageMagick/issues/7832
	// so this test is to ensure it doesn't lock up system
	const startAt = performance.now();
	r = await imageUtil.getInfo(path.join(FILES_DIR, "_7AD4C6FDA1664599A5DE1A7FF89000C2"));
	assert((performance.now()-startAt)<xu.SECOND*20);
	assertStrictEquals(r.width, 66);
	assertStrictEquals(r.height, 99);

	r = await imageUtil.getInfo(path.join(FILES_DIR, "abydos.psd"));
	assertStrictEquals(r.width, 800);
	assertStrictEquals(r.height, 600);
	assertStrictEquals(r.colorCount, 90427);
	assertStrictEquals(r.format, "PSD");
	assertStrictEquals(r.canvasWidth, 1600);
	assertStrictEquals(r.canvasHeight, 1600);
	assertStrictEquals(r.size, 4_665_024);
	assertStrictEquals(r.opaque, false);
	assertStrictEquals(r.compressionType, "RLE");
});
