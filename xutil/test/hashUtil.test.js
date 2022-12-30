import {xu} from "xu";
import {assertStrictEquals, path} from "std";
import * as hashUtil from "../hashUtil.js";
import * as fileUtil from "../fileUtil.js";
import * as runUtil from "../runUtil.js";

const FILES_DIR = path.join(xu.dirname(import.meta), "files");
const TEST_FILE_PATH = path.join(FILES_DIR, "input.png");
const TEST_FILE_MD5 = "8be8ce12e5e0589d69a54b21b1d4af9e";

Deno.test("hashData", async () =>
{
	const rawData = await Deno.readFile(TEST_FILE_PATH);
	assertStrictEquals(await hashUtil.hashData("md5", rawData), TEST_FILE_MD5);
	assertStrictEquals(await hashUtil.hashData("SHA-1", "Hello, World!"), "0a0a9f2a6772942557ab5355d76af442f8f65e01");
});

Deno.test("hashFile", async () =>
{
	assertStrictEquals(await hashUtil.hashFile("md5", TEST_FILE_PATH), TEST_FILE_MD5);
	assertStrictEquals(await hashUtil.hashFile("blake3", TEST_FILE_PATH), "a3a6db28ae11c15e968f4b334aebf2f63e2af639a01affe55ccec1e65e1c3406");
	assertStrictEquals(await hashUtil.hashFile("SHA-1", TEST_FILE_PATH), "9d2fc7d5d77169b9621bb5b76d965862df511c24");
});

Deno.test("hashFileHuge", async () =>
{
	const hugeFilePath = await fileUtil.genTempPath();
	await runUtil.run("dd", ["if=/dev/random", `of=${hugeFilePath}`, "bs=8815936", "count=512"]);
	const blake3Hash = await hashUtil.hashFile("blake3", hugeFilePath);
	const sha1Hash = await hashUtil.hashFile("SHA-1", hugeFilePath);
	await fileUtil.unlink(hugeFilePath);
	assertStrictEquals(blake3Hash.length, 64);
	assertStrictEquals(sha1Hash.length, 40);
});
