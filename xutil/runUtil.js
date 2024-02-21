/* eslint-disable @stylistic/brace-style */
import {xu, fg} from "xu";
import * as fileUtil from "./fileUtil.js";
import * as encodeUtil from "./encodeUtil.js";
import * as printUtil from "./printUtil.js";
import {path, TextLineStream, delay, Buffer, getAvailablePort} from "std";

const XVFB_NUM_MIN = 10;
const XVFB_NUM_MAX = 59999;	// in theory since we call runUtil with -nolisten tcp, we just have unix sockets, so no real upper limit on number (billions) but 59,999 - 10 should be plenty

// requires kernel CONFIG_PROC_CHILDREN
async function killPIDKids(parentPID, timeoutSignal="SIGTERM")
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

	await getKids(parentPID).catch(() => {});

	// sort the kids so that we kill the deepest ones first
	for(const kidPid of kids.sortMulti([({depth}) => depth], [true]).map(({pid}) => pid))
	{
		try { Deno.kill(+kidPid, timeoutSignal); }
		catch {}
	}
}


/** Will run the given cmd and pass it the given args.
 * Options:
 *   cwd				The current working directory to run the program in
 *   detached			Don't wait for the command to finish, return the Process once launched
 *   env				An object of key : value pairs to be addded to the environment
 *   exitcb				A callback to be called when the process exits, useful in detached mode
 *   inheritEnv         Set to true to inherit ALL env from current user or an array of keys to inherit. Default (see below)
 *   killChildren		Kill children of the process as well on timeout
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
 *   stdoutUnbuffer     If set, stdout will be unbuffered with `stdbuf -o0`
 *   stderrUnbuffer     If set, stderr will be unbuffered with `stdbuf -o0`
 *   timeout			Number of 'ms' to allow the process to run and then terminate it
 *   timeoutSignal		What kill signal to send when the timeout elapses. Default: SIGTERM
 *   verbose            Set to true to output some details about the program
 *   virtualX			If set, a virtual X environment will be created using Xvfb and the program run with that as the DISPLAY
 *   virtualXVNCPort    If set, x11vnc will run against the virtual X port so you can see what's going on. If you set to 'true' it will auto assign a port
 *   virtualXGLX		Same as virtualX except the GLX extension will be enabled
 *   xlog               If set, stdout/stderr will be redirected to the logger
 */
