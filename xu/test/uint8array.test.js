import "../uint8array.js";
import {assertEquals, assertStrictEquals, path} from "std";

const a = await Deno.readFile(path.join(path.resolve((new URL(".", import.meta.url)).pathname), "files", "siren.sound"));
assertStrictEquals(a.length, 1429);

Deno.test("asHex", () =>
{
	const r = "464f524d0000058938535658564844520000001400000515000000000000000027f3010000010000414e4e4f000000445265636f726465642077697468205045524645435420534f554e442066726f6d2053756e52697a6520496e64757374726965732e20202834303929203834362d31333131424f445900000515000000027875726f6d6a676463605ddba4a2a4a7aaadafb2b5b83e6f726f6c6a676461605d5c59575451faa0979a9da0a3a4a7aaacafb2b3b6b9bbbed15f787875726f6c6a676461605d5a5903a99fa0a3a6a9aaadb0b2b5b6b9bcbebfc2dd607b7b7875726f6c6a676461605d5affaca0a3a6a9aaadb0b2b5b6b9bbbebfc1c3d153797c797673706d6a676463605d5a2ebba2a2a4a7a9acafbc3b63676461605d5a595653514e4d4a4809a6919194979a9c9fa2a4a6a9acadafb2b5b81b606d6c696663605f5c595754515045cf9f97999c9fa0a3a6a7aaacafb0b3b5b8b9d5476c706d6a696663605d5a5956535125bc9d9a9c9fa2a3a6a9aaadafb2b3b5b8b9bcfc566f726f6c696663605d5c5956535110b89d9a9d9fa2d73554595754514e4d4a484544413f3e3bfca48885888b8e919496999c9fa0a3a6a7aaacf4425f61605d5a575653504e4b4a474509b394909194979a9c9fa2a3a6a9aaadafb2b3e83f61696764615f5c5a575453504d4b26c9a09696999c9fa0a3a6a7aaacafb0b3b5b8cf2e5d6a6c696663605d5c595654514e45ebb09c999ff3324b504e4d4a484544413f3d3b3a3734e7a3888284878a8d909396999a9da0a3a4a7a9da29515d5f5c59575451504d4b4847442cd7a493909396999a9da0a2a4a7a9acafb0b3b9044460676764615f5d5a575653514e4d22d4a99a999a9da0a3a4a7aaacafb0b3b5b8b9c6164e666d6c6a6764615f5d5a5756535016d2adbf0735484d4d4b484744423f3e3d3a38372ee5aa8e8585878a8e919496999c9fa2a3a6a9aad41b47595f5f5c59575453504d4b4a4741ffc3a3979496999c9fa2a4a6a9acadb0b2b5b6d21848606969676461605d5a595654514d15d7b2a39f9fa2a3a6a9acadb0b3b5b8b9bcbec8093f606c706f6c696764615f5d5a59563afc01223a474b4b4a474544413f3e3b3a383720e1af948a87888b8e9194979a9d9fa2a4a7a9accb0938515c5f5f5c59575453504e4b4a4718deb6a29a999a9c9fa2a4a7aaacafb2b3b6b8beee264d60696a696764615f5d5a5756534810ddbba9a3a2a3a6a9aaadb0b2b5b6b9bbbebfcb013456676f706f6c6a6764615f5d5a595653514e4d4b48474542413f3d3b3a3837341be4b89c8d8887888b8e9196979a9da0a3a4a7aac1f62342535a5c5c59575453504e4b4a4831fdcfb2a29a999a9c9fa2a4a7a9acafb0b3b5b8c9fa28485c6467676663605f5c595754534110e2c2afa6a3a3a4a7a9acafb0b3b6b8bbbcbec6f322455c676c6d6c6a676461605d5a595654514e4d4b48474442413e3d3b3a373523f6cbac998e8a8a8b8e9194979a9c9fa2a4a7a9b5de0c2e4451595a5a59565451504d4b48421ff3ceb5a49d9a9a9c9fa2a3a6a9acadb0b3b5b8d2fd2542545f64646463605d5a595654514118eecfb9aca6a3a3a4a7a9acafb0b3b5b8b9bcc2e40f324b5c64696a69676461605d5a575653514e4d4a484544423f3e3d3a383725ffd8b9a497908d8d8e909396999c9fa2a3a6a9afcef619344550565959575653514e4d4a47310ae5c9b5a7a09d9c9d9fa2a3a6a9acadb0b2b5bbd8ff203b4d5960616361605d5c595654513f1cf7dac3b5aaa6a4a4a6a7aaacafb2b3b6b8bbbed8fc1e3a4d5a616667676463605f5c59565451504d4b48474442413e3d3b3820ffddc1ad9f979391919394979a9d9fa2a4a7a9b0ccee0f283b4a51565757575653514e4d4a3b1cfaddc5b5a9a3a09f9fa0a3a4a7aaacafb2b3b6c8e807253b4b565d6061605f5d5c5956544e3413f4dbc6b9afaaa7a6a7a9aaadafb2b3b6b8bbc2ddfc193245535d6164646463615f";
	assertStrictEquals(a.asHex(), r);
});

Deno.test("copy", () =>
{
	const b = Uint8Array.from(a);
	assertStrictEquals(86, b[10]);
	assertStrictEquals(88, b[11]);
	assertStrictEquals(86, b[12]);
	assertStrictEquals(72, b[13]);
	assertStrictEquals(68, b[14]);
	Uint8Array.from([0x50, 0x49, 0x48, 0x47, 0x02, 0x03, 0x04, 0x05]).copy(b, 10, 3);
	assertStrictEquals(71, b[10]);
	assertStrictEquals(2, b[11]);
	assertStrictEquals(3, b[12]);
	assertStrictEquals(4, b[13]);
	assertStrictEquals(5, b[14]);
});

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
	const b = Uint8Array.from(a);
	assertStrictEquals(b.getUInt16BE(10), 22104);
	assertEquals(b.subarray(10, 12), Uint8Array.from([86, 88]));
	b.setUInt16BE(10, 8000);
	assertEquals(b.subarray(10, 12), Uint8Array.from([31, 64]));
	assertStrictEquals(b.getUInt16BE(10), 8000);
});

Deno.test("getString", () =>
{
	assertStrictEquals(a.getString(48, 52), "Recorded with PERFECT SOUND from SunRize Industries.");
	assertStrictEquals(a.getString(12, 4), "VHDR");
});

Deno.test("getPascalString", () =>
{
	assertStrictEquals(Uint8Array.from([0x05, 0x68, 0x65, 0x6C, 0x6C, 0x6F]).getPascalString(0), "hello");
	assertStrictEquals(a.getString(48, 52), "Recorded with PERFECT SOUND from SunRize Industries.");
	assertStrictEquals(a.getString(12, 4), "VHDR");
});

