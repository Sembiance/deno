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
