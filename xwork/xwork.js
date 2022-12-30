import {xu} from "xu";
import {fileUtil, runUtil, unixSockUtil} from "xutil";
import {streams, readLines} from "std";

const xwork = {};

/** THESE ARE ALL CALLED BY THE INDIVIDUAL WORKERS, DO NOT CALL THESE AS THE PARENT */
xwork.arg = async function arg() { return xu.parseJSON(await unixSockUtil.sendReceiveLine(Deno.env.get("XWORK_SOCK_PATH"), JSON.stringify({op : "arg"})), []); };
xwork.done = async function done(msg) { return await unixSockUtil.sendLine(Deno.env.get("XWORK_SOCK_PATH"), JSON.stringify({op : "done", msg})); };

let workerMessages = [];
let workerConnection = null;
let recvAborted = false;
xwork.openConnection = async function openConnection()
{
	workerConnection = await Deno.connect({transport : "unix", path : Deno.env.get("XWORK_SOCK_PATH")});
	
	const receiveMessages = async function()
	{
		try
		{
			for await(const line of readLines(workerConnection))
				workerMessages.push(xu.parseJSON(line, {}));
		}
		catch {}
		
		try
		{
			workerConnection.close();
		}
		catch {}
		workerMessages = null;
	};

	receiveMessages();
	await streams.writeAll(workerConnection, new TextEncoder().encode(`${JSON.stringify({op : "ready"})}\n`));
};
xwork.closeConnection = function closeConnection() { workerConnection.close(); };
xwork.recv = async function recv(cb)
{
	while(workerMessages!==null)	// eslint-disable-line no-unmodified-loop-condition
	{
		await xu.waitUntil(() => workerMessages===null || workerMessages?.length>0);	// eslint-disable-line no-loop-func
		if(workerMessages===null)
			break;
		await Promise.race([cb(workerMessages.shift()), xu.waitUntil(async () => recvAborted)]);	// eslint-disable-line no-loop-func, require-await
		recvAborted = false;
	}
};
xwork.recvAbort = function recvAbort() { recvAborted = true; };		// called by a worker when the recv is stuck and needs to be aborted
xwork.send = async function send(msg) { await streams.writeAll(workerConnection, new TextEncoder().encode(`${JSON.stringify({op : "msg", msg})}\n`)); };

