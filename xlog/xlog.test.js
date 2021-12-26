import {xu, fg} from "xu";
import {XLog} from "./xlog.js";
import {assertEquals, assertStrictEquals, delay} from "std";
import {fileUtil} from "xutil";

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
	assertEquals(debugLog, ["\x1b[93mWARN\x1b[0m\x1b[96m:\x1b[0m \nxlog test message", "\x1b[90mxlog.test.js: 13\x1b[0m\x1b[36m:\x1b[0m xlog test message with string: \x1b[32mhello\x1b[0m", "\x1b[90mxlog.test.js: 14\x1b[0m\x1b[36m:\x1b[0m xlog test message with number: \x1b[33m47\x1b[39m"]);	// eslint-disable-line unicorn/escape-case, unicorn/no-hex-escape, max-len
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

	assertEquals(await Deno.readTextFile(logFilePath), "WARN: \nxlog test message\nxlog.test.js: 41: xlog test message with string: hello\nxlog.test.js: 48: xlog test message with number: 47\n");
	await fileUtil.unlink(logFilePath);
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

	assertEquals(await Deno.readTextFile(logFilePath), "WARN: \nxlog test message\nxlog.test.js: 62: xlog test message with string: hello\nxlog.test.js: 70: xlog test message with number: 47\n");
	await fileUtil.unlink(logFilePath);
	xlog.cleanup();
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
