import {} from "../string.js";
import {base64Encode, base64Decode, assertStrictEquals, delay} from "std";

Deno.test("capitalize", () =>
{
	const a = "hello";
	const r = "Hello";
	assertStrictEquals(r, a.capitalize());
});

Deno.test("decolor", () =>
{
	assertStrictEquals(base64Encode((new TextDecoder()).decode(base64Decode("G1s5N21TaW5nbGUgTGluZSBCb29sZWFuIFBpZRtbMG06IBtbOTNtdHJ1ZRtbMG0gNiw0MDcgKDgxJSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzkzbWZhbHNlG1swbSAxLDQ3NyAoMTklKQogICAgICAgICAgICAgICAgICAgICAgICAbWzk2bVsbWzBtG1szODs1OzIwOG3ilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilogbWzBtG1szODs1OzkzbeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiBtbMG0bWzk2bV0bWzBt")).decolor()), "U2luZ2xlIExpbmUgQm9vbGVhbiBQaWU6IHRydWUgNiw0MDcgKDgxJSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWxzZSAxLDQ3NyAoMTklKQogICAgICAgICAgICAgICAgICAgICAgICBb4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paIXQ==");
});

Deno.test("innerTrim", () =>
{
	const a = "hello  	\nbig  bad  world";
	const r = "hello big bad world";
	assertStrictEquals(r, a.innerTrim());
	assertStrictEquals(r, r.innerTrim());
});

Deno.test("innerTruncate", () =>
{
	const a = "hello this is just a test of truncate system";
	const r = "hello t…system";
	assertStrictEquals(r, a.innerTruncate(14));
});

Deno.test("isNumber", () =>
{
	assertStrictEquals("1000".isNumber(), true);
	assertStrictEquals("1234.56".isNumber(), true);
	assertStrictEquals("-100".isNumber(), true);
	assertStrictEquals("100hj".isNumber(), false);
	assertStrictEquals("hj2000".isNumber(), false);
});

Deno.test("repeat", () =>
{
	const a = "hi";
	const r = "hihihihihi";
	assertStrictEquals(r, a.repeat(5));
});

Deno.test("replaceAsync", async () =>
{
	const a = "abc 123 xyz 999 omg";
	const r = "abc 246 xyz 1998 omg";
	assertStrictEquals(r, await a.replaceAsync(/(?<num>\d+)/g, async (m, num) =>
	{
		await delay(200);
		return (+num)*2;
	}));
});

Deno.test("reverse", () =>
{
	const a = "abc123";
	const r = "321cba";
	assertStrictEquals(r, a.reverse());
});

Deno.test("strip", () =>
{
	const a = "hello, world";
	const r = "hll, wrld";
	assertStrictEquals(r, a.strip("aeiou"));
	assertStrictEquals(r, a.strip(["a", "e", "i", "o", "u"]));
});

Deno.test("squeeze", () =>
{
	const o = {abc : () => {}, xyz : false, numbers : [23, 213, 125, 123_523_523, 23423], moreProps : {subObj : "keys", andMore : "live\nlong\nand\nprosper"}};
	const a = Deno.inspect(o, {colors : false, compact : true, depth : 7, iterableLimit : 150, showProxy : false, sorted : false, trailingComma : false, getters : false, showHidden : false}).squeeze();
	const r = `{ abc: [Function: abc], xyz: false, numbers: [ 23, 213, 125, 123523523, 23423 ], moreProps: { subObj: "keys", andMore: "live\\nlong\\nand\\nprosper" } }`;
	assertStrictEquals(r, a);
});

Deno.test("toCamelCase", () =>
{
	const a = "This is just a test";
	const r = "thisIsJustATest";
	assertStrictEquals(r, a.toCamelCase());
});

Deno.test("toProperCase", () =>
{
	const a = "hello THERE my good Friend";
	const r = "Hello There My Good Friend";
	assertStrictEquals(r, a.toProperCase());
});

Deno.test("trimChars", () =>
{
	const a = "----====Hello World----====";
	const r = "Hello World";
	assertStrictEquals(r, a.trimChars("-="));
	assertStrictEquals(r, a.trimChars(["-", "="]));
	assertStrictEquals("abc123", "  \nabc123\t  ".trimChars());
});
