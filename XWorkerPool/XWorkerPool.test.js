import {xu} from "xu";
import {XWorkerPool} from "./XWorkerPool.js";
import {assert, assertEquals, assertStrictEquals, delay, path} from "std";
import {XLog} from "xlog";
import {fileUtil} from "xutil";

Deno.test("abortedWorker", async () =>
{
	const xlog = new XLog("info");
	let allDone = false;
	let pool = null;

	async function workercb(workerid, r)
	{
		if(r.err)
			xlog.debug`workercb (testid ${r.testid}): pool queue ${pool.queue.length} available ${pool.available.length} workers ${pool.workers.length} busy ${Object.keys(pool.busy).join(" ")} ERROR: ${r.err}`;
		else
			xlog.debug`workercb (testid ${r.testid}): pool queue ${pool.queue.length} available ${pool.available.length} workers ${pool.workers.length} busy ${Object.keys(pool.busy).join(" ")} NORMAL`;

		await delay(50);
	}

	async function emptycb()
	{
		xlog.debug`emptycb: pool queue ${pool.queue.length} available ${pool.available.length} workers ${pool.workers.length} busy ${Object.keys(pool.busy).join(" ")}`;

		await delay(50);

		xlog.debug`Stopping workers...`;
		await pool.stop();
		allDone = true;
	}
	pool = new XWorkerPool({workercb, emptycb, xlog});
	await pool.start(path.join(xu.dirname(import.meta), "abortedWorker.js"), {size : 10});
	xlog.debug`pool started, adding to queue...`;
	pool.process([].pushSequence(1, 3).map(v => ({testid : v})));
	pool.process([].pushSequence(4, 15).map(v => ({testid : v})));
	await delay(xu.SECOND*4);
	pool.process([].pushSequence(16, 30).map(v => ({testid : v})));

	xlog.debug`waiting for allDone...`;
	await xu.waitUntil(() => allDone);
	await pool.stop();
	xlog.debug`allDone!`;
});

Deno.test("processSimple", async () =>
{
	async function f()
	{
		console.log("stdout from worker");
		console.error("stderr from worker");
		await xwork.recv(async msg =>	// eslint-disable-line no-undef
		{
			if(msg.broadcast)
				return console.log("got broadcast message: ", msg);

			await xwork.send({id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool});	// eslint-disable-line no-undef
		});
	}

	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));

	const debugLog = [];
	const xlog = new XLog("info", {logger : v => debugLog.push(v)});

	const results = [];
	let emptyCount = 0;
	const pool = new XWorkerPool({xlog, workercb : (workerid, r) => results.push(r), emptycb : () => emptyCount++});
	await pool.start(f, {imports : {std : ["delay"]}});
	pool.process(vals.slice(0, vals.length/2));
	assertStrictEquals(pool.empty, false);
	await delay(100);
	await pool.broadcast({broadcast : true, msg : "test broadcast"});
	assert(await xu.waitUntil(() => emptyCount===1, {timeout : xu.SECOND*5}));
	assertStrictEquals(pool.empty, true);
	pool.process(vals.slice(vals.length/2));
	assertStrictEquals(pool.empty, false);
	assert(await xu.waitUntil(() => results.length===vals.length, {timeout : xu.SECOND*10}));
	assertStrictEquals(emptyCount, 2);
	assertStrictEquals(pool.empty, true);
	await pool.stop();

	for(const result of results)
	{
		const val = vals.find(({id}) => id===result.id);
		assertStrictEquals(result.id, val.id);
		assertStrictEquals(result.bool, result.id%5!==0);
		assertStrictEquals(result.str, val.str.reverse());
		assertEquals(result.nums, val.nums.map(v => v*2));
	}

	assertStrictEquals(debugLog.length, navigator.hardwareConcurrency*3);
	assert(debugLog[0].includes("stdout from worker"));
	assert(debugLog.at(-1).includes("test broadcast"));
});

