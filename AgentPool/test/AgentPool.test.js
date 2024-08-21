import {xu} from "xu";
import {XLog} from "xlog";
import {assert, assertEquals, assertStrictEquals, delay, path} from "std";
import {fileUtil} from "xutil";
import {AgentPool} from "AgentPool";

Deno.test("startStop", async () =>
{
	const debugLog = [];
	const xlog = new XLog("info", {logger : v => debugLog.push(v)});

	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"), {xlog});
	await pool.init();
	await pool.start({qty : 3});
	assertStrictEquals(pool.agents.length, 3);
	assertStrictEquals(pool.queue.length, 0);
	await delay(xu.SECOND);
	await pool.stop();
	assertStrictEquals(debugLog.length, 13);
	assert(!(await fileUtil.exists(pool.cwd)));
});

Deno.test("status", async () =>
{
	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"));
	await pool.init();
	await pool.start({qty : 3});
	const poolStatus = pool.status();
	assertStrictEquals(pool.cwd, poolStatus.cwd);
	assertStrictEquals(pool.agents.length, poolStatus.agents.length);
	await pool.stop();
});

Deno.test("stdoutStderr", async () =>
{
	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));
	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"));
	await pool.init();
	await pool.start({qty : 3});
	const poolStatus = pool.status();
	pool.process(vals.slice(0, vals.length/2));
	await delay(500);
	await pool.broadcast({broadcast : true, msg : "test broadcast"});
	await pool.stop({keepCWD : true});

	for(const agent of poolStatus.agents)
	{
		assertStrictEquals(await fileUtil.readTextFile(agent.outFilePath), `stdout from agent\ngot broadcast message:  { broadcast: true, msg: "test broadcast" }\n`);
		assertStrictEquals(await fileUtil.readTextFile(agent.errFilePath), `stderr from agent\n`);
	}
	await fileUtil.unlink(pool.cwd, {recursive : true});
});

Deno.test("processSimple", async () =>
{
	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));

	const results = [];
	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"), {onSuccess : r => results.push(r)});
	await pool.init();
	await pool.start({qty : 3});
	pool.process(vals.slice(0, vals.length/2));
	await delay(500);
	pool.process(vals.slice(vals.length/2));
	assert(await xu.waitUntil(() => results.length===vals.length, {timeout : xu.SECOND*30}));
	await pool.stop();

	for(const result of results)
	{
		const val = vals.find(({id}) => id===result.id);
		assertStrictEquals(result.id, val.id);
		assertStrictEquals(result.bool, result.id%5!==0);
		assertStrictEquals(result.str, val.str.reverse());
		assertEquals(result.nums, val.nums.map(v => v*2));
	}
});

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

Deno.test("processDurations", async () =>
{
	const durations = [];
	const vals = [].pushSequence(1, 15000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));

	const results = [];
	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"), {onSuccess : (r, {duration}) => { results.push(r); durations.push(duration); }});
	await pool.init();
	await pool.start({qty : 1});
	const startedAt = performance.now();
	pool.process(vals);
	assert(await xu.waitUntil(() => results.length===vals.length, {timeout : xu.SECOND*30}));
	const totalDuration = performance.now()-startedAt;
	await pool.stop();

	assert(Math.abs(totalDuration-durations.sum())<xu.SECOND);
});

Deno.test("memoryLeak", async () =>
{
	let successCount = 0;
	const perBatch = 4000;
	const batches = [];
	for(let i=0;i<40;i++)
		batches.push([].pushSequence(0, perBatch-1).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0})));

	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"), {onSuccess : () => successCount++});
	await pool.init();
	await pool.start({qty : 5});

	pool.process(batches[0]);
	assert(await xu.waitUntil(() => successCount===perBatch, {timeout : xu.SECOND*20}));
	const memories = [];
	memories.push(Deno.memoryUsage().heapUsed);

	for(let i=1;i<batches.length;i++)
	{
		pool.process(batches[i]);
		assert(await xu.waitUntil(() => successCount===perBatch*(i+1), {timeout : xu.SECOND*20}));	// eslint-disable-line no-loop-func
		memories.push(Deno.memoryUsage().heapUsed);
	}

	const memStats = {mean : memories.average(), stdDev : memories.standardDeviation(), max : memories.max(), min : memories.min(), median : memories.median(), variance : memories.variance()};
	memStats.isIncreasing = memories.every((val, index) => index===0 || val>=memories[index-1]);

	await pool.stop();

	// Theses tests were created with the help of claude AI. Dunno if they're good or not

	// Test 1: Check if maximum memory usage is within 3 standard deviations of the mean
	assert(memStats.max <= memStats.mean + (3 * memStats.stdDev), `Max memory usage (${memStats.max}) is more than 3 standard deviations above the mean (${memStats.mean + (3 * memStats.stdDev)})`);

	// Test 2: Ensure the memory usage isn't consistently increasing
	assert(!memStats.isIncreasing, "Memory usage is consistently increasing, potential memory leak");

	// Test 3: Check if median is reasonably close to mean (within 1 standard deviation)
	assert(Math.abs(memStats.median - memStats.mean) <= memStats.stdDev, `Median (${memStats.median}) is more than 1 standard deviation away from mean (${memStats.mean})`);

	// Test 4: Ensure the minimum memory usage isn't too low (e.g., less than 10% of max)
	assert(memStats.min >= 0.1 * memStats.max, `Minimum memory usage (${memStats.min}) is less than 10% of maximum (${memStats.max})`);

	// Test 5: Check if memory usage variance is within acceptable range
	assert(memStats.variance < ((memStats.stdDev * 2) ** 2), `Memory usage variance (${memStats.variance}) is too high`);

	// Test 6: Check for periodic memory drops (indicating garbage collection)
	assert(memories.some((mem, i) => i > 0 && mem < memories[i - 1]), "No periodic memory drops observed, possible GC issues");
});

