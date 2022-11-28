import {xu} from "xu";
import {XWorkerPool} from "./XWorkerPool.js";
import {assert, assertEquals, assertStrictEquals, delay} from "std";
import {XLog} from "xlog";

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
	const logger = v => debugLog.push(v);
	const xlog = new XLog("info", {logger});

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
	const pool = new XWorkerPool({xlog : new XLog("none"), workercb : (workerid, r) => results.push(r), emptycb : () => emptyCount++, crashcb : async (workerid, status) => { await delay(5); crashCount++; assertStrictEquals(status.success, false); assertStrictEquals(status.code, 1); }});	// eslint-disable-line max-len
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
