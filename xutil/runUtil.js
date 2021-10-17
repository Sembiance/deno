import * as path from "https://deno.land/std@0.111.0/path/mod.ts";
import * as streams from "https://deno.land/std@0.111.0/streams/mod.ts";
import * as fileUtil from "./fileUtil.js";

/** Will run the given cmd and pass it the given args.
 * Options:
 *   cwd				The current working directory to run the program in
 *   env				An object of key : value pairs to be addded to the environment
 *   liveOutput			All stdout/stderr from subprocess will be output on our main outputs
 *   stdoutFilePath		If set, stdout will be redirected and written to the file path specified
 *   stderrFilePath		If set, stderr will be redirected and written to the file path specified
 *   timeout			Number of 'ms' to allow the process to run and then terminate it
 *   timeoutSignal		What kill signal to send when the timeout elapses. Default: SIGTERM
 *   virtualX			If set, a virtual X environment will be created using Xvfb and the program run with that as the DISPLAY
 *   virtualXGLX		Same as virtualX except the GLX extension will be enabled
 */
export async function run(cmd, args=[], {cwd, env, liveOutput, stdoutFilePath, stderrFilePath, timeout, timeoutSignal="SIGTERM", virtualX, virtualXGLX}={})
{
	const runArgs = {cmd : [cmd, ...args], stdout : "piped", stderr : "piped"};
	if(env)
		runArgs.env = Object.fromEntries(Object.entries(env).map(([k, v]) => ([k, v.toString()])));
	if(cwd)
		runArgs.cwd = cwd;
	
	if(liveOutput)
	{
		runArgs.stdout = "inherit";
		runArgs.stderr = "inherit";
	}

	let xvfbProc = null;
	if(virtualX || virtualXGLX)
	{
		let existingSessions = null, xvfbPort = null;
		do
		{
			xvfbPort = Math.randomInt(10, 9999);
			existingSessions = (await fileUtil.tree("/tmp/.X11-unix", {nodir : true, regex : /^X\d+/})).map(v => +path.basename(v).substring(1));	// eslint-disable-line no-await-in-loop
		} while(existingSessions.includes(xvfbPort));

		const xvfbArgs = [`:${xvfbPort}`, `${virtualXGLX ? "+" : "-"}extension`, "GLX", "-nolisten", "tcp", "-nocursor", "-ac"];
		xvfbArgs.push("-xkbdir", "/usr/share/X11/xkb");	// Gentoo puts the xkb files here
		xvfbArgs.push("-screen", "0", "1920x1080x24");
		xvfbProc = Deno.run({cmd : ["Xvfb", ...xvfbArgs]});

		if(!runArgs.env)
			runArgs.env = {};
		runArgs.env.DISPLAY = `:${xvfbPort}`;
	}
	
	// Kick off the process
	const p = Deno.run(runArgs);

	// Create our output files if we are redirecting stdout or stderr
	const stdoutFile = stdoutFilePath ? await Deno.create(stdoutFilePath) : null;
	const stderrFile = stderrFilePath ? await Deno.create(stderrFilePath) : null;

	// Create our stdout/stderr promises which will either be a copy to a file or a read from the p.output/p.stderrOutput buffering functions
	const stdoutPromise = liveOutput ? Promise.resolve() : (stdoutFilePath ? streams.copy(p.stdout, streams.writerFromStreamWriter(stdoutFile)) : p.output());
	const stderrPromise = liveOutput ? Promise.resolve() : stderrFilePath ? streams.copy(p.stderr, streams.writerFromStreamWriter(stderrFile)) : p.stderrOutput();

	// Start our timer
	let timerid = null;
	function timeoutHandler()
	{
		try { p.kill(timeoutSignal); }
		catch {}
		timerid = true;
	}
	if(timeout)
		timerid = setTimeout(timeoutHandler, timeout);

	// Wait for the process to finish (or be killed by the timeoutHandler)
	const [status, stdoutResult, stderrResult] = await Promise.all([p.status(),	stdoutPromise,	stderrPromise]);

	// If we have a timeout still running, clear it
	if(typeof timerid==="number")
		clearTimeout(timerid);

	// Close the process
	p.close();

	if(xvfbProc)
	{
		xvfbProc.kill("SIGTERM");
		xvfbProc.close();
	}

	// Form our return data
	const r = {status, timedOut : (timeout && timerid===true)};

	if(stdoutFilePath)
	{
		p.stdout.close();
		stdoutFile.close();
	}
	else
	{
		r.stdout = new TextDecoder().decode(stdoutResult);
	}

	if(stderrFilePath)
	{
		p.stderr.close();
		stderrFile.close();
	}
	else
	{
		r.stderr = new TextDecoder().decode(stderrResult);
	}

	return r;
}
