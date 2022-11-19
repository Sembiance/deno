import {xu} from "xu";
import {fileUtil} from "xutil";
import {readLines} from "std";
import {XLog} from "xlog";

export async function listen({unixSockPath, linecb, conncb, xlog=new XLog("none")})		// eslint-disable-line require-await
{
	let serverLineCount = 0;
	const handleConnection = async function(conn)
	{
		xlog.debug`Connection ${conn.rid} accepted!`;

		if(conncb)
			await conncb(conn);
		
		if(linecb)
		{
			let connectionLineCount = 0;
			try
			{
				for await(const line of readLines(conn))
					await linecb(line, conn, connectionLineCount++, serverLineCount++);
			}
			catch {}
		}
		
		xlog.debug`Connection ${conn.rid} closed!`;
		conn.close();
	};

	const listener = Deno.listen({transport : "unix", path : unixSockPath});
	xlog.debug`Listener ${listener.rid} on started!`;

	const acceptConnections = async function()
	{
		for await (const conn of listener)
			handleConnection(conn);

		xlog.debug`Listener ${listener.rid} closed!`;
		await fileUtil.unlink(unixSockPath);
	};

	acceptConnections();

	return listener;
}

export async function sendLine(unixSockPath, line)
{
	const conn = await Deno.connect({transport : "unix", path : unixSockPath});
	const bytesWrote = await conn.write(new TextEncoder().encode(`${line}\n`));
	conn.close();
	return bytesWrote;
}

export async function sendReceiveLine(unixSockPath, line)
{
	const conn = await Deno.connect({transport : "unix", path : unixSockPath});
	await conn.write(new TextEncoder().encode(`${line}\n`));
	
	let lineRead = null;
	for await(const l of readLines(conn))	// eslint-disable-line no-unreachable-loop
	{
		lineRead = l;
		break;
	}

	conn.close();
	return lineRead;
}
