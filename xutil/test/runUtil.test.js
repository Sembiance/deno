import {xu} from "xu";
import {delay, assertStrictEquals, assertEquals, assert, path} from "std";
import * as runUtil from "../runUtil.js";
import * as fileUtil from "../fileUtil.js";
import {XLog} from "xlog";

Deno.test("status", async () =>
{
	let {status} = await runUtil.run("uname");
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);
	assertStrictEquals(status.signal, null);

	({status} = await runUtil.run("ls", ["/non/existant/file"]));
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 2);
	assertStrictEquals(status.signal, null);

	({status} = await runUtil.run("bash", ["-c", "exit 47"]));
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 47);
	assertStrictEquals(status.signal, null);
});

Deno.test("stdoutBasic", async () =>
{
	const {stdout} = await runUtil.run("uname");
	assertStrictEquals(stdout, "Linux\n");
});

Deno.test("stdoutNull", async () =>
{
	const {status} = await runUtil.run("ls", ["/non/existant/file"], {stdoutNull : true, stderrNull : true});
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 2);
	assertStrictEquals(status.signal, null);
});

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

Deno.test("env", async () =>
{
	const {stdout} = await runUtil.run("printenv", [], {env : {RUNUTIL_ENV_TEST : 47}});
	assertStrictEquals(stdout.includes("RUNUTIL_ENV_TEST=47"), true);
});

Deno.test("inheritEnvNoUndefined", async () =>
{
	const {stdout} = await runUtil.run("/usr/bin/printenv", [], {inheritEnv : ["NOSUCHVAR", "USER"]});
	assertStrictEquals(stdout.includes(`USER=${(await runUtil.run("whoami")).stdout.trim()}`), true);
	assert(!stdout.includes("NOSUCHVAR"));
});

Deno.test("limitRAM", async () =>
{
	const {stdout, status} = await runUtil.run(path.join(import.meta.dirname, "consumeRAM.sh"), [], {limitRAM : xu.MB*250});
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 2);
	const lastUsed = +stdout.trim().split("\n").at(-1);
	assert(lastUsed>249_000);
	assert(lastUsed<251_000);
});


Deno.test("liveOutput", async () =>
{
	const {stdout, stderr, status} = await runUtil.run("echo", ["\nLive Output Test. Normal to see this message.\n"], {liveOutput : true});
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr.length, 0);
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);
});

Deno.test("stdout-encoding", async () =>
{
	// unlzx not always installed
	//let {stdout} = await runUtil.run("unlzx", ["-v", path.join(import.meta.dirname, "files", "test.lzx")], {stdoutEncoding : "latin1"});
	//assert(stdout.includes("mod._¡TSA!_Aiguanaguoman_v1.43"));

	const {stdout} = await runUtil.run("unzip", ["-qz", path.join(import.meta.dirname, "files", "p205.zip")], {stdoutEncoding : "CP437"});
	assert(stdout.includes("│ ▄▄▄   ▄▄     ▄▄▄   ─────────────────────────            Winston-Salem, NC │"));
});

Deno.test("xlog", async () =>
{
	const xlogLines = [];
	const xlog = new XLog("info", {logger : line => xlogLines.push(line), noANSI : true});
	await runUtil.run("deno", ["--quiet"], {xlog, stdinData : `console.log("stdout"); console.error("stderr");`});
	assert(xlogLines.find(line => line==="stdout"));
	assert(xlogLines.find(line => line==="WARN: stderr"));
});

Deno.test("stdoutUnbuffered", async () =>
{
	if(!await fileUtil.exists("/usr/bin/zxtune123"))
	{
		console.log("Skipping test because zxtune123 is not installed");
		return;
	}

	let {stdout} = await runUtil.run("zxtune123", ["--file", path.join(import.meta.dirname, "files", "m-fuyu.ssf"), "--null", "--quiet"], {timeout : xu.SECOND*2});
	assertStrictEquals(stdout?.length, 0);
	({stdout} = await runUtil.run("zxtune123", ["--file", path.join(import.meta.dirname, "files", "m-fuyu.ssf"), "--null", "--quiet"], {timeout : xu.SECOND*2, stdoutUnbuffer : true}));
	assertStrictEquals(stdout.includes("Romance of the Three Kingdoms"), true);
});

