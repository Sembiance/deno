import {xu} from "xu";
import {delay, assertStrictEquals, assertEquals, assert, path} from "std";
import * as runUtil from "../runUtil.js";
import * as fileUtil from "../fileUtil.js";

await runUtil.run("prlimit", ["--pid", Deno.pid, `--core=0`]);

Deno.test("cwd", async () =>
{
	const {stdout, stderr, status} = await runUtil.run("cat", ["hosts"], {cwd : "/etc"});
	assertStrictEquals(stderr.length, 0);
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);
	assertStrictEquals(stdout.length>0, true);
	assertStrictEquals(stdout.includes("127.0.0.1"), true);
	assertStrictEquals(stdout.includes("localhost"), true);
});

Deno.test("cwd", async () =>
{
	const {stdout} = await runUtil.run("printenv", [], {env : {RUNUTIL_ENV_TEST : 47}});
	assertStrictEquals(stdout.includes("RUNUTIL_ENV_TEST=47"), true);
});

Deno.test("liveOutput", async () =>
{
	const {stdout, stderr, status} = await runUtil.run("echo", ["\nLive Output Test. Normal to see this message.\n"], {liveOutput : true});
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr.length, 0);
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);
});

Deno.test("stdout", async () =>
{
	const {stdout} = await runUtil.run("uname");
	assertStrictEquals(stdout, "Linux\n");
});

Deno.test("stdout-encoding", async () =>
{
	let {stdout} = await runUtil.run("unlzx", ["-v", path.join(xu.dirname(import.meta), "files", "test.lzx")], {stdoutEncoding : "latin1"});
	assert(stdout.includes("mod._¡TSA!_Aiguanaguoman_v1.43"));

	({stdout} = await runUtil.run("unzip", ["-qz", path.join(xu.dirname(import.meta), "files", "p205.zip")], {stdoutEncoding : "CP437"}));
	assert(stdout.includes("│ ▄▄▄   ▄▄     ▄▄▄   ─────────────────────────            Winston-Salem, NC │"));
});

Deno.test("stdoutcb", async () =>
{
	let foundPS = false;
	let lineCount = 0;
	const stdoutcb = async line =>
	{
		lineCount++;
		if(line.endsWith(" ps"))
			foundPS = true;

		await delay(100);
	};

	await runUtil.run("ps", [], {stdoutcb, detached : true});
	await delay(xu.SECOND*2);
	assertStrictEquals(foundPS, true);
	assert(lineCount>=2);
});

Deno.test("stdoutcb2", async () =>
{
	let lineCount = 0;
	let seenLastLine = false;
	const stdoutcb = async line =>	// eslint-disable-line require-await
	{
		lineCount++;
		if(xu.parseJSON(line).rel==="Strip Poker de Luxe_artwork_thumb.jpg")
			seenLastLine = true;
	};

	await runUtil.run("gunzip", ["-c", path.join(xu.dirname(import.meta), "files", "468.jsonl.gz")], {stdoutcb});

	assertStrictEquals(lineCount, 11);
	assertStrictEquals(seenLastLine, true);
});

Deno.test("stderr", async () =>
{
	const {stdout, stderr, status} = await runUtil.run("cat", ["/tmp/ANonExistantFile_omg this isn't here"]);
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr, `cat: "/tmp/ANonExistantFile_omg this isn't here": No such file or directory\n`);
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 1);
});

Deno.test("stdoutFilePath", async () =>
{
	let outFilePath = await fileUtil.genTempPath();
	await runUtil.run("uname", [], {stdoutFilePath : outFilePath});
	assertStrictEquals(await fileUtil.readTextFile(outFilePath), "Linux\n");
	await fileUtil.unlink(outFilePath);

	outFilePath = await fileUtil.genTempPath(undefined, ".pnm");
	await runUtil.run("view64pnm", [path.join(xu.dirname(import.meta), "files", "Alid.ism")], {stdoutFilePath : outFilePath});
	assertStrictEquals((await Deno.stat(outFilePath)).size, 192_015);
	await fileUtil.unlink(outFilePath);
});

Deno.test("stderrFilePath", async () =>
{
	const outFilePath = await fileUtil.genTempPath();
	await runUtil.run("cat", ["/tmp/ANonExistantFile_omg this isn't here"], {stderrFilePath : outFilePath});
	assertStrictEquals(await fileUtil.readTextFile(outFilePath), `cat: "/tmp/ANonExistantFile_omg this isn't here": No such file or directory\n`);
	await fileUtil.unlink(outFilePath);
});