export async function run(cmd, args=[], {cwd, detached, env, inheritEnv=["PATH", "HOME", "USER", "LOGNAME", "LANG", "LC_COLLATE"], killChildren, liveOutput, exitcb,
	stdinPipe, stdinData, stdinFilePath,
	stdoutNull, stderrNull,
	stdoutEncoding="utf-8", stdoutFilePath, stdoutcb, stdoutUnbuffer,
	stderrEncoding="utf-8", stderrFilePath, stderrcb, stderrUnbuffer,
	timeout, timeoutSignal="SIGTERM", verbose, virtualX, virtualXGLX, virtualXVNCPort, xlog}={})
{
	if([!!stdoutcb, !!stdoutFilePath, !!stdoutNull, !!liveOutput, !!xlog].filter(v => v===true).length>1)
		throw new Error("You can't set more than one of stdoutcb, stdoutFilePath, stdoutNull, lievOutput, xlog");
	if([!!stderrcb, !!stderrFilePath, !!stderrNull, !!liveOutput, !!xlog].filter(v => v===true).length>1)
		throw new Error("You can't set more than one of stderrcb, stderrFilePath, stderrNull, liveOutput, xlog");
	if([!!stdinPipe, !!stdinFilePath, !!stdinData].filter(v => v===true).length>1)
		throw new Error("You can't set more than one of stdinPipe, stdinFilePath, stdinData");

	let runCmd = cmd;
	const runArgs = args.map(v => (typeof v!=="string" ? v.toString() : v));
	const runOpts = {};

	if(stdoutUnbuffer || stderrUnbuffer)
	{
		runArgs.unshift(runCmd);
		if(stdoutUnbuffer)
			runArgs.unshift("-o0");
		if(stderrUnbuffer)
			runArgs.unshift("-e0");
		runCmd = "stdbuf";
	}

	if(inheritEnv!==true)
	{
		runOpts.clearEnv = true;
		if(Array.isArray(inheritEnv))
			runOpts.env = Object.fromEntries(inheritEnv.map(k => [k, Deno.env.get(k)]));
	}
	
	if(env)
	{
		runOpts.env ||= {};
		Object.assign(runOpts.env, Object.fromEntries(Object.entries(env).map(([k, v]) => ([k, v.toString()]))));
	}

	if(cwd)
		runOpts.cwd = cwd;

	runOpts.stdout = (stdoutFilePath || stdoutcb) ? "piped" : (stdoutNull ? "null" : (liveOutput ? "inherit" : "piped"));
	runOpts.stderr = (stderrFilePath || stderrcb) ? "piped" : (stderrNull ? "null" : (liveOutput ? "inherit" : "piped"));
	runOpts.stdin = (stdinPipe || stdinData || stdinFilePath) ? "piped" : "null";

	let xvfbProc = null;
	let xvfbPort = null;
	let x11vncProc = null;
	if(virtualX || virtualXGLX)
	{
		xvfbPort = await xu.tryFallbackAsync(async () => await getXVFBNum(), Math.randomInt(XVFB_NUM_MIN, XVFB_NUM_MAX));
		const xvfbArgs = [`:${xvfbPort}`, `${virtualXGLX ? "+" : "-"}extension`, "GLX", "-nolisten", "tcp", "-nocursor", "-ac"];
		xvfbArgs.push("-xkbdir", "/usr/share/X11/xkb");	// Gentoo puts the xkb files here
		xvfbArgs.push("-screen", "0", "1920x1080x24");
		xvfbProc = new Deno.Command("Xvfb", {args : xvfbArgs, clearEnv : true, stdout : "null", stderr : "null", stdin : "null"}).spawn();
	
		if(!await xu.waitUntil(async () => !!(await fileUtil.exists(`/tmp/.X11-unix/X${xvfbPort}`)), {timeout : xu.SECOND*20}))
			throw new Error(`virtualX requested for cmd \`${cmd}\`, ran \`Xvfb ${xvfbArgs.join(" ")}\` but failed to find X11 sock file within 20 seconds`);

		runOpts.env ||= {};
		runOpts.env.DISPLAY = `:${xvfbPort}`;

		if(virtualXVNCPort)
		{
			if(virtualXVNCPort===true)
				virtualXVNCPort = getAvailablePort();

			x11vncProc = new Deno.Command("x11vnc", {args : ["-display", `:${xvfbPort}`, "-forever", "-shared", "-rfbport", `${virtualXVNCPort}`], clearEnv : true, stdout : "null", stderr : "null", stdin : "null"}).spawn();
		}
	}

	if(verbose)
		console.log(`runUtil.run running \`${fg.orange(runCmd)} ${runArgs.map(v => (v.includes(" ") ? `"${v}"` : v)).join(" ")}\` with options ${printUtil.inspect(runOpts).squeeze()}`);

	// Create our cwd if needed, otherwise we'll get an error
	if(cwd && !(await fileUtil.exists(cwd)))
		await Deno.mkdir(cwd, {recursive : true});

	// Kick off our process
	let p = null;
	try { p = new Deno.Command(runCmd, {...runOpts, args : runArgs}).spawn(); }
	catch(err) { throw new Error(`runUtil.run failed for ${cmd} and args ${JSON.stringify(args)} with runArgs ${JSON.stringify(runArgs)}`, { cause : err }); }

	// Start our timer
	let timerid = null;
	async function timeoutHandler()
	{
		if(killChildren)
			await killPIDKids(p.pid, timeoutSignal);
		try { p.kill(timeoutSignal); } catch {}
		if(x11vncProc)
		{
			await kill(x11vncProc, "SIGTERM");
			x11vncProc = null;
		}
		if(xvfbProc)
		{
			await kill(xvfbProc, "SIGTERM");
			xvfbProc = null;
		}
		timerid = true;
	}
	if(timeout)
		timerid = setTimeout(timeoutHandler, timeout);

	const lineReader = async function(readable, cb)
	{
		for await(const line of readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream()))
			await cb(line);
	};

	// stdout
	let stdoutPromise = null;
	let stdoutBuffer = null;
	if(stdoutcb || xlog)
	{
		stdoutPromise = lineReader(p.stdout, stdoutcb || (line => xlog.info`${line}`));
	}
	else if(stdoutFilePath)
	{
		stdoutPromise = p.stdout.pipeTo((await Deno.open(stdoutFilePath.startsWith("/") ? stdoutFilePath : path.join(runArgs.cwd || Deno.cwd(), stdoutFilePath), {write : true, createNew : true})).writable);
	}
	else if(!liveOutput)
	{
		stdoutBuffer = new Buffer();
		stdoutPromise = p.stdout.pipeTo(stdoutBuffer.writable);
	}
	else
	{
		stdoutPromise = Promise.resolve();
	}

	// stderr
	let stderrPromise = null;
	let stderrBuffer = null;
	if(stderrcb || xlog)
	{
		stderrPromise = lineReader(p.stderr, stderrcb || (line => xlog.warn`${line}`));
	}
	else if(stderrFilePath)
	{
		stderrPromise = p.stderr.pipeTo((await Deno.open(stderrFilePath.startsWith("/") ? stderrFilePath : path.join(runArgs.cwd || Deno.cwd(), stderrFilePath), {write : true, createNew : true})).writable);
	}
	else if(!liveOutput)
	{
		stderrBuffer = new Buffer();
		stderrPromise = p.stderr.pipeTo(stderrBuffer.writable);
	}
	else
	{
		stderrPromise = Promise.resolve();
	}

	// stdin
	let stdinPromise = Promise.resolve();
	if(stdinFilePath)
		stdinPromise = (await Deno.open(stdinFilePath)).readable.pipeTo(p.stdin);
	else if(stdinData)
		stdinPromise = (new Blob([(typeof stdinData==="string" ? new TextEncoder().encode(stdinData) : stdinData)])).stream().pipeTo(p.stdin);

	let cbCalled = false;
	const cb = async () =>
	{
		if(cbCalled)
			return;

		cbCalled = true;

		// Wait for the process to finish (or be killed by the timeoutHandler)
		const [{success, code, signal}] = await Promise.all([p.status.catch(() => {}),	stdoutPromise.catch(() => {}),	stderrPromise.catch(() => {}), stdinPromise.catch(() => {})]);

		// If we have a timeout still running, clear it
		if(typeof timerid==="number")
			clearTimeout(timerid);

		if(x11vncProc)
		{
			await kill(x11vncProc, "SIGTERM");
			x11vncProc = null;
		}
		if(xvfbProc)
		{
			await kill(xvfbProc, "SIGTERM");
			xvfbProc = null;
		}

		const r = {status : {success, code, signal}, stdout : "", stderr : "", timedOut : (timeout && timerid===true)};
		if(stdoutBuffer?.length)
			r.stdout = stdoutEncoding==="utf-8" ? new TextDecoder().decode(stdoutBuffer.bytes()) : (stdoutEncoding==="binary" ? stdoutBuffer.bytes() : await encodeUtil.decode(stdoutBuffer.bytes(), stdoutEncoding));

		if(stderrBuffer?.length)
			r.stderr = stderrEncoding==="utf-8" ? new TextDecoder().decode(stderrBuffer.bytes()) : (stderrEncoding==="binary" ? stderrBuffer.bytes() : await encodeUtil.decode(stderrBuffer.bytes(), stderrEncoding));

		return r;
	};

	if(detached)
	{
		p.status.then(async ({success, code, signal}) =>
		{
			if(!cbCalled)
				await cb();
			
			if(exitcb)
				await exitcb({success, code, signal});
		});

		const r = {p, cb};
		if(xvfbPort)
			r.xvfbPort = xvfbPort;
		if(virtualXVNCPort)
			r.virtualXVNCPort = virtualXVNCPort;
		return r;
	}

	return await cb();
}

