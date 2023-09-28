import {xu} from "xu";
import {assertRejects, assertStrictEquals, assert, delay} from "std";
import {runUtil} from "xutil";
import {XLog} from "xlog";
import {WebServer} from "./WebServer.js";

Deno.test("prefix", async () =>
{
	const portNum = Math.randomInt(30010, 39990);
	const webServer = new WebServer("127.0.0.1", portNum, {xlog : new XLog("error")});
	await webServer.start();

	webServer.add("/view", async () => (new Response("You browsed")), {prefix : true});	// eslint-disable-line require-await
	const a = await fetch(`http://127.0.0.1:${portNum}/view/some/big/long/thing.txt`);
	assertStrictEquals(a.status, 200);
	assertStrictEquals(await a.text(), "You browsed");

	webServer.stop();
	
	await delay(250);
});

Deno.test("external", async () =>
{
	const portNum = Math.randomInt(30010, 39990);
	const webServer = new WebServer("127.0.0.1", portNum, {xlog : new XLog("error")});
	await webServer.start();

	webServer.add("/view", async () => (new Response("You browsed")), {prefix : true});	// eslint-disable-line require-await

	await [].pushSequence(1, 100).parallelMap(async () =>
	{
		const {stdout} = await runUtil.run("curl", [`http://127.0.0.1:${portNum}/view/some/big/long/thing.txt`]);
		assertStrictEquals(stdout, "You browsed");
	});

	webServer.stop();
});

Deno.test("basic", async () =>
{
	const webServer = new WebServer("127.0.0.1", 37291, {xlog : new XLog("error")});
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
	console.log("Exception should be thrown:");
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
	console.log("Exception should be thrown:");
	r = await (await fetch(`http://127.0.0.1:37291/detachedThrowsNoAsync`, {method : "POST", headers : { "content-type" : "application/json" }, body : JSON.stringify({abc : 123, hello : "world"})})).text();
	assert(r.startsWith("error"));

	webServer.stop();

	await delay(250);
});