Deno.test("processPriority", async () =>
{
	const results = [];
	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"), {onSuccess : r => results.push(r)});
	await pool.init();
	await pool.start({qty : 2});
	pool.process({id : 1, nums : [1, 2, 3], str : xu.randStr(), bool : false});
	pool.process({id : 2, nums : [1, 2, 3], str : xu.randStr(), bool : false});
	pool.process({id : 3, nums : [1, 2, 3], str : xu.randStr(), bool : false, delay : xu.SECOND*3});
	pool.process({id : 4, nums : [1, 2, 3], str : xu.randStr(), bool : false, delay : xu.SECOND*3});
	pool.process({id : 5, nums : [1, 2, 3], str : xu.randStr(), bool : false, delay : xu.SECOND*3});
	pool.process({id : 6, nums : [1, 2, 3], str : xu.randStr(), bool : false, delay : xu.SECOND*3});
	await delay(xu.SECOND);
	pool.processPriority({id : 7, nums : [1, 2, 3], str : xu.randStr(), bool : false, delay : 500});
	pool.processPriority({id : 8, nums : [1, 2, 3], str : xu.randStr(), bool : false, delay : 500});
	assert(await xu.waitUntil(() => results.length===8, {timeout : xu.SECOND*15}));
	await pool.stop();

	assert([1, 2].includes(results[0].id));
	assert([1, 2].includes(results[1].id));
	assert([3, 4].includes(results[2].id));
	assert([3, 4].includes(results[3].id));

	assert([7, 8].includes(results[4].id));
	assert([7, 8].includes(results[5].id));

	assert([5, 6].includes(results[6].id));
	assert([5, 6].includes(results[7].id));
});

Deno.test("empty", async () =>
{
	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));

	const results = [];
	const pool = new AgentPool(path.join(import.meta.dirname, "simple.agent.js"), {onSuccess : r => results.push(r)});
	await pool.init();
	await pool.start({qty : 3});
	pool.process(vals.slice(0, vals.length/2));
	assert(await xu.waitUntil(() => pool.empty(), {timeout : xu.SECOND*10}));
	assertStrictEquals(pool.empty(), true);
	assertStrictEquals(pool.queue.length, 0);

	await delay(500);
	pool.process(vals.slice(vals.length/2));
	assert(pool.queue.length>0);
	assert(await xu.waitUntil(() => pool.empty(), {timeout : xu.SECOND*10}));
	assertStrictEquals(results.length, vals.length);
	assertStrictEquals(pool.empty(), true);
	assertStrictEquals(pool.queue.length, 0);
	await pool.stop();

	for(const result of results)
	{
		const val = vals.find(({id}) => id===result.id);
		assertStrictEquals(result.id, val.id);
		assertStrictEquals(result.bool, result.id%5!==0);
		assertStrictEquals(result.str, val.str.reverse());
		assertEquals(result.nums, val.nums.map(v => v*2));
	}
});

Deno.test("crashRecover", async () =>
{
	const debugLog = [];
	const xlog = new XLog("warn", {logger : v => debugLog.push(v)});

	let pool = null;
	const successes = [];
	const onSuccess = r =>
	{
		assertStrictEquals(r.recovered, true);
		assert(Object.hasOwn(r, "v"));
		successes.push(r);
	};

	const fails = [];
	const onFail = ({msg, reason}) =>
	{
		assert(["crashed", "fetch failed"].includes(reason));
		assertStrictEquals(msg.isMsg, true);
		assert(Object.hasOwn(msg, "v"));
		pool.processPriority(msg);
		fails.push(msg);
	};

	pool = new AgentPool(path.join(import.meta.dirname, "crashed.agent.js"), {onSuccess, onFail, xlog});
	await pool.init();
	await pool.start({qty : 2});
	pool.process([].pushSequence(1, 10).map(v => ({isMsg : true, v})));
	assert(await xu.waitUntil(() => successes.length===10, {timeout : xu.SECOND*20}));
	assert(fails.length>0);
	assert(fails.some(o => o.v===1));
	assertStrictEquals(debugLog.length, 2);	// a warning for each crash

	await pool.stop({keepCWD : true});
});

Deno.test("exception", async () =>
{
	const xlog = new XLog("warn");

	let pool = null;
	const successes = [];
	const onSuccess = r =>
	{
		assertStrictEquals(r.good, true);
		assert(Object.hasOwn(r, "v"));
		successes.push(r);
	};

	const fails = [];
	const onFail = ({msg, reason, error}) =>
	{
		assertStrictEquals(reason, "exception");
		assert(error.includes("EXPECTED EXCEPTION DUE TO #7"));
		assert(error.includes("exception.agent.js:10:9"));
		assertStrictEquals(msg.isMsg, true);
		assertStrictEquals(msg.v, 7);
		fails.push(msg);
	};

	pool = new AgentPool(path.join(import.meta.dirname, "exception.agent.js"), {onSuccess, onFail, xlog});
	await pool.init();
	await pool.start({qty : 2});
	pool.process([].pushSequence(1, 10).map(v => ({isMsg : true, v})));
	assert(await xu.waitUntil(() => successes.length===9, {timeout : xu.SECOND*20}));
	assert(fails.length===1);
	assert(fails[0].v===7);

	await pool.stop({keepCWD : true});
});