/** gracefully kills the given process p with signal */
export async function kill(p, signal="SIGTERM", {killChildren}={})
{
	if(killChildren)
		await killPIDKids(p.pid, signal);
		
	try { p.kill(signal); } catch {}
	try { await p.status; } catch {}	// allows the process to gracefully close before I close the handle
}

// returns args needed to call a sub deno script
export function denoArgs(...args)
{
	return ["run",
		"--v8-flags=--max-old-space-size=32768,--enable-experimental-regexp-engine-on-excessive-backtracks",
		"--import-map", "/mnt/compendium/DevLab/deno/importMap.json",
		"--no-check", "--no-config", "--no-npm", "--no-lock", "--unstable-ffi", "--unstable-fs", "--unstable-net", "--unstable-temporal", "--allow-all", ...args];
}

// returns env needed to properly run deno scripts
export function denoEnv()
{
	return {
		DENO_DIR : "/mnt/compendium/.deno",
		DENO_NO_UPDATE_CHECK : "1",
		DENO_NO_PACKAGE_JSON : "1"
	};
}

export function denoRunOpts(o={})
{
	return {...o, env : { ...denoEnv(), ...(o.env)}};
}

export function rsyncArgs(src, dest, {srcHost, destHost, deleteExtra, pretend, filter, fast, port, verbose, dereferenceSymlinks, progress, noOwnership, identityFilePath}={})
{
	const r = [];

	if(srcHost && destHost)
		throw new Error("Can't have both srcHost and destHost");
	
	if(pretend)
		r.push("-rlpgoD", "--dry-run");
	else
		r.push("--archive");	// -rlptgoD
	
	if(progress)
		r.push("--progress");

	r.push("--hard-links", dereferenceSymlinks ? "--copy-links" : "--links");
	
	if(verbose)
		r.push("--verbose");

	if(deleteExtra)
		r.push("--delete");

	if(filter)
		r.push("-f", `merge ${filter}`);

	if(fast)
		r.push("--no-compress");

	if(noOwnership)
		r.push("--no-o", "--no-g");
	
	if((srcHost || destHost) && (fast || identityFilePath))
	{
		const sshArgs = ["-T -x"];
		if(fast)
			sshArgs.push("-c aes256-gcm@openssh.com -o Compression=no");
		if(identityFilePath)
			sshArgs.push(`-i "${identityFilePath}"`);
		if(port)
			sshArgs.push(`-p ${port}`);

		r.push("-e", `ssh ${sshArgs.join(" ")}`);
	}
	
	r.push(`${srcHost ? `${srcHost}:` : ""}${src}`);
	r.push(`${destHost ? `${destHost}:` : ""}${dest}`);

	return r;
}