Deno.test("stdoutcb1", async () =>
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
	const stdoutcb = async (line, p) =>	// eslint-disable-line require-await
	{
		assert(p!==undefined);
		lineCount++;
		if(xu.parseJSON(line).rel==="Strip Poker de Luxe_artwork_thumb.jpg")
			seenLastLine = true;
	};

	await runUtil.run("gunzip", ["-c", path.join(import.meta.dirname, "files", "468.jsonl.gz")], {stdoutcb});

	assertStrictEquals(lineCount, 11);
	assertStrictEquals(seenLastLine, true);
});

Deno.test("stderrBasic", async () =>
{
	const {stdout, stderr, status} = await runUtil.run("/bin/cat", ["/tmp/ANonExistantFile_omg this isn't here"]);
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr, `/bin/cat: "/tmp/ANonExistantFile_omg this isn't here": No such file or directory\n`);
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 1);
});

Deno.test("stdoutFilePathBasic", async () =>
{
	const outFilePath = await fileUtil.genTempPath();
	await runUtil.run("uname", [], {stdoutFilePath : outFilePath});
	assertStrictEquals(await fileUtil.readTextFile(outFilePath), "Linux\n");
	await fileUtil.unlink(outFilePath);

	// view64pnm not always installed
	//outFilePath = await fileUtil.genTempPath(undefined, ".pnm");
	//await runUtil.run("view64pnm", [path.join(import.meta.dirname, "files", "Alid.ism")], {stdoutFilePath : outFilePath});
	//assertStrictEquals((await Deno.stat(outFilePath)).size, 192_015);
	//await fileUtil.unlink(outFilePath);
});

Deno.test("stdoutFilePathRelative", async () =>
{
	const outDirPath = await fileUtil.genTempPath();
	await Deno.mkdir(outDirPath, {recursive : true});
	const outFilePath = await fileUtil.genTempPath(outDirPath);
	await runUtil.run("uname", [], {stdoutFilePath : path.basename(outFilePath), cwd : outDirPath});
	assertStrictEquals(await fileUtil.readTextFile(outFilePath), "Linux\n");
	await fileUtil.unlink(outDirPath, {recursive : true});
});

Deno.test("stderrFilePath", async () =>
{
	const outFilePath = await fileUtil.genTempPath();
	await runUtil.run("/bin/cat", ["/tmp/ANonExistantFile_omg this isn't here"], {stderrFilePath : outFilePath});
	assertStrictEquals(await fileUtil.readTextFile(outFilePath), `/bin/cat: "/tmp/ANonExistantFile_omg this isn't here": No such file or directory\n`);
	await fileUtil.unlink(outFilePath);
});

Deno.test("manyInstances-normal", async () =>
{
	const results = (await Promise.all([].pushSequence(1, 1000).map(() => runUtil.run("time", ["sleep", Math.randomInt(1, 3)])))).map(o => o.stderr);
	assertStrictEquals(results.filter(result => result.includes("elapsed")).length, 1000);
});

Deno.test("manyInstances-virtualX", async () =>
{
	const results = (await Promise.all([].pushSequence(1, 1000).map(() => runUtil.run("/usr/bin/xclock", ["--help"], {virtualX : true})))).map(o => o.stderr);
	assertStrictEquals(results.filter(result => result.startsWith("Usage: /usr/bin/xclock")).length, 1000);
});

Deno.test("virtualXGLX", async () =>
{
	const lines = (await runUtil.run("glxinfo", [], {virtualX : true, virtualXGLX : true}))?.stdout?.split("\n") || [];
	assert(lines.includes("direct rendering: Yes"));
	assert(lines.some(line => line.startsWith("OpenGL version string:")));
	assert(lines.some(line => line.startsWith("OpenGL renderer string:")));
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
	await runUtil.run("zlib-flate", ["-uncompress"], {stdoutFilePath : outFilePath, stdinFilePath : path.join(import.meta.dirname, "files", "test.zlib")});
	assertStrictEquals(Deno.statSync(outFilePath).size, 15302);
	await fileUtil.unlink(outFilePath);
});

Deno.test("stdinData-normal", async () =>
{
	const msg = "this is just a hello world test";
	const {stdout} = await runUtil.run("deno", [], {stdinData : `console.log("${msg}")`});
	assert(stdout.includes(msg));
});

Deno.test("stdinData-with-stdoutBlock", async () =>
{
	// Ok, so this is a weird one. 'petcat' will not accept any stdin data if you haven't started reading stdout data
	// This only happens on chatsubo, not on my local machine. I'm not sure why.
	// So I had to make sure that runUtil.run started reading stdout and stderr BEFORE it sent stdin data, which is probably how I should have been doing it all along anyways
	// This test just verifies this is working, but again it only fails on chatsubo, not on my local machine
	const {stdout} = await runUtil.run("petcat", ["-nh", "-text"], {stdinData : await Deno.readFile(path.join(import.meta.dirname, "files", "g>wellen"))});
	assertStrictEquals(stdout.length, 37552);
});

