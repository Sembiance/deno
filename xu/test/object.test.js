import {} from "../object.js";
import {assertEquals, assertNotStrictEquals, assertStrictEquals} from "std";

Deno.test("clear", () =>
{
	const a = {hello : "world", abc : 123, kittyIsCute : true};
	const r = {};
	assertStrictEquals(Object.keys(a).length, 3);
	assertStrictEquals(JSON.stringify(r), JSON.stringify(Object.clear(a)));
	assertStrictEquals(JSON.stringify(r), JSON.stringify(a));
	assertStrictEquals(Object.keys(a).length, 0);
});

Deno.test("clone", () =>
{
	const doubleSub = {num : 47};
	const sub = {red : "apple", doubleSub};
	const a = {abc : 123, hello : "world", kitty : true, sub};
	const r = {abc : 123, hello : "world", kitty : true, sub};
	const r2 = {abc : 123, hello : "world", sub};
	assertStrictEquals(Object.equals(r, Object.clone(a)), true);
	assertEquals(Object.clone(a).sub, sub);
	assertNotStrictEquals(Object.clone(a).sub, sub);
	assertStrictEquals(Object.clone(a, {shallow : true}).sub, sub);
	assertStrictEquals(Object.equals(r2, Object.clone(a, {skipKeys : ["kitty"]})), true);
	assertStrictEquals(Object.clone(a, {shallow : true}).sub.doubleSub, doubleSub);
	assertEquals(Object.clone(a).sub.doubleSub, doubleSub);
});

Deno.test("equals", () =>
{
	const a = {abc : 123, sub : {num : 47}};
	assertStrictEquals(Object.equals(a, {sub : {num : 47}, abc : 123}), true);
	assertStrictEquals(Object.equals(a, {abc : 123, sub : {num : 47}, newKey : "other"}), false);
});

Deno.test("filterInPlace", () =>
{
	const a = {abc : 123, hello : "world", green : true};
	const b = Object.clone(a);
	const r = {hello : "world"};
	assertStrictEquals(Object.equals(r, Object.filterInPlace(a, (k, v) => typeof v==="string")), true);
	assertStrictEquals(Object.equals(r, a), true);
	assertStrictEquals(!Object.equals(a, b), true);
});

Deno.test("isObject", () =>
{
	assertStrictEquals(Object.isObject({abc : 123}), true);
	assertStrictEquals(Object.isObject({}), true);
	assertStrictEquals(Object.isObject([]), false);
});

Deno.test("map", () =>
{
	const a = {hello : "world", jon : "super kitty"};
	const r = {"super kitty" : "jon", world : "hello"};
	const r2 = {hello : 5, jon : 11};
	assertStrictEquals(Object.equals(r, Object.map(a, (k, v) => [v, k])), true);
	assertStrictEquals(Object.equals(r, a), false);
	assertStrictEquals(Object.equals(r2, Object.map(a, (k, v) => v.length)), true);
	assertStrictEquals(Object.equals(r2, Object.map(a, (k, v) => ([v.length]))), true);
});

Deno.test("mapInPlace", () =>
{
	let a = {hello : "world", jon : "super kitty"};
	const b = Object.clone(a);
	const r = {"super kitty" : "jon", world : "hello"};
	const r2 = {hello : 5, jon : 11};
	assertStrictEquals(Object.equals(a, b), true);
	assertStrictEquals(Object.equals(r, Object.mapInPlace(a, (k, v) => [v, k])), true);
	assertStrictEquals(Object.equals(r, a), true);
	assertStrictEquals(Object.equals(a, b), false);
	a = {hello : "world", jon : "super kitty"};
	assertStrictEquals(Object.equals(r2, Object.mapInPlace(a, (k, v) => v.length)), true);
	assertStrictEquals(Object.equals(r2, a), true);
});