Deno.test("manyInstances", async () =>
{
	const results = (await Promise.all([].pushSequence(1, 1000).map(() => runUtil.run("time", ["sleep", Math.randomInt(1, 3)])))).map(o => o.stderr);
	assertStrictEquals(results.filter(result => result.includes("elapsed")).length, 1000);
});

Deno.test("manyInstances-virtualX", async () =>
{
	const results = (await Promise.all([].pushSequence(1, 1000).map(() => runUtil.run("xclock", ["--help"], {virtualX : true})))).map(o => o.stderr);
	assertStrictEquals(results.filter(result => result.startsWith("Usage: xclock")).length, 1000);
});

Deno.test("stdinFullBuffer", async () =>
{
	// ensure the full buffer of search.lst is sent to iconv, otherwise the result is truncated
	const {stdout} = await runUtil.run("iconv", ["-c", "-f", "CP437", "-t", "UTF-8"], {stdinData : await Deno.readFile(path.join(path.dirname(path.fromFileUrl(import.meta.url)), "files", "search.lst"))});
	assertStrictEquals(stdout.length, 82995);
});

Deno.test("stdinFilePath", async () =>
{
	const outFilePath = await fileUtil.genTempPath();
	await runUtil.run("zlib-flate", ["-uncompress"], {stdoutFilePath : outFilePath, stdinFilePath : path.join(xu.dirname(import.meta), "files", "test.zlib")});
	assertStrictEquals(Deno.statSync(outFilePath).size, 15302);
	await fileUtil.unlink(outFilePath);
});

Deno.test("stdinData", async () =>
{
	const msg = "this is just a hello world test";
	const {stdout} = await runUtil.run("deno", [], {stdinData : `console.log("${msg}")`});
	assert(stdout.includes(msg));
});

Deno.test("timeout", async () =>
{
	const beforeTime = performance.now();
	const {status, timedOut} = await runUtil.run("sleep", [30], {timeout : xu.SECOND*2});
	assertStrictEquals(timedOut, true);
	assertStrictEquals(status.signal, 15);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);
});

Deno.test("timeout-detached", async () =>
{
	const beforeTime = performance.now();
	const {cb} = await runUtil.run("sleep", [30], {detached : true, timeout : xu.SECOND*2});
	const {status} = await cb();
	assertStrictEquals(status.signal, 15);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);
});

Deno.test("virtualX-single", async () =>
{
	let {stderr} = await runUtil.run("xclock", ["--help"], {timeout : xu.SECOND*2});
	assertStrictEquals(stderr.includes("Can't open display"), true, stderr);
	({stderr} = await runUtil.run("xclock", ["--help"], {virtualX : true}));
	assertStrictEquals(stderr.startsWith("Usage: xclock"), true, stderr);
});

Deno.test("detached-killExternal", async () =>
{
	let beforeTime = performance.now();
	const {p, xvfbPort} = await runUtil.run("sleep", [30], {detached : true, virtualX : true});
	assert(xvfbPort>0);
	assert((performance.now()-beforeTime)<xu.SECOND);
	beforeTime = performance.now();
	await delay(xu.SECOND*3);
	await runUtil.kill(p);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 3);
	await delay(xu.SECOND);	// this gives the internal runUtil detached detector a chance to cleanup things
});

Deno.test("detached-output", async () =>
{
	const {cb} = await runUtil.run("time", ["sleep", 1], {detached : true});
	const {status, stdout, stderr} = await cb();
	assertEquals(status, {success : true, code : 0});
	assertStrictEquals(stdout, "");
	assert(stderr.includes("elapsed"));
});

Deno.test("detached-partial", async () =>
{
	const {p} = await runUtil.run("time", ["sleep", 1], {detached : true});
	const stderr = await p.stderrOutput();
	assert(stderr.length>100);
});

Deno.test("customHomeENV", async () =>
{
	let {stdout} = await runUtil.run("sh", ["-c", "cd ~ && pwd"]);
	assertStrictEquals(stdout.trim(), "/home/sembiance");
	({stdout} = await runUtil.run("sh", ["-c", "cd ~ && pwd"], {env : {HOME : "/tmp"}}));
	assertStrictEquals(stdout.trim(), "/tmp");
});
