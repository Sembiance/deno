/* eslint-disable sembiance/shorter-arrow-funs */
import {} from "../string.js";
import {base64Encode, base64Decode, assertStrictEquals, delay} from "std";

Deno.test("capitalize", () =>
{
	const a = "hello";
	const r = "Hello";
	assertStrictEquals(r, a.capitalize());
});

Deno.test("decodeURLPath", () =>
{
	assertStrictEquals("spanish%20pack%20n%C2%B01%20by%20llfb/grafismo/digitaliz./fotos_de_humphrey-ctl/euskal_4/%3f%20&%20jupiter".decodeURLPath(), "spanish pack n%C2%B01 by llfb/grafismo/digitaliz./fotos_de_humphrey-ctl/euskal_4/? & jupiter");
	assertStrictEquals("this has newlines%0aand%0dcarriage returnsand%09tabsand%5cbackslashes%5c%5comg%3f%23!&".decodeURLPath(), "this has newlines\nand\rcarriage returnsand\ttabsand\\backslashes\\\\omg?#!&");
});

Deno.test("decolor", () =>
{
	assertStrictEquals(base64Encode((new TextDecoder()).decode(base64Decode("G1s5N21TaW5nbGUgTGluZSBCb29sZWFuIFBpZRtbMG06IBtbOTNtdHJ1ZRtbMG0gNiw0MDcgKDgxJSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzkzbWZhbHNlG1swbSAxLDQ3NyAoMTklKQogICAgICAgICAgICAgICAgICAgICAgICAbWzk2bVsbWzBtG1szODs1OzIwOG3ilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilogbWzBtG1szODs1OzkzbeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiBtbMG0bWzk2bV0bWzBt")).decolor()), "U2luZ2xlIExpbmUgQm9vbGVhbiBQaWU6IHRydWUgNiw0MDcgKDgxJSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWxzZSAxLDQ3NyAoMTklKQogICAgICAgICAgICAgICAgICAgICAgICBb4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paIXQ==");
});

Deno.test("encodeURLPath", () =>
{
	assertStrictEquals("crazy?filename?withpercents%andquestion?marks".encodeURLPath(), "crazy%3ffilename%3fwithpercents%25andquestion%3fmarks");
	assertStrictEquals("this has newlines\nand\rcarriage returnsand\ttabsand\\backslashes\\\\omg?#!&".encodeURLPath(), "this has newlines%0aand%0dcarriage returnsand%09tabsand%5cbackslashes%5c%5comg%3f%23!&");
});

Deno.test("escapeRegex", () =>
{
	assertStrictEquals("this/is NOT! a [very] awesome test*".escapeRegex(), "this\\/is NOT! a \\[very\\] awesome test\\*");
});

Deno.test("escapeXML", () =>
{
	assertStrictEquals(`this filename is > 88 and < 22 with "string's" & more...`.escapeXML(), "this filename is &gt; 88 and &lt; 22 with &quot;string&#039;s&quot; &amp; more...");
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

Deno.test("toVisible", () =>
{
	assertStrictEquals(`T\x01his newline\nand\rcarriage \x1bescape string with \ttabs\vverticaland nulls \0 with \x07 bells and backspaces \b`.toVisible(), "This newline␤and↵carriage ␛escape string with ⇥tabs⇩verticaland nulls ␀ with ⍾ bells and backspaces ⌫");	// eslint-disable-line unicorn/no-hex-escape, unicorn/escape-case
});

Deno.test("trimChars", () =>
{
	const a = "----====Hello World----====";
	const r = "Hello World";
	assertStrictEquals(r, a.trimChars("-="));
	assertStrictEquals(r, a.trimChars(["-", "="]));
	assertStrictEquals("abc123", "  \nabc123\t  ".trimChars());
});
