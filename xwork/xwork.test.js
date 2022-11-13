import {xu} from "xu";
import {xwork} from "./xwork.js";
import {assertEquals, assertStrictEquals, assert, delay} from "std";

Deno.test("inline", async () =>
{
	async function f(v=7)
	{
		await delay(300);
		return v*2;
	}
	let r = await xwork.run(f, undefined, {imports : {std : ["delay"]}});
	assertStrictEquals(r, 14);

	r = await xwork.map([1, 2, 3, 4, 5], f, {imports : {std : ["delay"]}});
	assertEquals(r, [2, 4, 6, 8, 10]);

	let total=0;
	r = await xwork.map([1, 2, 3, 4, 5], f, {cb : async (v, i) => { await delay(100); total+=v; assert(i<5); }, imports : {std : ["delay"]}});
	assertStrictEquals(total, 30);
	assertEquals(r, [2, 4, 6, 8, 10]);
});

Deno.test("anonInline", async () =>
{
	let r = await xwork.run(async v => { await delay(300); return v*3; }, [7], {imports : {std : ["delay"]}});
	assertStrictEquals(r, 21);

	let total=0;
	r = await xwork.map([1, 2, 3, 4, 5], async v => { await delay(300); return v*3; }, {cb : (v, i) => { total+=v; assert(i<5); }, imports : {std : ["delay"]}});
	assertStrictEquals(total, 45);
	assertEquals(r, [3, 6, 9, 12, 15]);
});

Deno.test("file", async () =>
{
	let r = await xwork.run("testWorker.js", 7);
	assertEquals(r, 35);

	r = await xwork.map([1, 2, 3, 4, 5], "testWorker.js");
	assertEquals(r, [5, 10, 15, 20, 25]);
});

Deno.test("timeout", async () =>
{
	async function f(v=7)
	{
		await delay(xu.SECOND*5);
		return v*2;
	}
	let start = performance.now();
	let r = await xwork.run(f, undefined, {imports : {std : ["delay"]}, timeout : xu.SECOND*2});
	assertStrictEquals(2, Math.round((performance.now()-start)/xu.SECOND));
	assertEquals(r, []);

	start = performance.now();
	r = await xwork.run(f, undefined, {imports : {std : ["delay"]}});
	assertStrictEquals(6, Math.ceil((performance.now()-start)/xu.SECOND));
	assertStrictEquals(r, 14);
});
