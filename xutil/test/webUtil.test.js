/* eslint-disable sembiance/shorter-arrow-funs */
import {xu} from "xu";
import {webUtil, urlUtil, runUtil, fileUtil} from "xutil";
import {assert, assertStrictEquals, delay} from "std";
import {XLog} from "xlog";

const xlog = new XLog("warn");
const serveOpts = {hostname : "127.0.0.1", port : 37291};

Deno.test("serveBasic", async () =>
{
	const server = webUtil.serve(serveOpts, req => new Response(`Hello, World! ${req.url}`), {xlog});

	let a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(a, "Hello, World! http://127.0.0.1:37291/test");
	server.stop();
});

Deno.test("serveAsync", async () =>
{
	const server = webUtil.serve(serveOpts, async req =>
	{
		const r = ["Hello,"];
		await delay(xu.SECOND);
		r.push("World!");
		await delay(xu.SECOND);
		r.push(req.url);
		return new Response(r.join(" "));
	}, {xlog});

	const before = performance.now();
	let a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(Math.round((performance.now()-before)/xu.SECOND), 2);
	assertStrictEquals(a, "Hello, World! http://127.0.0.1:37291/test");

	server.stop();
});

Deno.test("serveException", async () =>
{
	const server = webUtil.serve(serveOpts, () => { throw new Error("THIS ERROR IS EXPECTED"); }, {xlog});

	let a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 500);
	a = await a.text();
	assertStrictEquals(a, "127.0.0.1:37291 error: Error: THIS ERROR IS EXPECTED");
	server.stop();
});

Deno.test("serveExceptionAsync", async () =>
{
	const server = webUtil.serve(serveOpts, async () => { await delay(xu.SECOND); throw new Error("THIS ERROR IS EXPECTED"); }, {xlog});

	let a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 500);
	a = await a.text();
	assertStrictEquals(a, "127.0.0.1:37291 error: Error: THIS ERROR IS EXPECTED");
	server.stop();
});

Deno.test("shutdown", async () =>
{
	const server = webUtil.serve(serveOpts, async req =>
	{
		const r = ["Hello,"];
		await delay(xu.SECOND);
		r.push("World!");
		await delay(xu.SECOND*3);
		r.push(req.url);
		return new Response(r.join(" "));
	}, {xlog});

	const reqURLs = ["test", "test2", "test3"].map(v => `http://127.0.0.1:37291/${v}`);
	const promises = reqURLs.map(reqURL => fetch(reqURL));
	await delay(xu.SECOND);
	const before = performance.now();
	await server.server.shutdown();
	assertStrictEquals(Math.round((performance.now()-before)/xu.SECOND), 3);

	const fetchResults = await Promise.all(promises);
	assertStrictEquals(fetchResults.length, reqURLs.length);
	for(let i=0;i<reqURLs.length;i++)
	{
		const fetchResult = fetchResults[i];
		assertStrictEquals(fetchResult.status, 200);
		assertStrictEquals(fetchResult.url, reqURLs[i]);
		const fetchResultText = await fetchResult.text();
		assertStrictEquals(fetchResultText, `Hello, World! ${reqURLs[i]}`);
	}
});

Deno.test("route404", async () =>
{
	const server = webUtil.serve(serveOpts, await webUtil.route({}), {xlog});

	let a = await fetch("http://127.0.0.1:37291/test");
	assertStrictEquals(a.status, 404);
	a = await a.text();
	assertStrictEquals(a, "404 not found");
	server.stop();
});

