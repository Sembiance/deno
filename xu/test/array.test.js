import {assertEquals, assertNotEquals, assertStrictEquals} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import {} from "../object.js";

Deno.test("average", () =>
{
	const a = [1, 2, 4, 4, 5];
	const r = 3.2;
	assertStrictEquals(r, a.average());
});

Deno.test("chunk", () =>
{
	let a = [1, 2, 3, 4, 5, 6, 7];
	let r = [[1, 2], [3, 4], [5, 6], [7]];
	assertEquals(r, a.chunk(2));
	assertNotEquals(r, a);

	a = [1, 2, 3, 4, 5, 6, 7];
	r = [[1, 5], [2, 6], [3, 7], [4]];
	assertEquals(r, a.chunk(2, {vertical : true}));
	assertNotEquals(!r, a);
});

Deno.test("clear", () =>
{
	const a = [1, 2, 3, 4, 5];
	const r = [];
	assertEquals(r, a.clear());
	assertEquals(r, a);
});

Deno.test("clone", () =>
{
	const a = [1, 2, 3, 4, 5];
	const r = [1, 2, 3, 4, 5];
	const r2 = [1, 2, 3, 4, 5, 6];
	const sub = {val : 47};
	const b = [1, 2, 3, sub];
	assertEquals(a, a.clone());
	assertEquals(r, a.clone());
	a.push(6);
	assertEquals(a, r2);
	assertEquals(sub, b.clone().at(-1));
	assertStrictEquals(sub, b.clone({shallow : true}).at(-1));
});

Deno.test("filterInPlace", () =>
{
	const a = [1, 2, 3, 4, 5];
	const b = [1, 2, 3, 4, 5];
	const r = [3, 4, 5];
	assertEquals(a, b);
	assertEquals(a.filter(v => v>=3), b.filterInPlace(v => v>=3));
	assertEquals(b, r);
});

Deno.test("force", () =>
{
	const o = [1, 2, 3];
	const r = [47];
	assertEquals(o, Array.force(o));
	assertEquals(r, Array.force(47));
});

Deno.test("includesAll", () =>
{
	const a = [1, 2, 3, 4, 5];
	const b = [2, 4];
	const c = [3];
	const x = [1, 2, 3, 4, 5, 7];
	assertStrictEquals(a.includesAll(b), true);
	assertStrictEquals(a.includesAll(c), true);
	assertStrictEquals(a.includesAll(x), false);
});

Deno.test("includesAny", () =>
{
	const a = [1, 2, 3, 4, 5];
	const b = [2, 4];
	const c = [3];
	const x = [7, 8, 9];
	assertStrictEquals(a.includesAny(b), true);
	assertStrictEquals(a.includesAny(c), true);
	assertStrictEquals(a.includesAny(x), false);
});

Deno.test("mapInPlace", () =>
{
	const a = [1, 2, 3, 4, 5];
	const b = [1, 2, 3, 4, 5];
	const r = [2, 4, 6, 8, 10];
	assertEquals(a.map(v => v*2), b.mapInPlace(v => v*2));
	assertEquals(a.map(v => v*2), b);
	assertEquals(b, r);
});

Deno.test("max", () =>
{
	const a = [4, 2, 5, 3, 1];
	const r = 5;
	assertStrictEquals(r, a.max());
});

Deno.test("median", () =>
{
	const a = [1, 3, 4, 4, 5];
	const r = 4;
	assertStrictEquals(r, a.median());
});

Deno.test("min", () =>
{
	let a = [3, 4, 1, 2, 5];
	let r = 1;
	assertStrictEquals(r, a.min());
	a = [0.456, 0.197];
	r = 0.197;
	assertStrictEquals(r, a.min());
});

Deno.test("pickRandom", () =>
{
	let a = [1];
	assertEquals(a, a.pickRandom(1));
	assertEquals([1], a.pickRandom(1, {exclude : [7]}));
	a = [].pushSequence(0, 1000);
	let r = [].pushSequence(0, 1000);
	assertNotEquals(r, a.pickRandom(1000));	// In theory this could shuffle all 10,000 elements the same, but highly unlikely.
	assertEquals(r, a);
	a = [1, 2, 3, 4, 5];
	assertStrictEquals(typeof a.pickRandom()[0], "number");
	assertStrictEquals(a.includes(a.pickRandom()[0]), true);
	assertStrictEquals(typeof a.pickRandom(1)[0], "number");
	assertStrictEquals(a.includes(a.pickRandom(1)[0]), true);
	assertStrictEquals(3, a.pickRandom(3).length);
	assertStrictEquals(a.includesAll(a.pickRandom(3)), true);
	for(let i=0;i<1000;i++)
	{
		r = a.pickRandom(2, {exclude : [1, 3, 5]});
		assertStrictEquals(r.includes(2), true);
	}
	assertStrictEquals(r.includes(4), true);
	assertStrictEquals(2, r.length);
	for(let i=0;i<10000;i++)
	{
		assertStrictEquals(a.pickRandom(4, {exclude : [3]}).includes(3), false);
		assertStrictEquals(a.pickRandom(3, {exclude : [1, 5]}).includesAny([1, 5]), false);
	}
});