export async function getXVFBNum()
{
	const xvfbNumLockFilePath = "/mnt/ram/tmp/xvfbNum.lock";
	const xvfbNumCounterFilePath = "/mnt/ram/tmp/xvfbNum.counter";

	// todo TEMPORARY DUE TO BUG: https://github.com/denoland/deno/issues/22504
	await delay(Math.randomInt(250, 1000));

	const lockFile = await Deno.open(xvfbNumLockFilePath, {append : true, create : true});
	await Deno.flock(lockFile.rid, true);
	let xvfbCounter = +(await xu.tryFallbackAsync(async () => await fileUtil.readTextFile(xvfbNumCounterFilePath), XVFB_NUM_MIN));

	let xvfbNum = null;
	do
	{
		xvfbNum = xvfbCounter++;
		if(xvfbCounter>XVFB_NUM_MAX)
			xvfbCounter = XVFB_NUM_MIN;

		// skip this number if there is an existing X socket for this number
		if(await fileUtil.exists(`/tmp/.X11-unix/X${xvfbNum}`))
			continue;
		
		break;
	} while(true);

	await fileUtil.writeTextFile(xvfbNumCounterFilePath, xvfbCounter.toString());
	await Deno.funlock(lockFile.rid);
	lockFile.close();

	return xvfbNum;
}