Deno.test("timeout-normal", async () =>
{
	const beforeTime = performance.now();
	const {status, timedOut} = await runUtil.run("sleep", [30], {timeout : xu.SECOND*2});
	assertStrictEquals(timedOut, true);
	assertStrictEquals(status.signal, "SIGTERM");
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);
});

Deno.test("timeout-detached", async () =>
{
	const beforeTime = performance.now();
	const {cb} = await runUtil.run("sleep", [30], {detached : true, timeout : xu.SECOND*2});
	const {status} = await cb();
	assertStrictEquals(status.signal, "SIGTERM");
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);
});

Deno.test("virtualX-single", async () =>
{
	let {stderr} = await runUtil.run("xclock", ["--help"], {timeout : xu.SECOND*2});
	assertStrictEquals(stderr.includes("Can't open display"), true, stderr);
	({stderr} = await runUtil.run("/usr/bin/xclock", ["--help"], {virtualX : true}));
	assertStrictEquals(stderr.startsWith("Usage: /usr/bin/xclock"), true, stderr);
});

Deno.test("virtualX-timeout", async () =>
{
	const {stdout, stderr} = await runUtil.run("xclock", [], {virtualX : true, timeout : xu.SECOND*3});
	assertStrictEquals(stdout, "");
	assertStrictEquals(stderr.includes("Missing charsets in String to Font"), true, stderr);
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
	assertEquals(status, {success : true, signal : null, code : 0});
	assertStrictEquals(stdout, "");
	assert(stderr.includes("elapsed"));
});


Deno.test("detached-exitcb", async () =>
{
	let finished = false;
	await runUtil.run("time", ["sleep", 1], {detached : true, exitcb : async status => { await delay(50); assertStrictEquals(status.success, true); assertStrictEquals(status.code, 0); finished = true; }});
	await delay(xu.SECOND*1.5);
	assertStrictEquals(finished, true);
});

Deno.test("detached-partial", async () =>
{
	const {cb} = await runUtil.run("time", ["sleep", "2"], {detached : true});
	const {stderr} = await cb();
	assert(stderr.length>100);
});

Deno.test("customHomeENV", async () =>
{
	let {stdout} = await runUtil.run("sh", ["-c", "cd ~ && pwd"]);
	assertStrictEquals(stdout.trim(), "/home/sembiance");
	({stdout} = await runUtil.run("sh", ["-c", "cd ~ && pwd"], {env : {HOME : "/tmp"}}));
	assertStrictEquals(stdout.trim(), "/tmp");
});

Deno.test("killChildrenBuiltin", async () =>
{
	const pids = [];
	await runUtil.run(path.join(import.meta.dirname, "files", "makeKids.sh"), [], {timeout : xu.SECOND*2, killChildren : true, stdoutcb : line => pids.push(line.trim())});

	for(const pid of pids)
	{
		const {stdout} = await runUtil.run("ps", ["--no-headers", "-p", pid, "-o", "pid"]);
		assert(!stdout.trim().length);
	}
});

Deno.test("killChildrenWithRunUtilKill", async () =>
{
	const pids = [];
	const {p} = await runUtil.run(path.join(import.meta.dirname, "files", "makeKids.sh"), [], {detached : true, stdoutcb : line => pids.push(line.trim())});
	await xu.waitUntil(() => pids.length===2);

	await delay(xu.SECOND);
	for(const pid of pids)
	{
		const {stdout} = await runUtil.run("ps", ["--no-headers", "-p", pid, "-o", "pid"]);
		assert(stdout.trim().length);
	}

	await delay(xu.SECOND*2);
	for(const pid of pids)
	{
		const {stdout} = await runUtil.run("ps", ["--no-headers", "-p", pid, "-o", "pid"]);
		assert(stdout.trim().length);
	}

	await runUtil.kill(p, undefined, {killChildren : true});
	await delay(xu.SECOND);

	for(const pid of pids)
	{
		const {stdout} = await runUtil.run("ps", ["--no-headers", "-p", pid, "-o", "pid"]);
		assert(!stdout.trim().length);
	}
});

Deno.test("getXVFBNum", async () =>
{
	const xvfbNum = await runUtil.getXVFBNum();
	assert(xvfbNum>10);
});
