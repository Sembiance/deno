/* eslint-disable brace-style */
import {xu, fg} from "xu";
import * as fileUtil from "./fileUtil.js";
import * as encodeUtil from "./encodeUtil.js";
import {path, readLines, streams} from "std";

/** Will run the given cmd and pass it the given args.
 * Options:
 *   cwd				The current working directory to run the program in
 *   detached			Don't wait for the command to finish, return the Process once launched
 *   env				An object of key : value pairs to be addded to the environment
 *   exitcb				A callback to be called when the process exits, useful in detached mode
 *   inheritEnv         Set to true to inherit ALL env from current user or an array of keys to inherit. Default (see below)
 *   killChildren		Kill children of the process as well
 *   liveOutput			All stdout/stderr from subprocess will be output on our main outputs
 *   stdinPipe          If set to true, then stdin for the process will be set up as a pipe
 *	 stdinData          If set, this will be sent to stdin
 *   stdoutEncoding		If set, stdout will be decoded as this. Pass "binary" for raw UInt8Array data. Default: utf-8
 *   stderrEncoding		If set, stderr will be decoded as this. Pass "binary" for raw UInt8Array data. Default: utf-8
 *   stdinFilePath		If set, the data in the file path specified will be piped to the process stdin
 *   stdoutFilePath		If set, stdout will be redirected and written to the file path specified
 *   stderrFilePath		If set, stderr will be redirected and written to the file path specified
 *   stdoutcb			If set, this function will be called for every 'line' read from stdout
 *   stderrcb			If set, this function will be called for every 'line' read from stderr
 *   stdoutNull			If set, stdout will be set to "null" thus preventing any output from being buffered.
 *   stderrNull			If set, stderr will be set to "null" thus preventing any output from being buffered.
 *   timeout			Number of 'ms' to allow the process to run and then terminate it
 *   timeoutSignal		What kill signal to send when the timeout elapses. Default: SIGTERM
 *   verbose            Set to true to output some details about the program
 *   virtualX			If set, a virtual X environment will be created using Xvfb and the program run with that as the DISPLAY
 *   virtualXGLX		Same as virtualX except the GLX extension will be enabled
 *   xlog               If set, stdout/stderr will be redirected to the logger
 */
