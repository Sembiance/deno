import {xu} from "xu";
import * as sockUtil from "../sockUtil.js";
import {fileUtil} from "xutil";
import {assertStrictEquals, streams} from "std";

Deno.test("listenUnix", async () =>
{
	const unixSockPath = await fileUtil.genTempPath(undefined, ".sock");
	let lineCount = 0;
	const lines = ["hello world", "hello world 2"];
	const listener = await sockUtil.listen({transport : "unix", path : unixSockPath}, {linecb : (line, conn, connectionLineCount, serverLineCount) =>
	{
		assertStrictEquals(connectionLineCount, 0);
		assertStrictEquals(serverLineCount, lineCount++);
		assertStrictEquals(line, lines[serverLineCount]);
	}});

	assertStrictEquals(await sockUtil.sendLine({transport : "unix", path : unixSockPath}, lines[0]), lines[0].length+1);
	assertStrictEquals(await sockUtil.sendLine({transport : "unix", path : unixSockPath}, lines[1]), lines[1].length+1);
	listener.close();
});

Deno.test("sendReceiveLineUnix", async () =>
{
	const unixSockPath = await fileUtil.genTempPath(undefined, ".sock");
	const listener = await sockUtil.listen({transport : "unix", path : unixSockPath}, {linecb : async (line, conn) => await streams.writeAll(conn, new TextEncoder().encode("World\n"))});
	assertStrictEquals(await sockUtil.sendReceiveLine({transport : "unix", path : unixSockPath}, "Hello"), "World");
	listener.close();
});
