import {xu} from "xu";
import {assertStrictEquals, path} from "std";
import {fileUtil, hashUtil} from "xutil";
import {Sparkey} from "./Sparkey.js";

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
	
	const srcFilePath = path.join(xu.dirname(import.meta), "test.png");
	assertStrictEquals(db.put("myFileData", await Deno.readFile(srcFilePath)), true);

	const tmpFilePath = await fileUtil.genTempPath(undefined, "-Sparkey-test-binary.png");
	await Deno.writeFile(tmpFilePath, db.get("myFileData"));
	assertStrictEquals(await fileUtil.exists(tmpFilePath), true);
	
	assertStrictEquals(await hashUtil.hashFile("blake3", srcFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");
	assertStrictEquals(await hashUtil.hashFile("blake3", tmpFilePath), "693e401831758dab9089ffc18c5aa5f3c3a3cc8d717d66d29be689b81b7d8edb");

	await db.truncate();
	db.unload();
});
