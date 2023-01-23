import {xu} from "xu";
import {fileUtil} from "xutil";
import {readLines} from "std";

const textEncoder = new TextEncoder();

export async function listen(sock, {linecb, conncb})		// eslint-disable-line require-await
{
	let serverLineCount = 0;
	const handleConnection = async function(conn)
	{
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
		
		conn.close();
	};

	const listener = Deno.listen(sock);

	const acceptConnections = async function()
	{
		for await (const conn of listener)
			handleConnection(conn);

		if(sock.path)
			await fileUtil.unlink(sock.path);
	};

	acceptConnections();

	return listener;
}

export async function sendLine(sock, line)
{
	const conn = await Deno.connect(sock);
	const bytesWrote = await conn.write(textEncoder.encode(`${line}\n`));
	conn.close();
	return bytesWrote;
}

export async function sendReceiveLine(sock, line)
{
	const conn = await Deno.connect(sock);
	await conn.write(textEncoder.encode(`${line}\n`));
	
	let lineRead = null;
	for await(const l of readLines(conn))	// eslint-disable-line no-unreachable-loop
	{
		lineRead = l;
		break;
	}

	conn.close();
	return lineRead;
}
