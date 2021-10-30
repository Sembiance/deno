import {assertStrictEquals} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import * as videoUtil from "../videoUtil.js";
import * as path from "https://deno.land/std@0.111.0/path/mod.ts";

const FILES_DIR = path.join(path.dirname(path.fromFileUrl(import.meta.url)), "files");

Deno.test("getInfo", async () =>
{
	const info = await videoUtil.getInfo(path.join(FILES_DIR, "video.mp4"));
	assertStrictEquals(info.width, 1920);
	assertStrictEquals(info.height, 1080);
	assertStrictEquals(info.duration, 67.25);
	assertStrictEquals(info.fps, 23.976);
	assertStrictEquals(info.bitrate, 2_703_208);
	assertStrictEquals(info.codec, "ffh264");
	assertStrictEquals(info.demuxer, "lavfpref");
	assertStrictEquals(info.format, "H264");
	assertStrictEquals(info.mimeType, "video/h264");
});
