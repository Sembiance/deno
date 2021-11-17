import {assertStrictEquals, assert} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import {xu} from "xu";
import * as runUtil from "../runUtil.js";
import * as fileUtil from "../fileUtil.js";
import { delay } from "https://deno.land/std@0.111.0/async/mod.ts";

Deno.test("run", async () =>
{
	// cwd
	let {stdout, stderr, status} = await runUtil.run("cat", ["hosts"], {cwd : "/etc"});
	assertStrictEquals(stderr.length, 0);
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);
	assertStrictEquals(stdout.length>0, true);
	assertStrictEquals(stdout.includes("127.0.0.1"), true);
	assertStrictEquals(stdout.includes("localhost"), true);

	// env
	({stdout} = await runUtil.run("printenv", [], {env : {RUNUTIL_ENV_TEST : 47}}));
	assertStrictEquals(stdout.includes("RUNUTIL_ENV_TEST=47"), true);

	// liveOutput
	({stdout, stderr, status} = await runUtil.run("echo", ["\nLive Output Test. Normal to see this message.\n"], {liveOutput : true}));
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr.length, 0);
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);
	
	// stdout
	({stdout} = await runUtil.run("uname"));
	assertStrictEquals(stdout, "Linux\n");

	// stderr
	const stderrResult = `cat: "/tmp/ANonExistantFile_omg this isn't here": No such file or directory\n`;
	({stdout, stderr, status} = await runUtil.run("cat", ["/tmp/ANonExistantFile_omg this isn't here"]));
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr, stderrResult);
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 1);

	// stdoutFilePath
	let outFilePath = await fileUtil.genTempPath();
	await runUtil.run("uname", [], {stdoutFilePath : outFilePath});
	assertStrictEquals(await fileUtil.readFile(outFilePath), "Linux\n");
	await fileUtil.unlink(outFilePath);

	// stderrFilePath
	outFilePath = await fileUtil.genTempPath();
	await runUtil.run("cat", ["/tmp/ANonExistantFile_omg this isn't here"], {stderrFilePath : outFilePath});
	assertStrictEquals(await fileUtil.readFile(outFilePath), stderrResult);
	await fileUtil.unlink(outFilePath);

	// timeout
	let beforeTime = performance.now();
	let timedOut = undefined;
	({stdout, stderr, status, timedOut} = await runUtil.run("sleep", [30], {timeout : xu.SECOND*2}));
	assertStrictEquals(timedOut, true);
	assertStrictEquals(status.signal, 15);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);

	// timeout (detached)
	beforeTime = performance.now();
	timedOut = undefined;
	let {p} = await runUtil.run("sleep", [30], {detached : true, timeout : xu.SECOND*2});
	const s = await p.status();
	assertStrictEquals(s.signal, 15);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 2);

	// virtualX
	({stderr} = await runUtil.run("drawview", ["--help"], {timeout : xu.SECOND*2}));
	assertStrictEquals(stderr.includes("could not connect to display"), true, stderr);
	({stdout} = await runUtil.run("drawview", ["--help"], {inheritEnv : true, virtualX : true}));
	assertStrictEquals(stdout.startsWith("Usage: drawview "), true, stderr);

	// detached
	beforeTime = performance.now();
	({p} = await runUtil.run("sleep", [30], {detached : true, virtualX : true}));
	assert((performance.now()-beforeTime)<xu.SECOND);
	beforeTime = performance.now();
	await delay(xu.SECOND*3);
	assertStrictEquals(Math.round((performance.now()-beforeTime)/xu.SECOND), 3);
	p.kill("SIGTERM");
	p.close();

	// custom home env
	({stdout} = await runUtil.run("sh", ["-c", "cd ~ && pwd"]));
	assertStrictEquals(stdout.trim(), "/home/sembiance");
	({stdout} = await runUtil.run("sh", ["-c", "cd ~ && pwd"], {env : {HOME : "/tmp"}}));
	assertStrictEquals(stdout.trim(), "/tmp");
});
