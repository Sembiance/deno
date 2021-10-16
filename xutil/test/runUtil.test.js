import {assertStrictEquals} from "https://deno.land/std@0.111.0/testing/asserts.ts";
import * as runUtil from "../runUtil.js";

Deno.test("run", async () =>
{
	let {stdout, stderr, status} = await runUtil.run("uname");
	assertStrictEquals(stdout, "Linux\n");
	assertStrictEquals(stderr.length, 0);
	assertStrictEquals(status.success, true);
	assertStrictEquals(status.code, 0);

	({stdout, stderr, status} = await runUtil.run("cat", ["/tmp/ANonExistantFile_omg this isn't here"]));
	assertStrictEquals(stdout.length, 0);
	assertStrictEquals(stderr, `cat: "/tmp/ANonExistantFile_omg this isn't here": No such file or directory\n`);
	assertStrictEquals(status.success, false);
	assertStrictEquals(status.code, 1);

	const p = await runUtil.run("sleep", [2000], {detached : true});
	({stdout, stderr, status} = await runUtil.run("ps", ["-p", `${p.pid}`, "-o", "comm="]));
	assertStrictEquals(stdout, "sleep\n");

	p.kill("SIGKILL");
	({stdout, stderr, status} = await runUtil.run("ps", ["-p", `${p.pid}`, "-o", "comm="]));
	assertStrictEquals(stdout, "sleep <defunct>\n");

	status = await p.status();
	assertStrictEquals(status.signal, 9);

	({stdout, stderr, status} = await runUtil.run("ps", ["-p", `${p.pid}`, "-o", "comm="]));
	assertStrictEquals(status.code, 1);
	assertStrictEquals(stdout.length, 0);

	p.close();

	// TODO add test for timeout
});
