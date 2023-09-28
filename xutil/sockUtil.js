import {xu} from "xu";
import {fileUtil} from "xutil";
import {TextLineStream} from "std";

const textEncoder = new TextEncoder();

export async function listen(sock, {linecb, conncb})		// eslint-disable-line require-await
{
	let activeConnectionCount = 0;
	let serverLineCount = 0;
	const handleConnection = async function(conn)
	{
		activeConnectionCount++;

		if(conncb)
			await conncb(conn);
			
		if(linecb)
		{
			let connectionLineCount = 0;
			try
			{
				for await(const line of conn.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream()))
					await linecb(line, conn, connectionLineCount++, serverLineCount++);
			}
			catch {}
		}
		
		await conn.readable.cancel();

		activeConnectionCount--;
	};

	const listener = Deno.listen(sock);

	const acceptConnections = async function()
	{
		for await (const conn of listener)
			handleConnection(conn);
	};

	acceptConnections();

	const close = async () =>
	{
		try { listener.close(); }
		catch {}
		if(sock.path)
			await fileUtil.unlink(sock.path);
		await xu.waitUntil(() => activeConnectionCount===0);
	};

	return {close};
}

export async function sendLine(sock, line)
{
	await new Blob([textEncoder.encode(`${line}\n`)]).stream().pipeTo((await Deno.connect(sock)).writable);
}

export async function sendReceiveLine(sock, line)
{
	const conn = await Deno.connect(sock);
	await new Blob([textEncoder.encode(`${line}\n`)]).stream().pipeTo(conn.writable, {preventClose : true});
	
	let lineRead = null;
	const textDecoderStream = new TextDecoderStream();
	const textLineStream = new TextLineStream();
	for await(const l of conn.readable.pipeThrough(textDecoderStream).pipeThrough(textLineStream))	// eslint-disable-line no-unreachable-loop
	{
		lineRead = l;
		break;
	}

	await textLineStream.readable.cancel();
	await textDecoderStream.readable.cancel();
	await conn.readable.cancel();
	
	return lineRead;
}