/** WHAT IS BELOW CAN BE CALLED BY THE PARENT */
// this will execute the given fun on a seperate deno instance entirely because Worker support in deno is prone to crashing and all sorts of nasty things
// this also allows 'inline' function execution on other threads via fun.toString()
// only supports passing a single argument (it used to support multiple, but it just got kinda gross and I don't need it)
xwork.run = async function run(fun, arg, {timeout, detached, imports={}, recvcb, exitcb, hideOutput, xlog, stderrcb, runArgs=[]}={})
{
	const xworkSockPath = await fileUtil.genTempPath(undefined, ".xwork.sock");
	
	let gotResult = false;
	let result = [];
	let workerMsgConn = null;
	const xworkSockServer = await unixSockUtil.listen({unixSockPath : xworkSockPath, linecb : async (line, conn) =>
	{
		const {op, msg} = xu.parseJSON(line, {});
		if(!op)
			return;
		
		// this is sent by a worker 'file' when they are done and are ready to return a result
		if(op==="done")
		{
			result = msg;
			xworkSockServer.close();
			gotResult = true;
			return;
		}

		// this is sent by a worker 'file' when they want to get their args
		if(op==="arg")
			await streams.writeAll(conn, new TextEncoder().encode(`${JSON.stringify(arg)}\n`));
		
		// this is sent by a worker (via xwork.send()) to send a message to the parent
		if(op==="msg" && recvcb)
			recvcb(msg);
		
		// this is sent by a detached worker when they are ready to receive messages
		if(op==="ready")
			workerMsgConn = conn;
	}});

	const runOpts = runUtil.denoRunOpts();
	runOpts.env.XWORK_SOCK_PATH = xworkSockPath;
	if(xlog)
	{
		runOpts.stdoutcb = line => xlog.info`${line}`;
		runOpts.stderrcb = line =>
		{
			if(stderrcb)
				stderrcb(line);
			xlog.warn`${line}`;
		};
	}
	else if(hideOutput)
	{
		runOpts.stdoutNull = true;
		runOpts.stderrNull = true;
	}
	else
	{
		runOpts.liveOutput = true;
	}

	let srcFilePath = fun;	// assume a filename
	if(typeof fun==="function")
	{
		const src =
		[
			`import {xu} from "xu";`,
			`import {xwork} from "xwork";`,
			`import {fileUtil} from "xutil";`,
			...Object.entries(imports).map(([pkg, imp]) => `import {${Array.force(imp).filter(v => v!=="fileUtil").join(", ")}} from "${pkg}";`)
		];

		if(detached)
			src.push(`await xwork.openConnection();`);

		srcFilePath = await fileUtil.genTempPath(undefined, ".xwork.js");
		const funSrc = fun.toString();
		src.push(fun.name ? funSrc : `const _xworkFun = ${funSrc}`);
		let execLine = `await xwork.done(`;
		if(funSrc.trim().startsWith("async"))
			execLine += "await ";
		execLine += fun.name || "_xworkFun";
		execLine += `(${arg===undefined ? undefined : JSON.stringify(arg)}));`;
		src.push(execLine);
	
		if(detached)
			src.push(`xwork.closeConnection();`, "Deno.exit()");

		await fileUtil.writeTextFile(srcFilePath, src.join("\n"));
	}

	if(timeout)
		runOpts.timeout = timeout;
	
	if(detached)
		runOpts.detached = true;
	
	let exited = false;
	let cleanup = null;
	const exitHandler = async status =>
	{
		xu.tryFallback(() => xworkSockServer.close());
		
		if(exitcb)
			await exitcb(status);

		exited = true;
		await cleanup(true);
	};
	runOpts.exitcb = exitHandler;
	
	const {p, cb, timedOut} = await runUtil.run("deno", runUtil.denoArgs(srcFilePath, ...runArgs), runOpts);
	if(timedOut)
	{
		xu.tryFallback(() => xworkSockServer.close());
		gotResult = true;
	}
	
	let cleanedUp = false;
	cleanup = async killed =>
	{
		if(cleanedUp)
			return;
		cleanedUp = true;

		if(xlog)
			xlog.trace`cleanup() called, killed=${killed}`;

		if(detached && !killed)
			await cb();
		if(typeof fun==="function")
			await fileUtil.unlink(srcFilePath, {recursive : true});
		if(killed || exited)
			return gotResult ? result : undefined;
		await xu.waitUntil(() => gotResult);
		return result;
	};

	if(!detached)
		return await cleanup();
	
	return {
		ready : async () => await xu.waitUntil(() => workerMsgConn!==null),
		done  : async () => await cleanup(),
		kill  : async () => await runUtil.kill(p, undefined, {killChildren : true}),
		send  : async msg =>
		{
			if(!workerMsgConn)
				throw new Error("Worker not ready to receive messages");
			
			await streams.writeAll(workerMsgConn, new TextEncoder().encode(`${JSON.stringify(msg)}\n`));
		}
	};
};

// this will map all the values in arr calling externally fun for each value
xwork.map = async function map(arr, fun, {atOnce=navigator.hardwareConcurrency, cb, ...rest}={})
{
	// no idea why I have these two lines, they don't make any sense to me
	//if(atOnce<1)
	//	atOnce = navigator.hardwareConcurrency*atOnce;	// eslint-disable-line no-param-reassign

	return await arr.parallelMap(async (arg, i) =>
	{
		const r = await xwork.run(fun, [arg], rest);
		if(cb)
			await cb(r, i);
		return r;
	}, atOnce);
};

export {xwork};
