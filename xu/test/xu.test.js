import {xu} from "../xu.js";
import {base64Encode, delay, assertEquals, assertNotStrictEquals, assertStrictEquals, assertThrows} from "std";

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

Deno.test("dirname", () =>	// eslint-disable-line sembiance/shorter-arrow-funs
{
	assertStrictEquals(xu.dirname(import.meta), "/mnt/compendium/DevLab/deno/xu/test");
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

Deno.test("inspect", () =>
{
	let o = {abc : () => {}, xyz : false, numbers : [23, 213, 125, 123_523_523, 23423], moreProps : {subObj : "keys", andMore : "live\nlong\nand\nprosper"}};
	assertStrictEquals(base64Encode(xu.inspect(o)), "ewogIGFiYzogG1szNm1bRnVuY3Rpb246IGFiY10bWzM5bSwKICB4eXo6IBtbMzNtZmFsc2UbWzM5bSwKICBudW1iZXJzOiBbIBtbMzNtMjMbWzM5bSwgG1szM20yMTMbWzM5bSwgG1szM20xMjUbWzM5bSwgG1szM20xMjM1MjM1MjMbWzM5bSwgG1szM20yMzQyMxtbMzltIF0sCiAgbW9yZVByb3BzOiB7IHN1Yk9iajogG1szMm0ia2V5cyIbWzM5bSwgYW5kTW9yZTogG1szMm0ibGl2ZVxubG9uZ1xuYW5kXG5wcm9zcGVyIhtbMzltIH0KfQ==");
	o = {abc : 123, longStr : "This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated"};
	assertStrictEquals(base64Encode(xu.inspect(o)), "ewogIGFiYzogG1szM20xMjMbWzM5bSwKICBsb25nU3RyOiAbWzMybSJUaGlzIGlzIGEgbG9uZyBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdHJ1bmNhdGVkIFRoaXMgaXMgYSBsb25nIHN0cmluZyB0aGF0IHNob3VsZCBiZSB0cnVuY2F0ZWQgVGhpcyBpLi4uIhtbMzltCn0=");
	assertStrictEquals(base64Encode(xu.inspect(o, {strAbbreviateSize : 5000})), "ewogIGFiYzogG1szM20xMjMbWzM5bSwKICBsb25nU3RyOiAbWzMybSJUaGlzIGlzIGEgbG9uZyBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdHJ1bmNhdGVkIFRoaXMgaXMgYSBsb25nIHN0cmluZyB0aGF0IHNob3VsZCBiZSB0cnVuY2F0ZWQgVGhpcyBpcyBhIGxvbmcgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIHRydW5jYXRlZCBUaGlzIGlzIGEgbG9uZyBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdHJ1bmNhdGVkIFRoaXMgaXMgYSBsb25nIHN0cmluZyB0aGF0IHNob3VsZCBiZSB0cnVuY2F0ZWQgVGhpcyBpcyBhIGxvbmcgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIHRydW5jYXRlZCIbWzM5bQp9");
});

Deno.test("parseJSON", () =>
{
	let a = '{"abc" : 123, "xyz" : [4, 7]}';
	const r = {abc : 123, xyz : [4, 7]};
	assertEquals(r, xu.parseJSON(a, {}));

	a = '{"abc" : 123, notQuotedInvalid : [4, 7]}';
	assertStrictEquals(xu.parseJSON(a, "invalid"), "invalid");
});

Deno.test("randStr", () =>
{
	const a = [].pushSequence(1, 20000).map(() => xu.randStr());
	assertStrictEquals(a.unique().length, 20000);
});

Deno.test("sizes", () =>
{
	assertStrictEquals(xu.KB, 1024);
	assertStrictEquals(xu.MB, 1024*1024);
	assertStrictEquals(xu.GB, 1024*1024*1024);
	assertStrictEquals(xu.TB, 1024*1024*1024*1024);
});

Deno.test("trim", () =>
{
	const r = xu.trim`
	This is just
		a test of the xu trimming	`;
	assertStrictEquals(r, "This is just\na test of the xu trimming");
});

Deno.test("tryFallback", () =>
{
	const returnsValue = () => 47;
	const throwsException = () => { throw new Error("should not see"); };	// eslint-disable-line sembiance/shorter-arrow-funs

	assertStrictEquals(xu.tryFallback(returnsValue, 999), 47);
	assertStrictEquals(xu.tryFallback(throwsException, 47), 47);
});

Deno.test("tryFallbackAsync", async () =>
{
	const returnsValue = () => 47;
	const throwsException = () => { throw new Error("should not see"); };	// eslint-disable-line sembiance/shorter-arrow-funs
	const asyncReturnsValue = async () => { await delay(50); return 47; };
	const asyncThrowsException = async () => { await delay(50); throw new Error("should not see"); };

	assertStrictEquals(await xu.tryFallbackAsync(returnsValue, 999), 47);
	assertStrictEquals(await xu.tryFallbackAsync(throwsException, 47), 47);
	assertStrictEquals(await xu.tryFallbackAsync(asyncReturnsValue, 999), 47);
	assertStrictEquals(await xu.tryFallbackAsync(asyncThrowsException, 47), 47);
});

Deno.test("waitUntil", async () =>
{
	// default conditions
	let test = null;
	let counter = 0;
	setTimeout(() => { test = 123; }, xu.SECOND*2);
	let errorTimeout = setTimeout(() => { throw new Error("Should not see"); }, xu.SECOND*3);	// eslint-disable-line sembiance/shorter-arrow-funs
	await xu.waitUntil(async () =>
	{
		await delay(500);
		counter++;
		return test===123;
	});
	clearTimeout(errorTimeout);
	assertStrictEquals(counter, 4);

	// 200ms interval
	test = null;
	counter = 0;
	setTimeout(() => { test = 123; }, xu.SECOND);
	errorTimeout = setTimeout(() => { throw new Error("Should not see"); }, xu.SECOND*2);	// eslint-disable-line sembiance/shorter-arrow-funs
	await xu.waitUntil(async () =>
	{
		await delay(1);
		counter++;
		return test===123;
	}, {interval : 200});
	clearTimeout(errorTimeout);
	assertStrictEquals(counter, 6);

	// 1 second timeout
	let beforeTime = performance.now();
	await xu.waitUntil(() => false, {timeout : xu.SECOND*2});
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);

	// non-async function
	test = null;
	beforeTime = performance.now();
	setTimeout(() => { test = true; }, xu.SECOND*2);
	await xu.waitUntil(() => !!test);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);
});

Deno.test("waitUntilStopEarly", async () =>
{
	const stopper = {};
	const startedAt = performance.now();
	setTimeout(() => { stopper.stop = true; }, xu.SECOND*2);
	await xu.waitUntil(() => false, {stopper});
	assertStrictEquals(Math.round((performance.now()-startedAt)/xu.SECOND), 2);
});

/////////////////////////////////////////////////////
// At bottom because these tests output to console //
/////////////////////////////////////////////////////
Deno.test("color", () =>
{
	console.log(`color test: ${xu.cf.fg.magenta("magenta")} and regular here`);
	const modifiers = ["bold", "underline", "blink", "reverse", "strike", "italic"];
	Object.keys(xu.c.fg).forEach(colorName => console.log(`${xu.c.reset + colorName.padStart(7)}: ${`${xu.c.fg[colorName]}foreground ${modifiers.map(v => xu.c[v] + xu.c.fg[colorName] + v + xu.c.reset).join(" ")}`} ${`${xu.c.reset + xu.c.bg[colorName]}background`}`));
});
