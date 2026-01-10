import {xu} from "xu";
import {assertStrictEquals, assert, assertEquals, path} from "std";
import {fileUtil, hashUtil, runUtil} from "xutil";
import {Sparkey} from "./Sparkey.js";

const HUGE_FILE_PATH = "/mnt/trove/iso/SIGGRAPH 2001 DVD/SIGGRAPH 2001 DVD.iso";

Deno.test("putGet", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putGet");
	const db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spi`), true);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spl`), true);

	assertStrictEquals(db.getText("hello"), "Hello, World!");

	assertStrictEquals(db.putText("2nd", "second"), true);
	assertStrictEquals(db.putText("3rd", "third"), true);

	assertStrictEquals(db.getText("2nd"), "second");
	assertStrictEquals(db.getText("3rd"), "third");

	await db.truncate();
	db.unload();
});

Deno.test("listKeys", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putGet");
	const db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	assertStrictEquals(db.putText("2nd", "second"), true);
	assertStrictEquals(db.putText("3rd", "third"), true);
	assertEquals(await db.listKeys(), ["hello", "2nd", "3rd"]);

	await db.truncate();
	db.unload();
});

Deno.test("delete", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-delete");
	let db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	db.unload();
	db = new Sparkey(dbFilePathPrefix);
	assertStrictEquals(db.getText("hello"), "Hello, World!");
	assertStrictEquals(db.getLength("hello"), 13);

	assertStrictEquals(db.delete("hello"), true);

	assertStrictEquals(db.getLength("hello"), 0);
	assertStrictEquals(db.getText("hello"), undefined);

	db.unload();

	db = new Sparkey(dbFilePathPrefix);
	assertStrictEquals(db.getLength("hello"), 0);
	assertStrictEquals(db.getText("hello"), undefined);

	await db.truncate();
	db.unload();
});

Deno.test("getLength", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-getLength");
	const db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	assertStrictEquals(db.getText("hello"), "Hello, World!");
	assertStrictEquals(db.getLength("hello"), 13);

	await db.truncate();
	db.unload();
});

Deno.test("putFile", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putFile");
	const db = new Sparkey(dbFilePathPrefix);

	const srcFilePath = path.join(import.meta.dirname, "test.png");
	assertStrictEquals(await hashUtil.hashFile("blake3", srcFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");
	await db.putFile("testFileData", srcFilePath);

	const tmpFilePath = await fileUtil.genTempPath(undefined, "-Sparkey-test-putFile.png");
	await Deno.writeFile(tmpFilePath, db.get("testFileData"));
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	assertStrictEquals(await hashUtil.hashFile("blake3", tmpFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");
	await fileUtil.unlink(tmpFilePath);

	await db.truncate();
	db.unload();
});

Deno.test("putFileHuge", async () =>
{
	if(Deno.hostname()!=="eaglehollow")
		return;
	if(!await fileUtil.exists(HUGE_FILE_PATH))
		return;

	const beforeSum = await hashUtil.hashFile("blake3", HUGE_FILE_PATH);

	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putFileHuge");
	const db = new Sparkey(dbFilePathPrefix);
	await db.putFile("hugeFile", HUGE_FILE_PATH);

	const tmpFilePath = await fileUtil.genTempPath(undefined, "-Sparkey-test-putFileHuge");
	db.extractFile("hugeFile", tmpFilePath);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	assertStrictEquals(await hashUtil.hashFile("blake3", tmpFilePath), beforeSum);
	await fileUtil.unlink(tmpFilePath);

	await db.truncate();
	db.unload();
});

Deno.test("extractFile", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-extractFile");
	const db = new Sparkey(dbFilePathPrefix);

	const srcFilePath = path.join(import.meta.dirname, "test.png");
	assertStrictEquals(await hashUtil.hashFile("blake3", srcFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");
	assertStrictEquals(await db.putFile("testFileData", srcFilePath));

	const tmpFilePath = await fileUtil.genTempPath(undefined, "-Sparkey-test-extractFile.png");
	await db.extractFile("testFileData", tmpFilePath);
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	assertStrictEquals(await hashUtil.hashFile("blake3", tmpFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");
	await fileUtil.unlink(tmpFilePath);

	await db.truncate();
	db.unload();
});

Deno.test("putMany", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putGet");
	const db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putTexts(["hello", "2nd", "3rd"], ["Hello, World!", "second", "third"]), true);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spi`), true);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spl`), true);

	assertStrictEquals(db.getText("hello"), "Hello, World!");
	assertStrictEquals(db.getText("2nd"), "second");
	assertStrictEquals(db.getText("3rd"), "third");

	await db.truncate();
	db.unload();
});

Deno.test("maxLen", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putGet");
	const db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	assertStrictEquals(db.getText("hello"), "Hello, World!");

	assertStrictEquals(db.getText("hello", 4), "Hell");

	await db.truncate();
	db.unload();
});

Deno.test("openFiles", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-putGet");
	const db = new Sparkey(dbFilePathPrefix);
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	assertStrictEquals(db.getText("hello"), "Hello, World!");

	let {stdout} = await runUtil.run("lsof", ["-p", Deno.pid.toString()]);
	assert(stdout.includes("/mnt/compendium/DevLab/deno/Sparkey/sparkey.so"));

	await db.truncate();
	db.unload();

	({stdout} = await runUtil.run("lsof", ["-p", Deno.pid.toString()]));
	assert(!stdout.includes("/mnt/compendium/DevLab/deno/Sparkey/sparkey.so"));
});

Deno.test("truncate", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-truncate");
	const db = new Sparkey(dbFilePathPrefix);
	
	assertStrictEquals(db.putText("hello", "Hello, World!"), true);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spi`), true);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spl`), true);

	assertStrictEquals(db.getText("hello"), "Hello, World!");

	await db.truncate();

	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spi`), false);
	assertStrictEquals(await fileUtil.exists(`${dbFilePathPrefix}.spl`), false);
	assertStrictEquals(db.getText("hello"), undefined);

	assertStrictEquals(db.putText("2nd", "second"), true);
	assertStrictEquals(db.putText("3rd", "third"), true);

	assertStrictEquals(db.getText("2nd"), "second");
	assertStrictEquals(db.getText("3rd"), "third");

	await db.truncate();
	db.unload();
});

Deno.test("binary", async () =>
{
	const dbFilePathPrefix = await fileUtil.genTempPath(undefined, "-Sparkey-test-binary");
	const db = new Sparkey(dbFilePathPrefix);
	
	const srcFilePath = path.join(import.meta.dirname, "test.png");
	assertStrictEquals(db.put("myFileData", await Deno.readFile(srcFilePath)), true);

	const tmpFilePath = await fileUtil.genTempPath(undefined, "-Sparkey-test-binary.png");
	await Deno.writeFile(tmpFilePath, db.get("myFileData"));
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	
	assertStrictEquals(await hashUtil.hashFile("blake3", srcFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");
	assertStrictEquals(await hashUtil.hashFile("blake3", tmpFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");

	await db.truncate();
	db.unload();
});