export async function run(cmd, args=[], {cwd, detached, env, inheritEnv=["PATH", "HOME", "USER", "LOGNAME", "LANG", "LC_COLLATE"], killChildren, liveOutput, exitcb,
	stdinPipe, stdinData, stdinFilePath,
	stdoutNull, stderrNull,
	stdoutEncoding="utf-8", stdoutFilePath, stdoutcb,
	stderrEncoding="utf-8", stderrFilePath, stderrcb,
	timeout, timeoutSignal="SIGTERM", verbose, virtualX, virtualXGLX, xlog}={})
{
	const runArgs = {cmd : [cmd, ...args.map(v => (typeof v!=="string" ? v.toString() : v))], stdout : "piped", stderr : "piped", stdin : ((stdinPipe || stdinData || stdinFilePath) ? "piped" : "null")};

	if(inheritEnv!==true)
	{
		runArgs.clearEnv = true;
		if(Array.isArray(inheritEnv))
			runArgs.env = Object.fromEntries(inheritEnv.map(k => [k, Deno.env.get(k)]));
	}
	
	if(env)
	{
		runArgs.env ||= {};
		Object.assign(runArgs.env, Object.fromEntries(Object.entries(env).map(([k, v]) => ([k, v.toString()]))));
	}

	if(cwd)
		runArgs.cwd = cwd;
	
	if(liveOutput)
	{
		runArgs.stdout = "inherit";
		runArgs.stderr = "inherit";
	}

	// stdoutFilePath will override stdout liveOutput
	if(stdoutFilePath)
	{
		const stdoutFile = await Deno.open(stdoutFilePath.startsWith("/") ? stdoutFilePath : path.join(runArgs.cwd || Deno.cwd(), stdoutFilePath), {write : true, createNew : true});
		runArgs.stdout = stdoutFile.rid;
	}

	// stderrFilePath will override stderr liveOutput
	if(stderrFilePath)
	{
		const stderrFile = await Deno.open(stderrFilePath.startsWith("/") ? stderrFilePath : path.join(runArgs.cwd || Deno.cwd(), stderrFilePath), {write : true, createNew : true});
		runArgs.stderr = stderrFile.rid;
	}

	if(stdoutNull)
		runArgs.stdout = "null";
	if(stderrNull)
		runArgs.stderr = "null";

	let xvfbProc = null;
	let xvfbPort = null;
	if(virtualX || virtualXGLX)
	{
		xvfbPort = await xu.tryFallbackAsync(async () => +(await (await fetch("http://127.0.0.1:21787/getNum")).text()).trim(), Math.randomInt(10, 59999));
		const xvfbArgs = [`:${xvfbPort}`, `${virtualXGLX ? "+" : "-"}extension`, "GLX", "-nolisten", "tcp", "-nocursor", "-ac"];
		xvfbArgs.push("-xkbdir", "/usr/share/X11/xkb");	// Gentoo puts the xkb files here
		xvfbArgs.push("-screen", "0", "1920x1080x24");
		xvfbProc = Deno.run({cmd : ["Xvfb", ...xvfbArgs], clearEnv : true, stdout : "null", stderr : "null", stdin : "null"});
	
		if(!await xu.waitUntil(async () => !!(await fileUtil.exists(`/tmp/.X11-unix/X${xvfbPort}`)), {timeout : xu.SECOND*20}))
			throw new Error(`virtualX requested for cmd \`${cmd}\`, ran \`Xvfb ${xvfbArgs.join(" ")}\` but failed to find X11 sock file within 20 seconds`);

		runArgs.env ||= {};
		runArgs.env.DISPLAY = `:${xvfbPort}`;
	}

	if(verbose)
		console.log(`runUtil.run running \`${fg.orange(runArgs.cmd[0])} ${runArgs.cmd.slice(1).map(v => (v.includes(" ") ? `"${v}"` : v)).join(" ")}\` with options ${xu.inspect({...runArgs, cmd : []}).squeeze()}`);

	// Kick off the process
	if(cwd && !(await fileUtil.exists(cwd)))
		await Deno.mkdir(cwd, {recursive : true});

	const p = Deno.run(runArgs);

	// Start our timer
	let timerid = null;
	async function timeoutHandler()
	{
		if(killChildren)	// requires kernel CONFIG_PROC_CHILDREN
		{
			const kids = [];
			const getKids = async (pid, depth=0) =>
			{
				// get pid tids (task ids)
				const tids = (await fileUtil.tree(`/proc/${pid}/task`, {depth : 1, nofile : true})).map(tidPath => path.basename(tidPath));
				await tids.parallelMap(async tid =>
				{
					// get the children pids of the tid
					const tidPidsRaw = (await fileUtil.readTextFile(`/proc/${pid}/task/${tid}/children`)).trim();
					if(tidPidsRaw.length===0)
						return;
					const tidPids = tidPidsRaw.split(" ");
					await tidPids.parallelMap(async tidPid => await getKids(tidPid, depth+1));
					kids.push(...tidPids.map(tidPid => ({pid : tidPid, depth})));
				});
			};

			await getKids(p.pid).catch(() => {});

			// sort the kids so that we kill the deepest ones first
			kids.sortMulti([({depth}) => depth], [true]).map(({pid}) => pid).forEach(pid =>
			{
				try { Deno.kill(pid, timeoutSignal); } catch {}
			});
		}
		try { p.kill(timeoutSignal); } catch {}
		if(xvfbProc)
		{
			await kill(xvfbProc, "SIGKILL");
			xvfbProc = null;
		}
		timerid = true;
	}
	if(timeout)
		timerid = setTimeout(timeoutHandler, timeout);

	const lineReader = async function(reader, cb)
	{
		for await(const line of readLines(reader))
			await cb(line);
		reader.close();
	};

	const stdoutcbPromise = stdoutcb || xlog ? lineReader(p.stdout, stdoutcb || (line => xlog.info`${line}`)) : null;
	const stderrcbPromise = stderrcb || xlog ? lineReader(p.stderr, stderrcb || (line => xlog.warn`${line}`)) : null;

	let cbCalled = false;
	const cb = async () =>
	{
		if(cbCalled)
			return;

		cbCalled = true;

		// Create our stdout/stderr promises which will either be a copy to a file or a read from the p.output/p.stderrOutput buffering functions
		const stdoutPromise = liveOutput || stdoutFilePath ? Promise.resolve() : stdoutcbPromise || p.output();
		const stderrPromise = liveOutput || stderrFilePath ? Promise.resolve() : stderrcbPromise || p.stderrOutput();

		let stdinPromise = null;
		if(stdinFilePath)
		{
			const stdinFile = await Deno.open(stdinFilePath);
			stdinPromise = streams.copy(stdinFile, p.stdin).finally(() => { stdinFile.close(); p.stdin.close(); });
		}
		else if(stdinData)
		{
			stdinPromise = streams.writeAll(p.stdin, typeof stdinData==="string" ? new TextEncoder().encode(stdinData) : stdinData).finally(() => p.stdin.close());
		}
		else
		{
			stdinPromise = Promise.resolve();
		}

		// Wait for the process to finish (or be killed by the timeoutHandler)
		const [status, stdoutData, stderrData] = await Promise.all([p.status().catch(() => {}),	stdoutPromise.catch(() => {}),	stderrPromise.catch(() => {}), stdinPromise.catch(() => {})]);

		// If we have a timeout still running, clear it
		if(typeof timerid==="number")
			clearTimeout(timerid);
		
		if(xvfbProc)
		{
			await kill(xvfbProc, "SIGKILL");
			xvfbProc = null;
		}

		// Close the process
		try { p.close(); } catch {}

		// Form our return data
		const r = {status, timedOut : (timeout && timerid===true)};
		if(stdoutFilePath)
			Deno.close(runArgs.stdout);
		else
			r.stdout = stdoutEncoding==="utf-8" ? new TextDecoder().decode(stdoutData) : (stdoutEncoding==="binary" ? stdoutData : await encodeUtil.decode(stdoutData, stdoutEncoding));

		if(stderrFilePath)
			Deno.close(runArgs.stderr);
		else
			r.stderr = stderrEncoding==="utf-8" ? new TextDecoder().decode(stderrData) : (stderrEncoding==="binary" ? stderrData : await encodeUtil.decode(stderrData, stderrEncoding));
		
		// If we used lineReader due to have a stdoutcb/stderrcb, it opened up the handle so we need to close it
		if(stdoutcb)
			xu.tryFallback(() => p.stdout.close());
		if(stderrcb)
			xu.tryFallback(() => p.stderr.close());

		return r;
	};

	if(detached)
	{
		p.status().then(async status =>
		{
			if(!cbCalled)
				await cb();
			
			if(exitcb)
				await exitcb(status);
		});

		const r = {p, cb};
		if(xvfbPort)
			r.xvfbPort = xvfbPort;
		return r;
	}

	return await cb();
}

