import {xu} from "xu";
import * as unixSockUtil from "../unixSockUtil.js";
import {fileUtil} from "xutil";
import {assertStrictEquals, streams} from "std";
import {XLog} from "xlog";

Deno.test("listen", async () =>
{
	const unixSockPath = await fileUtil.genTempPath(undefined, ".sock");
	let lineCount = 0;
	const lines = ["hello world", "hello world 2"];
	const listener = await unixSockUtil.listen({unixSockPath, xlog : new XLog("none"), linecb : (line, conn, connectionLineCount, serverLineCount) =>
	{
		assertStrictEquals(connectionLineCount, 0);
		assertStrictEquals(serverLineCount, lineCount++);
		assertStrictEquals(line, lines[serverLineCount]);
	}});

	assertStrictEquals(await unixSockUtil.sendLine(unixSockPath, lines[0]), lines[0].length+1);
	assertStrictEquals(await unixSockUtil.sendLine(unixSockPath, lines[1]), lines[1].length+1);
	listener.close();
});

Deno.test("sendReceiveLine", async () =>
{
	const unixSockPath = await fileUtil.genTempPath(undefined, ".sock");
	const listener = await unixSockUtil.listen({unixSockPath, xlog : new XLog("none"), linecb : async (line, conn) => await streams.writeAll(conn, new TextEncoder().encode("World\n"))});
	assertStrictEquals(await unixSockUtil.sendReceiveLine(unixSockPath, "Hello"), "World");
	listener.close();
});
