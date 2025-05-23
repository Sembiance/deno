import {xu, fg} from "xu";
import {XLog} from "./xlog.js";
import {assertStrictEquals, delay, assert} from "std";
import {fileUtil} from "xutil";

Deno.test("clone", () =>
{
	const xlog = new XLog("info", {includeDateTime : true});
	const xlogClone = xlog.clone();
	assertStrictEquals(xlog.level, xlogClone.level);
	assertStrictEquals(xlog.logFilePath, xlogClone.logFilePath);
	assertStrictEquals(xlog.noANSI, xlogClone.noANSI);
	assertStrictEquals(xlog.includeDateTime, xlogClone.includeDateTime);
	assert(xlog!==xlogClone);
});

Deno.test("dateTime", () =>
{
	const xlog = new XLog("info", {includeDateTime : true});
	xlog.info`info message, WITH DATETIME`;
});

Deno.test("elapsed", async () =>
{
	const xlog = new XLog();
	xlog.timeStart`This is a ${"test"} of the start ${47} time system`;
	xlog.elapsed`Should be zero ${0} seconds elapsed`;
	await delay(1000);
	xlog.elapsed`Should be one ${1} second elapsed`;
	await delay(Math.randomInt(200, 800));
	xlog.elapsed`Should be between ${200} and ${800} ms elapsed`;
	await delay(Math.randomInt(200, 800));
	xlog.elapsed`Should be between ${200} and ${800} ms elapsed`;
	await delay(Math.randomInt(200, 800));
	xlog.elapsed`Should be between ${200} and ${800} ms elapsed`;
	await delay(Math.randomInt(200, 800));
	xlog.elapsed`Should be between ${200} and ${800} ms elapsed`;
});

Deno.test("flush", async () =>
{
	const logFilePath = await fileUtil.genTempPath();
	const xlog = new XLog(undefined, {logFilePath});
	xlog.warn`\nxlog test message`;
	xlog.level = "trace";
	xlog.debug`xlog test message with string: ${"hello"}`;
	xlog.level = "none";
	xlog.fatal`nope, should not see`;
	if(xlog.atLeast("trace"))
		console.log("should NOT see");
	await xlog.flush(logFilePath);
	xlog.level = "trace";
	xlog.trace`xlog test message with number: ${47}`;
	await xlog.flush(logFilePath);

	const expectedLog = ["WARN: ", "xlog test message", "xlog.test.js: 46: xlog test message with string: hello", "xlog.test.js: 53: xlog test message with number: 47"];
	const debugLog = (await fileUtil.readTextFile(logFilePath)).trim().split("\n");
	await fileUtil.unlink(logFilePath);

	for(let i=0;i<debugLog.length;i++)
		assert(debugLog[i].endsWith(expectedLog[i]), `${i}: ${JSON.stringify(debugLog[i])} vs expected ${JSON.stringify(expectedLog[i])}`);

	xlog.cleanup();
});

Deno.test("flush-via-signal", async () =>
{
	const logFilePath = await fileUtil.genTempPath();
	const xlog = new XLog(undefined, {logFilePath});
	xlog.warn`\nxlog test message`;
	xlog.level = "trace";
	xlog.debug`xlog test message with string: ${"hello"}`;
	xlog.level = "none";
	xlog.fatal`nope, should not see`;
	if(xlog.atLeast("trace"))
		console.log("should NOT see");
	Deno.kill(Deno.pid, "SIGUSR2");
	await delay(1000);	// give the flush time to finish since we are doing it async via a kill SIGUSR2 signal
	xlog.level = "trace";
	xlog.trace`xlog test message with number: ${47}`;

	Deno.kill(Deno.pid, "SIGUSR2");
	await delay(1000);	// give the flush time to finish since we are doing it async via a kill SIGUSR2 signal

	const expectedLog = ["WARN: ", "xlog test message", "xlog.test.js: 72: xlog test message with string: hello", "xlog.test.js: 80: xlog test message with number: 47"];
	const debugLog = (await fileUtil.readTextFile(logFilePath)).trim().split("\n");
	await fileUtil.unlink(logFilePath);

	for(let i=0;i<debugLog.length;i++)
		assert(debugLog[i].endsWith(expectedLog[i]), `${i}: ${JSON.stringify(debugLog[i])} vs expected ${JSON.stringify(expectedLog[i])}`);

	xlog.cleanup();
});

Deno.test("logger", () =>
{
	const xlog = new XLog();
	const debugLog = [];
	xlog.logger = v => debugLog.push(v);
	xlog.warn`\nxlog test message`;
	xlog.level = "trace";
	xlog.debug`xlog test message with string: ${"hello"}`;
	xlog.trace`xlog test message with number: ${47}`;
	xlog.level = "none";
	xlog.fatal`nope, should not see`;
	if(xlog.atLeast("trace"))
		console.log("should NOT see");

	/* eslint-disable unicorn/escape-case, unicorn/no-hex-escape */
	const expectedLog = [
		"\x1b[93mWARN\x1b[0m\x1b[96m:\x1b[0m \nxlog test message",
		"ms\x1b[0m \x1b[90mxlog.test.js:102\x1b[0m\x1b[36m:\x1b[0m xlog test message with string: \x1b[32mhello\x1b[0m",
		"ms\x1b[0m \x1b[90mxlog.test.js:103\x1b[0m\x1b[36m:\x1b[0m xlog test message with number: \x1b[33m47\x1b[39m"
	];
	/* eslint-enable unicorn/escape-case, unicorn/no-hex-escape */
	for(let i=0;i<debugLog.length;i++)
		assert(debugLog[i].endsWith(expectedLog[i]), `${i}: ${JSON.stringify(debugLog[i])} vs expected  ${JSON.stringify(expectedLog[i])}`);
});

Deno.test("mapper", () =>
{
	const debugLog = [];
	const logger = v => debugLog.push(v);
	const mapper = v => `PREFIX ${v} SUFFIX`;
	const xlog = new XLog("info", {logger, mapper});
	xlog.info`hello world`;
	xlog.fatal`omg`;
	assertStrictEquals(debugLog.length, 2);
	assertStrictEquals(debugLog[0], "PREFIX hello world SUFFIX");
	assertStrictEquals(debugLog[1].decolor(), "FATAL: PREFIX omg SUFFIX");
});

Deno.test("noANSI", () =>
{
	const xlog = new XLog(undefined, {noANSI : true});
	assertStrictEquals(xlog.fatal`fatal no color message, ${fg.green("should see")}`, "FATAL: fatal no color message, should see");
});

Deno.test("xlog", () =>
{
	const xlog = new XLog();
	console.log("");
	xlog.fatal`fatal message, ${fg.green("should see")}`;
	xlog.error`error message, ${fg.green("should see")}`;
	xlog.warn`warn message, ${fg.green("should see")}`;
	xlog.info`info message, ${fg.green("should see")}`;
	xlog.debug`debug message, ${fg.red("should NOT see")}`;
	xlog.trace`trace message, ${fg.red("should NOT see")}`;
	if(xlog.atLeast("info"))
		console.log(`${fg.green("should see")}`);
	if(xlog.atLeast("debug"))
		console.log(`${fg.red("should NOT see")}`);
});
