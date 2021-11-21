import {xu, fg} from "xu";
import * as fileUtil from "./fileUtil.js";
import {path} from "std";

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
		let existingSessions = null;
		do
		{
			xvfbPort = Math.randomInt(10, 9999);
			existingSessions = (await fileUtil.tree("/tmp/.X11-unix", {nodir : true, regex : /^X\d+/})).map(v => +path.basename(v).substring(1));
		} while(existingSessions.includes(xvfbPort));

		const xvfbArgs = [`:${xvfbPort}`, `${virtualXGLX ? "+" : "-"}extension`, "GLX", "-nolisten", "tcp", "-nocursor", "-ac"];
		xvfbArgs.push("-xkbdir", "/usr/share/X11/xkb");	// Gentoo puts the xkb files here
		xvfbArgs.push("-screen", "0", "1920x1080x24");
		xvfbProc = Deno.run({cmd : ["Xvfb", ...xvfbArgs]});

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
		try
		{
			p.kill(timeoutSignal);
			if(detached)
				p.close();
		}
		catch {}
		timerid = true;
	}
	if(timeout)
		timerid = setTimeout(timeoutHandler, timeout);

	if(detached)
	{
		// if we are detached, we need to kill xvfbProc and close stdout/stderr (if not liveOutput) after running
		p.status().then(() =>
		{
			// If we have a timeout still running, clear it
			if(typeof timerid==="number")
				clearTimeout(timerid);

			if(!liveOutput)
			{
				p.stdout.close();
				p.stderr.close();
			}

			if(xvfbProc)
			{
				xvfbProc.kill("SIGTERM");
				xvfbProc.close();
			}
		});

		const r = {p};
		if(xvfbPort)
			r.xvfbPort = xvfbPort;
		return r;
	}


	// Create our stdout/stderr promises which will either be a copy to a file or a read from the p.output/p.stderrOutput buffering functions
	const stdoutPromise = liveOutput || stdoutFilePath ? Promise.resolve() : p.output();
	const stderrPromise = liveOutput || stderrFilePath ? Promise.resolve() : p.stderrOutput();

	// Wait for the process to finish (or be killed by the timeoutHandler)
	const [status, stdoutResult, stderrResult] = await Promise.all([p.status(),	stdoutPromise,	stderrPromise]);

	// If we have a timeout still running, clear it
	if(typeof timerid==="number")
		clearTimeout(timerid);

	// Ensure stdout/stderr are finished saving to disk if we are doing that. Not sure if this is needed or not.
	//if(stdoutFilePath)
	//	await Deno.fsync(runArgs.stdout);
	//if(stderrFilePath)
	//	await Deno.fsync(runArgs.stderr);

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
		Deno.close(runArgs.stdout);
	else
		r.stdout = new TextDecoder().decode(stdoutResult);

	if(stderrFilePath)
		Deno.close(runArgs.stderr);
	else
		r.stderr = new TextDecoder().decode(stderrResult);

	return r;
}
