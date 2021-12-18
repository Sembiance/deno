import {xu} from "xu";
import {assertRejects, assertStrictEquals, assert, delay} from "std";
import {WebServer} from "./WebServer.js";

Deno.test("basic", async () =>
{
	const webServer = WebServer.create("127.0.0.1", 37291);
	assertRejects(() => fetch("http://127.0.0.1:37291/test"));
	await webServer.start();
	let a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 404);
	assertStrictEquals(await a.text(), "404 not found");
	webServer.add("/test", async () =>
	{
		await delay(xu.SECOND*1);
		return new Response("Hello, World!");
	});
	a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 200);
	assertStrictEquals(await a.text(), "Hello, World!");
	webServer.add("/noResponse", async () => {});
	a = await fetch("http://127.0.0.1:37291/noResponse");
	assertStrictEquals(a.status, 500);
	assertStrictEquals(await a.text(), "no response found");

	webServer.add("/throwsException", async () =>
	{
		await delay(xu.SECOND);
		throw new Error("unknown error omg");
	});
	a = await fetch("http://127.0.0.1:37291/throwsException");
	assertStrictEquals(a.status, 500);
	let r = await a.text();
	assert(r.startsWith("error"));

	webServer.add("/postJSON", async request =>
	{
		const body = await request.json();
		assertStrictEquals(body.abc, 123);
		assertStrictEquals(body.hello, "world");
		return new Response(JSON.stringify({liveLong : "andProsper"}));
	}, {method : "POST"});
	r = await fetch(`http://127.0.0.1:37291/postJSON`, {method : "GET"});
	assertStrictEquals(r.status, 405);
	assertStrictEquals(await r.text(), "405 method not allowed");
	r = await (await fetch(`http://127.0.0.1:37291/postJSON`, {method : "POST", headers : { "content-type" : "application/json" }, body : JSON.stringify({abc : 123, hello : "world"})})).json();
	assertStrictEquals(r.liveLong, "andProsper");

	webServer.add("/detached", async (request, reply) =>
	{
		await delay(xu.SECOND);
		setTimeout(() => reply(new Response("sysop mania")), xu.SECOND);
	}, {detached : true, method : "POST"});
	const before = performance.now();
	r = await (await fetch(`http://127.0.0.1:37291/detached`, {method : "POST", headers : { "content-type" : "application/json" }, body : JSON.stringify({abc : 123, hello : "world"})})).text();
	assertStrictEquals(Math.round((performance.now()-before)/xu.SECOND), 2);
	assertStrictEquals(r, "sysop mania");

	webServer.add("/detachedThrowsNoAsync", () => { throw new Error("detached error msg"); }, {detached : true, method : "POST"});	// eslint-disable-line sembiance/shorter-arrow-funs
	r = await (await fetch(`http://127.0.0.1:37291/detachedThrowsNoAsync`, {method : "POST", headers : { "content-type" : "application/json" }, body : JSON.stringify({abc : 123, hello : "world"})})).text();
	assert(r.startsWith("error"));

	webServer.stop();
});