/** gracefully kills the given process p with signal */
export async function kill(p, signal="SIGTERM")
{
	try { p.kill(signal); } catch {}
	try { await p.status(); } catch {}	// allows the process to gracefully close before I close the handle
	try { p.close(); } catch {}
}

// returns args needed to call a sub deno script
export function denoArgs(...args)
{
	return ["run",
		"--v8-flags=--max-old-space-size=32768,--enable-experimental-regexp-engine-on-excessive-backtracks",
		"--import-map", "/mnt/compendium/DevLab/deno/importMap.json",
		"--no-check", "--no-config", "--no-npm", "--unstable", "--allow-all", ...args];
}

// returns env needed to properly run deno scripts
export function denoEnv()
{
	return {
		DENO_DIR : "/mnt/compendium/.deno",
		DENO_NO_UPDATE_CHECK : "1"
	};
}

export function denoRunOpts(o={})
{
	return {...o, env : { ...denoEnv(), ...(o.env)}};
}

export async function checkNumserver(dontExit)
{
	const numserverAvaialble = !!(await xu.tryFallbackAsync(async () => +(await (await fetch("http://127.0.0.1:21787/getNum")).text()).trim(), 0));
	if(!numserverAvaialble && !dontExit)
		Deno.exit(console.error(`numserver not running, exiting`));
	
	return numserverAvaialble;
}