Deno.test("routeBasic", async () =>
{
	const routes = new Map(Object.entries({
		"/test" : async (req, o) => { await delay(xu.SECOND*2); return new Response(`${o.customArg} ${urlUtil.urlToQueryObject(req.url).hello} ${req.url}`); },
		"/test2" : () => new Response("hi"),
		"/noResponse" : () => {},
		"/invalidResponse" : () => ({thisError : "IS EXPECTED"}),
		"/throwsException" : () => { throw new Error("THIS ERROR IS EXPECTED"); }
	}));
	routes.set(/^\/test\/subPath/, req => new Response(`subPath ${(new URL(req.url)).pathname}`));

	const webRouteHandler = await webUtil.route(routes, {xlog, customArg : "Hello,"});
	const server = webUtil.serve(serveOpts, webRouteHandler, {xlog});

	let a = await fetch("http://127.0.0.1:37291/noResponse");
	assertStrictEquals(a.status, 500);
	a = await a.text();
	assertStrictEquals(a, "no response found");

	a = await fetch("http://127.0.0.1:37291/invalidResponse");
	assertStrictEquals(a.status, 500);
	a = await a.text();
	assertStrictEquals(a, "invalid response found");

	a = await fetch("http://127.0.0.1:37291/throwsException");
	assertStrictEquals(a.status, 500);
	a = await a.text();
	assert(a.startsWith("error<br>Error: THIS ERROR IS EXPECTED\n"));

	a = await fetch("http://127.0.0.1:37291/nonExistantPath");
	assertStrictEquals(a.status, 404);
	a = await a.text();
	assertStrictEquals(a, "404 not found");

	const before = performance.now();
	a = await fetch("http://127.0.0.1:37291/test?hello=World!");
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(Math.round((performance.now()-before)/xu.SECOND), 2);
	assertStrictEquals(a, "Hello, World! http://127.0.0.1:37291/test?hello=World!");

	a = await fetch("http://127.0.0.1:37291/test2");
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(a, "hi");

	a = await fetch("http://127.0.0.1:37291/test2/not/a/prefix");
	assertStrictEquals(a.status, 404);
	a = await a.text();
	assertStrictEquals(a, "404 not found");

	a = await fetch("http://127.0.0.1:37291/test/subPath");
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(a, "subPath /test/subPath");

	a = await fetch("http://127.0.0.1:37291/test/subPath/omg/it/keeps/going");
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(a, "subPath /test/subPath/omg/it/keeps/going");

	a = await webRouteHandler({url : "http://127.0.0.1:37291/test?hello=Cruel World!"}, undefined, {customArg : "Goodbye,"});
	assertStrictEquals(a.status, 200);
	a = await a.text();
	assertStrictEquals(a, "Goodbye, Cruel World! http://127.0.0.1:37291/test?hello=Cruel World!");

	server.stop();
});

Deno.test("routeExternal", async () =>
{
	const port = Math.randomInt(30010, 39990);
	const routes = new Map();
	routes.set(/^\/view/, () => (new Response("You browsed")));
	const server = webUtil.serve({...serveOpts, port}, await webUtil.route(routes), {xlog});

	await [].pushSequence(1, 1000).parallelMap(async () =>
	{
		const {stdout} = await runUtil.run("curl", [`http://127.0.0.1:${port}/view/some/big/long/thing.txt`]);
		assertStrictEquals(stdout, "You browsed");
	});

	server.stop();
});


Deno.test("devMode", async () =>
{
	const handlerFilePath = await fileUtil.genTempPath(undefined, "-webUtil-test-handler.js");
	await fileUtil.writeTextFile(handlerFilePath, `export default async function testHandler() { return new Response("Dev Mode 1"); }\n`);

	let routesMonitorStopper = null;
	const port = Math.randomInt(30010, 39990);
	const server = webUtil.serve({...serveOpts, port}, await webUtil.route({"/test" : handlerFilePath}, undefined, {devMode : true, getStopper : cb => { routesMonitorStopper = cb; }}), {xlog});

	let a = await fetch(`http://127.0.0.1:${port}/test`);
	assertStrictEquals(a.status, 200);
	assertStrictEquals(await a.text(), "Dev Mode 1");

	a = await fetch(`http://127.0.0.1:${port}/test`);
	assertStrictEquals(a.status, 200);
	assertStrictEquals(await a.text(), "Dev Mode 1");

	await fileUtil.writeTextFile(handlerFilePath, `export default async function testHandler() { return new Response("Dev Mode 2"); }\n`);
	await delay(xu.SECOND);	// allow time for the fileMonitor to see the change and reload the handler

	a = await fetch(`http://127.0.0.1:${port}/test`);
	assertStrictEquals(a.status, 200);
	assertStrictEquals(await a.text(), "Dev Mode 2");

	server.stop();
	await routesMonitorStopper();
	await fileUtil.unlink(handlerFilePath);
	await delay(xu.SECOND);	// give stopper time to stop the fileMonitor
});
