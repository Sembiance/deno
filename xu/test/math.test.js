import "../math.js";
import {assert, assertEquals, assertStrictEquals, assertThrows} from "std";

Deno.test("clamp", () =>
{
	assertStrictEquals(47, Math.clamp(47, 1, 100));
	assertStrictEquals(47, Math.clamp(212, 1, 47));
	assertStrictEquals(47, Math.clamp(-382, 47, 100));
});

Deno.test("degreesToRadians", () =>
{
	const a = 45;
	const r = 0.785_398_163_397_448_3;
	assertStrictEquals(r, Math.degreesToRadians(a));
});

Deno.test("radiansToDegrees", () =>
{
	const a = 0.785_398_163_397_448_3;
	const r = 45;
	assertStrictEquals(r, Math.radiansToDegrees(a));
});

Deno.test("randomInt", () =>
{
	assertThrows(() => Math.randomInt(1, 7, {exclude : 2}));
	assertThrows(() => Math.randomInt(1, 7, {exclude : [1, 2, 3, 4, 5, 6, 7]}));

	for(let i=0;i<1000;i++)
	{
		const num = Math.randomInt(1, 7);
		assertStrictEquals(num<=7, true);
		assertStrictEquals(num>=1, true);
	}

	for(let i=0;i<1000;i++)
	{
		const num = Math.randomInt(1, 7, {exclude : [3, 5]});
		assertStrictEquals(num<=7, true);
		assertStrictEquals(num>=1, true);
		assertStrictEquals(num!==3, true);
		assertStrictEquals(num!==5, true);
	}
});

Deno.test("rotatedDimensions", () =>
{
	const r = [205, 217];
	assertEquals(r, Math.rotatedDimensions(40, 100, 200));
});

Deno.test("rotatePointInBox", () =>
{
	const r = [416.685_842_870_420_86, 248.086_570_489_100_64];
	assertEquals(r, Math.rotatePointInBox(15, 20, 120, 300, 500));
});

Deno.test("trueRandom", () =>
{
	const a = Math.trueRandom();
	assert(a>=0);
	assert(a<=1);
});
