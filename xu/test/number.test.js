import {xu} from "../xu.js";
import {assertEquals, assertStrictEquals} from "std";

Deno.test("bytesToSize", () =>
{
	let a = Number(128_939_123);
	assertStrictEquals(a.bytesToSize(), "129MB");
	a = Number(47);
	assertStrictEquals(a.bytesToSize(), "47 bytes");
});

Deno.test("clearBit", () =>
{
	const a = Number(47);
	const ra = Number(39);
	assertStrictEquals(ra, a.clearBit(3));
});

Deno.test("flipBit", () =>
{
	const a = Number(47);
	const ra = Number(39);
	assertStrictEquals(ra, a.flipBit(3));
	assertStrictEquals(a, a.flipBit(3).flipBit(3));
});

Deno.test("getBit", () =>
{
	const a = Number(47);
	assertStrictEquals(1, a.getBit(3));
	assertStrictEquals(0, a.getBit(4));
});

Deno.test("getBits", () =>
{
	const a = Number(47);
	const ra = [1, 1, 1, 1, 0, 1, 0, 0];
	assertEquals(ra, a.getBits().slice(0, 8));
});

Deno.test("scale", () =>
{
	const a = Number(47);
	const ra = Number(34127.64);
	assertStrictEquals(ra, a.scale(0, 100, 0, 72612));
});

Deno.test("secondsAsHumanReadable", () =>
{
	const a = Number(136);
	const ra = "2 minutes, 16 seconds";
	assertStrictEquals(a.secondsAsHumanReadable(), ra);

	const b = Number(44);
	const rb = "44 seconds";
	assertStrictEquals(b.secondsAsHumanReadable(), rb);

	const c = Number(1_700_355);
	let rc = "19d16h19m15s";
	assertStrictEquals(c.secondsAsHumanReadable({short : true}), rc);
	rc = "19d16h";
	assertStrictEquals(c.secondsAsHumanReadable({short : true, maxParts : 2}), rc);

	const d = Number(0.5);
	const rd = "0.50s";
	assertStrictEquals(d.secondsAsHumanReadable({short : true}), rd);

	const e = Number(1_209_601);
	const re = "14d1s";
	assertStrictEquals(e.secondsAsHumanReadable({short : true}), re);

	const f = Number(48_923_789_432.25);
	let rf = "1,550 years, 3 months, 18 days, 18 hours, 32 seconds";
	assertStrictEquals(f.secondsAsHumanReadable(), rf);
	rf = "1,550y3mo18d18h32s";
	assertStrictEquals(f.secondsAsHumanReadable({short : true}), rf);

	const g = Number(0.232);
	const rg = "0.23s";
	assertStrictEquals(g.secondsAsHumanReadable({short : true}), rg);
});

Deno.test("setBit", () =>
{
	const a = Number(47);
	const ra = Number(63);
	assertStrictEquals(ra, a.setBit(4));
});

Deno.test("toClock", () =>
{
	let a = Number((xu.MINUTE*2) + (xu.SECOND*16));
	let r = "2:16";
	assertStrictEquals(a.toClock(), r);

	a = Number((xu.MINUTE*2) + (xu.SECOND*16) + 100);
	r = "2:16.100";
	assertStrictEquals(a.toClock(), r);

	a = Number((xu.HOUR*2) + (xu.MINUTE*37) + (xu.SECOND*59) + 847);
	r = "2:37:59.847";
	assertStrictEquals(a.toClock(), r);

	a = Number((xu.HOUR*7));
	r = "7:00:00";
	assertStrictEquals(a.toClock(), r);

	a = Number((xu.MINUTE*5));
	r = "5:00";
	assertStrictEquals(a.toClock(), r);
});
