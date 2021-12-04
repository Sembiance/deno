import {} from "../uint8array.js";
import {assertEquals, assertStrictEquals, path} from "std";

const a = await Deno.readFile(path.join(path.resolve((new URL(".", import.meta.url)).pathname), "files", "siren.sound"));
assertStrictEquals(a.length, 1429);

Deno.test("indexOfX", () =>
{
	assertStrictEquals(a.indexOfX("VHDR"), 12);
	assertStrictEquals(a.indexOfX(Uint8Array.from([0x41, 0x4E, 0x4E, 0x4F])), 40);
	assertStrictEquals(a.indexOfX(0xDB), 139);
	assertStrictEquals(a.indexOfX([0x20, 0x50, 0x45]), 61);
});

Deno.test("getInt8", () => assertStrictEquals(a.getInt8(7), -119));
Deno.test("getUInt8", () => assertStrictEquals(a.getUInt8(7), 137));

Deno.test("getInt16LE", () => assertStrictEquals(a.getInt16LE(6), -30459));
Deno.test("getInt16BE", () => assertStrictEquals(a.getInt16BE(7), -30408));
Deno.test("getUInt16LE", () => assertStrictEquals(a.getUInt16LE(6), 35077));
Deno.test("getUInt16BE", () => assertStrictEquals(a.getUInt16BE(6), 1417));

Deno.test("getInt32LE", () => assertStrictEquals(a.getInt32LE(30), -215_547_904));
Deno.test("getInt32BE", () => assertStrictEquals(a.getInt32BE(7), -1_992_797_354));
Deno.test("getUInt32LE", () => assertStrictEquals(a.getUInt32LE(30), 4_079_419_392));
Deno.test("getUInt32BE", () => assertStrictEquals(a.getUInt32BE(7), 2_302_169_942));

Deno.test("getBigInt64LE", () => assertStrictEquals(a.getBigInt64LE(0), BigInt("-8573446314332631226")));
Deno.test("getBigInt64BE", () => assertStrictEquals(a.getBigInt64BE(7), BigInt("-8558999461503285180")));
Deno.test("getBigInt64BE", () => assertStrictEquals(a.getBigInt64BE(25), BigInt(39)));
Deno.test("getBigUInt64LE", () => assertStrictEquals(a.getBigUInt64LE(0), BigInt("9873297759376920390")));
Deno.test("getBigUInt64BE", () => assertStrictEquals(a.getBigUInt64BE(7), BigInt("9887744612206266436")));
Deno.test("getBigUInt64BE", () => assertStrictEquals(a.getBigUInt64BE(16), BigInt(85_899_347_221)));

Deno.test("setUInt16BE", () =>
{
	assertStrictEquals(a.getUInt16BE(10), 22104);
	assertEquals(a.subarray(10, 12), Uint8Array.from([86, 88]));
	a.setUInt16BE(10, 8000);
	assertEquals(a.subarray(10, 12), Uint8Array.from([31, 64]));
	assertStrictEquals(a.getUInt16BE(10), 8000);
});
