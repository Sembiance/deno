import {xu} from "../xu.js";
import {assertEquals, assertStrictEquals} from "std";

Deno.test("bitsToNum", () =>
{
	const a = Number(47);
	assertStrictEquals(a.bitsToNum(4, 0), 15);
	assertStrictEquals(a.bitsToNum(4, 3), 5);
	assertStrictEquals(a.bitsToNum(4, 4), 2);
});

Deno.test("bytesToSize", () =>
{
	let a = Number(128_939_123);
	assertStrictEquals(a.bytesToSize(), "123MB");
	a = Number(47);
	assertStrictEquals(a.bytesToSize(), "47b");
	a = Number(xu.MB);
	assertStrictEquals(a.bytesToSize(), "1MB");
	a = Number(xu.GB);
	assertStrictEquals(a.bytesToSize(), "1GB");
	a = Number(xu.TB);
	assertStrictEquals(a.bytesToSize(), "1TB");
	a = Number(xu.PB);
	assertStrictEquals(a.bytesToSize(), "1PB");
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

Deno.test("noExponents", () =>
{
	assertStrictEquals((123).noExponents(), "123");
	assertStrictEquals((0.000_123).noExponents(), "0.000123");
	assertStrictEquals((1.23e7).noExponents(), "12300000");
	assertStrictEquals((1.2345e-5).noExponents(), "0.000012345");
	assertStrictEquals((-2.345e-3).noExponents(), "-0.002345");
	assertStrictEquals((1.23e-5).noExponents(), "0.0000123");
	assertStrictEquals((-3.21e-2).noExponents(), "-0.0321");
	assertStrictEquals((1.234e4).noExponents(), "12340");
	assertStrictEquals((1.2345e1).noExponents(), "12.345");
});

Deno.test("scale", () =>
{
	const a = Number(47);
	const ra = Number(34127.64);
	assertStrictEquals(ra, a.scale(0, 100, 0, 72612));
});

Deno.test("secondsAsHumanReadable", () =>
{
	let a = Number(136);
	let r = "2 minutes, 16 seconds";
	assertStrictEquals(a.secondsAsHumanReadable(), r);

	a = Number(44);
	r = "44 seconds";
	assertStrictEquals(a.secondsAsHumanReadable(), r);

	a = Number(1_700_355);
	r = "19d16h19m15s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true}), r);
	r = "19d16h";
	assertStrictEquals(a.secondsAsHumanReadable({short : true, maxParts : 2}), r);

	a = Number(0.5);
	r = "0.50s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true}), r);

	a = Number(1_209_601);
	r = "14d1s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true}), r);
	
	r = "14d01s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true, pad : true}), r);

	a = Number(607_667);
	r = "7d47m47s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true, pad : true}), r);

	a = Number(605_227);
	r = "7d7m7s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true}), r);
	
	r = "7d07m07s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true, pad : true}), r);
	r = " 7d07m07s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true, pad : 2}), r);

	a = Number(48_923_789_432.25);
	r = "1,550 years, 3 months, 18 days, 18 hours, 32 seconds";
	assertStrictEquals(a.secondsAsHumanReadable(), r);
	r = "1,550y3mo18d18h32s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true}), r);

	a = Number(0.232);
	r = "0.23s";
	assertStrictEquals(a.secondsAsHumanReadable({short : true}), r);
});

Deno.test("msAsHumanReadable", () =>
{
	let a = Number(420_000);
	let r = "7m";
	assertStrictEquals(a.msAsHumanReadable({short : true}), r);

	r = "7m00s";
	assertStrictEquals(a.msAsHumanReadable({short : true, pad : true}), r);
	r = " 7m00s";
	assertStrictEquals(a.msAsHumanReadable({short : true, pad : 2}), r);

	a = Number(25_200_000);
	r = "7h00s";
	assertStrictEquals(a.msAsHumanReadable({short : true, pad : true}), r);
	r = " 7h00s";
	assertStrictEquals(a.msAsHumanReadable({short : true, pad : 2}), r);
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
