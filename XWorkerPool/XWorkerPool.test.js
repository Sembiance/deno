import {xu} from "xu";
import {XWorkerPool} from "./XWorkerPool.js";
import {assertEquals, assertStrictEquals, delay} from "std";

Deno.test("process", async () =>
{
	async function f(workerid)
	{
		await xwork.recv(async msg => await xwork.send({id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool}));	// eslint-disable-line no-undef
		console.log(`worker ${workerid} no longer working`);
	}

	const vals = [].pushSequence(1, 1000).map((v, id) => ({id, nums : [v, v*2, v*3], str : xu.randStr(), bool : id%5===0}));

	const results = [];
	const pool = new XWorkerPool({donecb : (workerid, r) => results.push(r)});
	await pool.start(f, {imports : {std : ["delay"]}});
	pool.process(vals.slice(0, vals.length/2));
	await delay(100);
	pool.process(vals.slice(vals.length/2));
	await xu.waitUntil(() => results.length===vals.length, {timeout : xu.SECOND*30});
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
