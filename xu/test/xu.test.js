import {assertEquals, assertNotStrictEquals, assertStrictEquals, assertThrows} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import { xu } from "../xu.js";
import { delay } from "https://deno.land/std@0.111.0/async/mod.ts";

Deno.test("clone", () =>
{
	const doubleSub = {num : 47};
	const sub = {red : "apple", doubleSub};
	const a = {abc : 123, hello : "world", kitty : true, sub};
	const r = {abc : 123, hello : "world", kitty : true, sub};
	const r2 = {abc : 123, hello : "world", sub};
	const b = [1, 3, 5, 7, "hello", sub];
	assertStrictEquals(Object.equals(r, xu.clone(a)), true);
	assertEquals(xu.clone(a).sub, sub);
	assertNotStrictEquals(xu.clone(a).sub, sub);
	assertStrictEquals(xu.clone(a, {shallow : true}).sub, sub);
	assertStrictEquals(Object.equals(r2, xu.clone(a, {skipKeys : ["kitty"]})), true);
	assertStrictEquals(xu.clone(a, {shallow : true}).sub.doubleSub, doubleSub);
	assertEquals(xu.clone(a).sub.doubleSub, doubleSub);
	assertStrictEquals(xu.clone(b, {shallow : true}).at(-1), sub);
	assertEquals(xu.clone(b, {shallow : false}).at(-1), sub);
});

Deno.test("freeze", () =>
{
	const a = {abc : 123, sub : {num : 47}};
	a.hello = "world";
	assertStrictEquals(a.hello, "world");
	Object.freeze(a);
	assertThrows(() => { a.goodbye = "world"; });
	assertThrows(() => { delete a.hello; });
	assertThrows(() => { a.hello = "goodbye"; });
});

Deno.test("parseJSON", () =>
{
	let a = '{"abc" : 123, "xyz" : [4, 7]}';
	const r = {abc : 123, xyz : [4, 7]};
	assertEquals(r, xu.parseJSON(a, {}));

	a = '{"abc" : 123, notQuotedInvalid : [4, 7]}';
	assertStrictEquals(xu.parseJSON(a, "invalid"), "invalid");
});

Deno.test("trim", () =>
{
	const r = xu.trim`
	This is just
		a test of the xu trimming	`;
	assertStrictEquals(r, "This is just\na test of the xu trimming");
});

Deno.test("waitUntil", async () =>
{
	let test = null;
	let counter = 0;
	setTimeout(() => { test = 123; }, xu.SECOND*2);
	const errorTimeout = setTimeout(() => { throw new Error("Should not see"); }, xu.SECOND*3);	// eslint-disable-line sembiance/shorter-arrow-funs
	await xu.waitUntil(async () =>
	{
		await delay(500);
		counter++;
		return test===123;
	});
	clearTimeout(errorTimeout);
	assertStrictEquals(counter, 4);
});
