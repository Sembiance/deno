import {assertStrictEquals} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import {} from "../string.js";

Deno.test("capitalize", () =>
{
	const a = "hello";
	const r = "Hello";
	assertStrictEquals(r, a.capitalize());
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

Deno.test("strip", () =>
{
	const a = "hello, world";
	const r = "hll, wrld";
	assertStrictEquals(r, a.strip("aeiou"));
	assertStrictEquals(r, a.strip(["a", "e", "i", "o", "u"]));
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
});
