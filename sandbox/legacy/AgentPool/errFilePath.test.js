Deno.test("errFilePath", async () =>
{
	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0})).shuffle();
	const errFilePath = await fileUtil.genTempPath(undefined, "AgentPoolTest-errFilePath");
	const pool = new AgentPool(path.join(import.meta.dirname, "error.agent.js"), {errFilePath});
	await pool.init();
	await pool.start({qty : 3});
	pool.process(vals);
	assert(await xu.waitUntil(() => pool.empty(), {timeout : xu.SECOND*30}));
	await pool.stop({keepCWD : true});

	const errFileContents = (await fileUtil.readTextFile(errFilePath)).split("\n\n").filter(Boolean);
	assertStrictEquals(errFileContents.length, vals.length);
	for(const val of vals)
	{
		const logLine = `msg: ${JSON.stringify(val)}\nerror: error for id ${val.id}`;
		assert(errFileContents.includes(logLine));
		errFileContents.removeOnce(logLine);
	}
	assertStrictEquals(errFileContents.length, 0);

	await fileUtil.unlink(pool.cwd, {recursive : true});
	await fileUtil.unlink(errFilePath);
});
