import {xu} from "xu";
import {assertStrictEquals, path} from "std";
import * as hashUtil from "../hashUtil.js";

const FILES_DIR = path.join(xu.dirname(import.meta), "files");
const TEST_FILE_PATH = path.join(FILES_DIR, "input.png");
const TEST_FILE_MD5 = "8be8ce12e5e0589d69a54b21b1d4af9e";

Deno.test("hashData", async () =>
{
	const rawData = await Deno.readFile(TEST_FILE_PATH);
	assertStrictEquals(hashUtil.hashData("md5", rawData), TEST_FILE_MD5);
});

Deno.test("hashFile", async () =>	// eslint-disable-line sembiance/shorter-arrow-funs
{
	assertStrictEquals(await hashUtil.hashFile("md5", TEST_FILE_PATH), TEST_FILE_MD5);
});
