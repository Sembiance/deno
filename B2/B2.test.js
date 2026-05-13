import {xu} from "xu";
import {assertStrictEquals, assert, path} from "std";
import {B2} from "B2";

Deno.test("fileSize", async () =>
{
	const b2 = await B2.create("/mnt/compendium/auth/b2_rclone_discmaster2.conf");
	assert(await b2.fileSize("discmaster2", "json/suggest.json")>1);
	assertStrictEquals(await b2.fileSize("discmaster2", "json/INVALID_PATH.json"), -1);
});

Deno.test("uploadFile", async () =>
{
	const b2 = await B2.create("/mnt/compendium/auth/b2_rclone_discmaster2.conf");
	const filePath = path.join(import.meta.dirname, "test.gif");
	await b2.uploadFile(filePath, "discmaster2", "test2.gif");
	assertStrictEquals(await b2.fileSize("discmaster2", "test2.gif"), (await Deno.stat(filePath)).size);
	await b2.deleteFile("discmaster2", "test2.gif");
	assertStrictEquals(await b2.fileSize("discmaster2", "test2.gif"), -1);
});
