/* eslint-disable brace-style */
import {xu, fg} from "xu";
import * as fileUtil from "./fileUtil.js";
import {path} from "std";

const XVFB_LOCK_DIR_PATH = "/mnt/ram/deno/xvfb";

/** Will run the given cmd and pass it the given args.
 * Options:
 *   cwd				The current working directory to run the program in
 *   detached			Don't wait for the command to finish, return the Process once launched
 *   env				An object of key : value pairs to be addded to the environment
 *   inheritEnv         Set to true to inherit ALL env from current user or an array of keys to inherit. Default (see below)
 *   liveOutput			All stdout/stderr from subprocess will be output on our main outputs
 *   stdoutFilePath		If set, stdout will be redirected and written to the file path specified
 *   stderrFilePath		If set, stderr will be redirected and written to the file path specified
 *   timeout			Number of 'ms' to allow the process to run and then terminate it
 *   timeoutSignal		What kill signal to send when the timeout elapses. Default: SIGTERM
 *   verbose            Set to true to output some details about the program
 *   virtualX			If set, a virtual X environment will be created using Xvfb and the program run with that as the DISPLAY
 *   virtualXGLX		Same as virtualX except the GLX extension will be enabled
 */
export async function run(cmd, args=[], {cwd, detached, env, inheritEnv=["PATH", "HOME", "USER", "LOGNAME", "LANG", "LC_COLLATE"], liveOutput, stdoutFilePath, stderrFilePath, timeout, timeoutSignal="SIGTERM", verbose, virtualX, virtualXGLX}={})
{
	const runArgs = {cmd : [cmd, ...args.map(v => (typeof v!=="string" ? v.toString() : v))], stdout : "piped", stderr : "piped"};

	if(inheritEnv!==true)
	{
		runArgs.clearEnv = true;
		if(Array.isArray(inheritEnv))
			runArgs.env = Object.fromEntries(inheritEnv.map(k => [k, Deno.env.get(k)]));
	}
	
	if(env)
	{
		if(!runArgs.env)
			runArgs.env = {};
		
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

	let xvfbProc = null;
	let xvfbPort = null;
	if(virtualX || virtualXGLX)
	{
		await Deno.mkdir(XVFB_LOCK_DIR_PATH, {recursive : true});
		
		do
		{
			xvfbPort = Math.randomInt(10, 9999);
			
			// try and create a lock file for this port num
			const f = await Deno.open(path.join(XVFB_LOCK_DIR_PATH, xvfbPort.toString()), {write : true, createNew : true}).catch(() => {});
			if(!f || await fileUtil.exists(path.join("/tmp/.X11-unix", `X${xvfbPort}`)))
				continue;

			Deno.close(f.rid);
			break;
		} while(true);

		const xvfbArgs = [`:${xvfbPort}`, `${virtualXGLX ? "+" : "-"}extension`, "GLX", "-nolisten", "tcp", "-nocursor", "-ac"];
		xvfbArgs.push("-xkbdir", "/usr/share/X11/xkb");	// Gentoo puts the xkb files here
		xvfbArgs.push("-screen", "0", "1920x1080x24");
		xvfbProc = Deno.run({cmd : ["Xvfb", ...xvfbArgs], clearEnv : true, stdout : null, stderr : null, stdin : null});
	
		if(!await xu.waitUntil(async () => !!(await fileUtil.exists(`/tmp/.X11-unix/X${xvfbPort}`)), {timeout : xu.SECOND*5}))
			throw new Error(`virtualX requested for cmd \`${cmd}\`, ran \`Xvfb ${xvfbArgs.join(" ")}\` but failed to find X11 sock file within 5 seconds`);

		if(!runArgs.env)
			runArgs.env = {};
		runArgs.env.DISPLAY = `:${xvfbPort}`;
	}

	if(verbose)
		xu.log`runUtil.run running \`${fg.orange(runArgs.cmd[0])} ${runArgs.cmd.slice(1).map(v => (v.includes(" ") ? `"${v}"` : v)).join(" ")}\` with options ${xu.inspect({...runArgs, cmd : []}).squeeze()}`;
	
	// Kick off the process
	const p = Deno.run(runArgs);

	// Start our timer
	let timerid = null;
	function timeoutHandler()
	{
		try { p.kill(timeoutSignal); } catch {}
		timerid = true;
	}
	if(timeout)
		timerid = setTimeout(timeoutHandler, timeout);

	let cbCalled = false;
	const cb = async () =>
	{
		cbCalled = true;

		// Create our stdout/stderr promises which will either be a copy to a file or a read from the p.output/p.stderrOutput buffering functions
		const stdoutPromise = liveOutput || stdoutFilePath ? Promise.resolve() : p.output();
		const stderrPromise = liveOutput || stderrFilePath ? Promise.resolve() : p.stderrOutput();

		// Wait for the process to finish (or be killed by the timeoutHandler)
		const [status, stdoutResult, stderrResult] = await Promise.all([p.status().catch(() => {}),	stdoutPromise.catch(() => {}),	stderrPromise.catch(() => {})]);

		// If we have a timeout still running, clear it
		if(typeof timerid==="number")
			clearTimeout(timerid);
		
		if(xvfbProc)
		{
			await kill(xvfbProc, "SIGTERM");
			await fileUtil.unlink(path.join(XVFB_LOCK_DIR_PATH, xvfbPort.toString()));
		}

		// Close the process
		try { p.close(); } catch {}

		// Form our return data
		const r = {status, timedOut : (timeout && timerid===true)};
		if(stdoutFilePath)
			Deno.close(runArgs.stdout);
		else
			r.stdout = new TextDecoder().decode(stdoutResult);

		if(stderrFilePath)
			Deno.close(runArgs.stderr);
		else
			r.stderr = new TextDecoder().decode(stderrResult);

		return r;
	};

	if(detached)
	{
		p.status().then(async () =>
		{
			if(!cbCalled)
				await cb();
		});

		const r = {p, cb};
		if(xvfbPort)
			r.xvfbPort = xvfbPort;
		return r;
	}

	return await cb();
}

/** gracefully kills the given process p with signal */
export async function kill(p, signal)
{
	try { p.kill(signal); } catch {}
	try { await p.status(); } catch {}	// allows the process to gracefully close before I close the handle
	try { p.close(); } catch {}
}
