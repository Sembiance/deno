import {xu} from "xu";
import * as sockUtil from "../sockUtil.js";
import {fileUtil} from "xutil";
import {assertStrictEquals} from "std";

Deno.test("listenUnix", async () =>
{
	const unixSockPath = await fileUtil.genTempPath(undefined, ".sock");
	let lineCount = 0;
	const lines = ["hello world", "hello world 2"];
	const {close} = await sockUtil.listen({transport : "unix", path : unixSockPath}, {linecb : (line, conn, connectionLineCount, serverLineCount) =>
	{
		assertStrictEquals(connectionLineCount, 0);
		assertStrictEquals(serverLineCount, lineCount++);
		assertStrictEquals(line, lines[serverLineCount]);
	}});

	await sockUtil.sendLine({transport : "unix", path : unixSockPath}, lines[0]);
	await sockUtil.sendLine({transport : "unix", path : unixSockPath}, lines[1]);
	await close();
});

Deno.test("sendReceiveLineUnix", async () =>
{
	const unixSockPath = await fileUtil.genTempPath(undefined, ".sock");
	const {close} = await sockUtil.listen({transport : "unix", path : unixSockPath}, {linecb : async (line, conn) => await new Blob([new TextEncoder().encode("World\n")]).stream().pipeTo(conn.writable, {preventClose : true})});
	assertStrictEquals(await sockUtil.sendReceiveLine({transport : "unix", path : unixSockPath}, "Hello"), "World");
	await close();
	console.log("This will fail due to some deno bug when piping through TextDecoderStream");
});