Deno.test("bigPool", async () =>
{
	const NUM_VALS = 100_000;
	const vals = [].pushSequence(1, NUM_VALS).map((v, id) => ({id}));

	let resultCount = 0;
	let emptyCount = false;
	const pool = new XWorkerPool({workercb : () => resultCount++, emptycb : () => { emptyCount = true; }});
	await pool.start(async () => await xwork.recv(async msg => await xwork.send({id : msg.id})), {size : 100});	// eslint-disable-line no-undef
	pool.process(vals);
	assert(await xu.waitUntil(() => resultCount===NUM_VALS && emptyCount===true, {interval : xu.SECOND, timeout : xu.SECOND*20}));
	await pool.stop();
});

Deno.test("quickProcess", async () =>
{
	const NUM_VALS = 5000;
	const vals = [].pushSequence(1, NUM_VALS).map((v, id) => ({id}));

	const outVals = await XWorkerPool.quickProcess(vals, async () => await xwork.recv(async msg => await xwork.send({id : msg.id*2})), {size : 100});	// eslint-disable-line no-undef
	assertStrictEquals(outVals.length, NUM_VALS);
	for(const {id} of outVals)
		vals.filterInPlace(v => v.id!==id/2);
	assertStrictEquals(vals.length, 0);
});

Deno.test("processCrash", async () =>
{
	async function f()
	{
		console.log("stdout from worker");
		console.error("stderr from worker");
		await xwork.recv(async msg =>	// eslint-disable-line no-undef
		{
			if(msg.broadcast)
				return console.log("got broadcast message: ", msg);
			
			if(msg.causeCrash)
				return unknownVariable/0;	// eslint-disable-line no-undef

			await xwork.send({id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool});	// eslint-disable-line no-undef
		});
	}

	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));

	const results = [];
	let emptyCount = 0;
	let crashCount = 0;
	const pool = new XWorkerPool({xlog : new XLog("none"), workercb : (workerid, r) => results.push(r), emptycb : () => emptyCount++, crashcb : async (workerid, status) => { await delay(5); crashCount++; assertStrictEquals(status.success, false); assertStrictEquals(status.code, 1); }});
	await pool.start(f, {imports : {std : ["delay"]}});
	pool.process(vals.slice(0, vals.length/2));
	assertStrictEquals(pool.empty, false);
	await delay(100);
	await pool.broadcast({broadcast : true, msg : "test broadcast"});
	assert(await xu.waitUntil(() => emptyCount===1, {timeout : xu.SECOND*5}));
	assertStrictEquals(pool.empty, true);
	pool.process(vals.slice(vals.length/2));
	assertStrictEquals(pool.empty, false);
	assert(await xu.waitUntil(() => results.length===vals.length, {timeout : xu.SECOND*10}));
	assertStrictEquals(emptyCount, 2);
	assertStrictEquals(pool.empty, true);

	await pool.process(Array(10).fill({causeCrash : true}));
	await xu.waitUntil(() => crashCount===10, {timeout : xu.SECOND*10});
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

Deno.test("processCrashRecover", async () =>
{
	async function f()
	{
		await xwork.recv(async msg =>	// eslint-disable-line no-undef
		{
			if(msg.causeCrash)
				Deno.exit(47);

			await xwork.send({id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool});	// eslint-disable-line no-undef
		});
	}

	const results = [];
	let crashCount = 0;
	async function crashcb(workerid, status, value)
	{
		await delay(5);
		crashCount++;
		assertStrictEquals(status.success, false);
		assertStrictEquals(status.code, 47);
		assertStrictEquals(value.id, 250);
		assertStrictEquals(results.length, 250);
		assertStrictEquals(crashCount, 1);
	}

	let emptyCount = 0;
	function emptycb()
	{
		emptyCount++;
	}

	const vals = [].pushSequence(1, 500).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));
	vals[250].causeCrash = true;

	const pool = new XWorkerPool({workercb : (workerid, r) => results.push(r), emptycb, crashcb, crashRecover : true});
	await pool.start(f, {size : 1, imports : {std : ["delay"]}});
	pool.process(vals);

	assert(await xu.waitUntil(() => results.length===vals.length-1, {timeout : xu.SECOND*20}));

	await pool.stop();
	await fileUtil.unlink(path.join(xu.dirname(import.meta), "core"));

	assertStrictEquals(emptyCount, 1);
	assertStrictEquals(crashCount, 1);
});
