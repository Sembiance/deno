import {assertEquals, assertStrictEquals, assertThrows} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import {} from "../math.js";

Deno.test("degreesToRadians", () =>
{
	const a = 45;
	const r = 0.7853981633974483;
	assertStrictEquals(r, Math.degreesToRadians(a));
});

Deno.test("radiansToDegrees", () =>
{
	const a = 0.7853981633974483;
	const r = 45;
	assertStrictEquals(r, Math.radiansToDegrees(a));
});

Deno.test("randomInt", () =>
{
	assertThrows(() => Math.randomInt(1, 7, {exclude : 2}));

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
	const r = [416.68584287042086, 248.08657048910064];
	assertEquals(r, Math.rotatePointInBox(15, 20, 120, 300, 500));
});