Deno.test("pushSequence", () =>
{
	let a = [1, 2, 3];
	let r = [1, 2, 3, 4, 5, 6];
	assertEquals(r, a.pushSequence(4, 6));
	assertEquals(r, a);
	a = [];
	r = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	assertEquals(r, a.pushSequence(0, 9));
	assertEquals(r, a);
	a = [1, 2, 3];
	r = [1, 2, 3, 2, 1, 0];
	assertEquals(r, a.pushSequence(2, 0));
	assertEquals(r, a);
	a = [];
	r = [21, 20, 19, 18, 17, 16, 15, 14];
	assertEquals(r, a.pushSequence(21, 14));
	assertEquals(r, a);
});

Deno.test("pushUnique", () =>
{
	const a = [1, 2, 3, 4, 5];
	const r = [1, 2, 3, 4, 5, 7, 9];
	assertEquals(r, a.pushUnique(1, 7, 9));
	assertEquals(r, a);
});

Deno.test("removeAll", () =>
{
	let a = [1, 2, 3, 3, 3, 4, 5];
	const b = Array.from(a);
	let r = [1, 2, 4, 5];
	assertEquals(r, a.removeAll(3));
	assertNotEquals(a, b);
	assertEquals(r, a);
	a = [3, 1, 3, 3, 2, 4, 5];
	r = [1, 2, 5];
	[3, 4].forEach(v => a.removeAll(v));
	assertEquals(r, a);
	a = [1, 2, 3, 3, 3, 4, 5];
	assertEquals(a, a.removeAll(7));
});

Deno.test("removeOnce", () =>
{
	let a = [1, 2, 3, 3, 3, 4, 5];
	const b = Array.from(a);
	const c = 7;
	const r = [1, 2, 3, 3, 4, 5];
	assertEquals(r, a.removeOnce(3));
	assertNotEquals(a, b);
	a = [1, 2, 3, 3, 3, 4, 5];
	assertEquals(a, a.removeOnce(c));
});

Deno.test("shuffle", () =>
{
	const a = [].pushSequence(0, 10000);
	const r = [].pushSequence(0, 10000);
	assertEquals(r, a);
	assertNotEquals(r, a.shuffle());	// In theory this could shuffle all 10,000 elements the same, but highly unlikely.
	assertNotEquals(r, a);
	assertStrictEquals(a.length, a.shuffle().length);
});

Deno.test("sortMulti", () =>
{
	let a = [{name : "d", value : 999}, {name : "a", value : 7}, {name : "b", value : 10}, {name : "a", value : 9}];
	let r = [{name : "a", value : 9}, {name : "a", value : 7}, {name : "b", value : 10}, {name : "d", value : 999}];
	assertEquals(r, a.sortMulti([v => v.name, v => v.value], [false, true]));
	assertEquals(r, a);
	a = [{name : "d", value : 999}, {name : "a", value : 7}, {name : "b", value : 10}, {name : "a", value : 9}];
	r = [{name : "d", value : 999}, {name : "b", value : 10}, {name : "a", value : 9}, {name : "a", value : 7}];
	assertEquals(r, a.sortMulti([v => v.name, v => v.value], true));
	assertEquals(r, a);
});

Deno.test("standardDeviation", () =>
{
	const a = [1, 2, 3, 4, 5];
	let r = 1.4142135623730951;
	assertStrictEquals(r, a.standardDeviation());
	r = 1.5811388300841898;
	assertStrictEquals(r, a.standardDeviation(true));
});

Deno.test("subtractAll", () =>
{
	let a = [1, 2, 3, 4, 5];
	let b = [2, 4];
	let r = [1, 3, 5];
	const r2 = [1, 2, 3, 4, 5];
	assertEquals(r, a.subtractAll(b));
	assertEquals(r2, a);
	a = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5];
	b = [1, 3, 4];
	r = [2, 2, 5, 5, 5, 5, 5];
	assertEquals(r, a.subtractAll(b));
});

Deno.test("subtractOnce", () =>
{
	let a = [1, 2, 3, 4, 5];
	let b = [2, 4];
	let r = [1, 3, 5];
	const r2 = [1, 2, 3, 4, 5];
	assertEquals(r, a.subtractOnce(b));
	assertEquals(r2, a);
	a = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5];
	b = [1, 3, 4];
	r = [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5];
	assertEquals(r, a.subtractOnce(b));
});

Deno.test("sum", () =>
{
	const a = [1, 2, 3, 4, 5];
	const r = 15;
	assertStrictEquals(r, a.sum());
});

Deno.test("unique", () =>
{
	const a = [1, 2, 2, 3, 3, 3, 4, 5, 5];
	const b = [1, 2, 2, 3, 3, 3, 4, 5, 5];
	const r = [1, 2, 3, 4, 5];
	assertEquals(r, a.unique());
	assertEquals(a, b);
});

Deno.test("variance", () =>
{
	const a = [1, 2, 3, 4, 5];
	let r = 2;
	assertStrictEquals(r, a.variance());
	r = 2.5;
	assertStrictEquals(r, a.variance(true));
});
