/** Will run the given cmd and pass it the given args.
 * Options:
 *   detached	Will run this headless, start the process and just return the process arg right away
 *    timeout	Number of 'ms' to allow the process to run and then terminate it
 * timeoutSignal 
 * stdoutFilePath
 * stderrFilePath
 */
// TODO options above and below also test timeout
export async function run(cmd, args=[], {detached=false, timeout}={})
{
	const runArgs = {cmd : [cmd, ...args]};
	if(!detached)
	{
		runArgs.stderr = "piped";
		runArgs.stdout = "piped";
	}

	const p = Deno.run(runArgs);
	if(detached)
		return p;

	let timerid = null;
	function timeoutHandler()
	{
		p.kill("SIGINT");
		timerid = null;
	}

	if(timeout)
		timerid = setTimeout(timeoutHandler, timeout);

	const [status, stdout, stderr] = await Promise.all([p.status(),	p.output(),	p.stderrOutput()]);
	if(timerid!==null)
		clearTimeout(timerid);

	p.close();
	
	const decoder = new TextDecoder();
	return {stdout : decoder.decode(stdout), stderr : decoder.decode(stderr), status};
}
