import {xu, fg} from "xu";
import {path, delay} from "std";
import {webUtil, runUtil, fileUtil} from "xutil";
import {XLog} from "xlog";

// NOTE: Could replace web communication with a lower level, unix sock based, new binary ipcUtil communication (pascal style TextEncoder JSON stringify messages). While this may be faster/lighter, it's unlikely to provide any real benefit in this context
export class AgentPool
{
	constructor(agentFilePath, {onSuccess, onFail, errFilePath, xlog=new XLog("warn")}={})
	{
		this.queue = [];
		this.agents = [];
		this.stopping = false;
		this.textDecoder = new TextDecoder();

		this.agentFilePath = agentFilePath;
		this.onSuccess = onSuccess;
		this.onFail = onFail;
		this.errFilePath = errFilePath;
		this.xlog = xlog;

		this.logPrefix = `${xu.bracket(`${fg.white("AgentPool")}${fg.cyan("-")}${fg.peach(path.basename(this.agentFilePath, path.extname(this.agentFilePath)))}`)}`;
	}

	async init()
	{
		this.cwd = await fileUtil.genTempPath(undefined, `AgentPool-${path.basename(this.agentFilePath, path.extname(this.agentFilePath))}`);
		await Deno.mkdir(this.cwd, {recursive : true});
	}

	async start({qty=navigator.hardwareConcurrency, sequential, interval}={})
	{
		this.xlog.info`${this.logPrefix} Starting ${qty} agents...`;

		while(qty)
		{
			const agent = {agentid : this.agents.length, running : false};
			this.agents.push(agent);
			this.startAgent(agent);	// we don't wait for this to finish, it runs in the background

			if(sequential)
				await xu.waitUntil(() => agent.running);

			qty--;
			if(qty && interval)
				await delay(interval);
		}

		await xu.waitUntil(() => this.agents.every(agent => agent.running));

		this.xlog.info`${this.logPrefix} Started.`;
	}

	async startAgent(agent)
	{
		agent.cwd = await fileUtil.genTempPath(this.cwd);
		await Deno.mkdir(agent.cwd, {recursive : true});

		agent.portFilePath = path.join(agent.cwd, "port");
		agent.outFilePath = path.join(agent.cwd, "out");
		agent.errFilePath = path.join(agent.cwd, "err");
		agent.logPrefix = `${this.logPrefix}${fg.cyan("#")}${fg.white(agent.agentid)}`;

		agent.send = async msg =>
		{
			this.xlog.debug`${agent.logPrefix} Sending msg: ${msg}`;

			agent.startedAt = performance.now();

			// NOTE: Could add an AbortController below that is triggered if the agent crashes or if an optional 'timeout' is specified
			const fetchOpts = {method : "POST", headers : {"content-type" : "application/json"}, body : JSON.stringify(msg)};
			try
			{
				// we don't use xu.fetch() because we care about the HTTP response headers
				const fetchResult = await fetch(agent.opURL, fetchOpts);
				const r = await fetchResult.text();
				if(fetchResult.status===500)
				{
					if(this.onFail)
						this.onFail({msg, reason : "exception", error : r});
				}
				else
				{
					if(this.onSuccess)
						this.onSuccess(xu.parseJSON(r), {duration : agent.lastDuration});
				}
			}
			catch(err)
			{
				if(this.onFail)
					this.onFail({msg, reason : agent.running ? "fetch failed" : "crashed", error : err.stack});
			}

			agent.lastDuration = performance.now()-agent.startedAt;

			// check to see if our err file size has changed and if we have an errFilePath to write to, then write our current msg and error to that file
			const errSize = (await Deno.stat(agent.errFilePath)).size;
			if(errSize>agent.lastErrSize)
			{
				if(this.errFilePath)
					await fileUtil.writeTextFile(this.errFilePath, `msg: ${JSON.stringify(msg)}\nerror: ${this.textDecoder.decode(await fileUtil.readFileBytes(agent.errFilePath, errSize-agent.lastErrSize, agent.lastErrSize)).trim()}\n\n`, {create : true, append : true});

				agent.lastErrSize = errSize;
			}

			delete agent.startedAt;
		};

		agent.exitHandler = async () =>
		{
			this.xlog[agent.stopping ? "info" : "warn"]`${agent.logPrefix} ${agent.stopping ? "Exited" : "Crashed"}...`;

			agent.running = false;
			delete agent.runner;
			await fileUtil.unlink(agent.portFilePath);

			if(!agent.startedOnce)
				return this.xlog.error`${agent.logPrefix} agent crashed on first start attempt:\n${(await fileUtil.exists(agent.errFilePath) ? await fileUtil.readTextFile(agent.errFilePath) : "")}`;

			if(agent.stopping)
				return;

			await agent.start();
		};

		agent.start = async () =>
		{
			this.xlog.info`${agent.logPrefix} Starting...`;

			for(const logfilePath of [agent.outFilePath, agent.errFilePath])
			{
				if(await fileUtil.exists(logfilePath))
					await Deno.rename(logfilePath, await fileUtil.genTempPath(agent.cwd, path.basename(logfilePath)));
			}

			agent.lastErrSize = 0;

			const runOpts = runUtil.denoRunOpts();
			runOpts.cwd = agent.cwd;
			runOpts.detached = true;
			runOpts.env = {AGENT_CWD : agent.cwd};
			runOpts.stdoutFilePath = agent.outFilePath;
			runOpts.stderrFilePath = agent.errFilePath;
			runOpts.exitcb = agent.exitHandler;
			agent.runner = await runUtil.run("deno", runUtil.denoArgs(this.agentFilePath), runOpts);

			await xu.waitUntil(async () => await fileUtil.exists(agent.portFilePath));
			agent.port = +(await fileUtil.readTextFile(agent.portFilePath));
			agent.opURL = `http://127.0.0.1:${agent.port}/op`;
			agent.running = true;
			agent.startedOnce = true;

			this.xlog.info`${agent.logPrefix} Started on port ${agent.port}...`;
		};

		agent.stop = async () =>
		{
			if(!agent.runner || !agent.running)
				return;

			agent.stopping = true;
			await runUtil.kill(agent.runner.p);
		};

		await agent.start();

		// now do something like:
		while(1)
		{
			if(!agent.running)	// due to crash
			{
				await xu.waitUntil(() => this.stopping || agent.running);
				if(this.stopping)
					break;
			}

			const msg = this.queue.pop();
			if(msg)
			{
				await agent.send(msg);

				if(this.stopping)
					break;

				if(this.queue.length)
					continue;
			}

			await xu.waitUntil(() => this.stopping || this.queue.length);
			if(this.stopping)
				break;
		}

		await agent.stop();
		await xu.waitUntil(() => !agent.running);
		agent.finished = true;
	}

	async stop({keepCWD}={})
	{
		this.xlog.info`${this.logPrefix} Stopping ${this.agents.length} agents...`;

		this.stopping = true;
		await this.agents.parallelMap(async agent => await agent.stop(), this.agents.length);

		await xu.waitUntil(() => this.agents.every(agent => !agent.running && agent.finished));
		if(!keepCWD)
			await fileUtil.unlink(this.cwd, {recursive : true});

		this.xlog.info`${this.logPrefix} Stopped.`;
	}

	status()
	{
		const r = {cwd : this.cwd, queue : Array.from(this.queue), agents : []};
		for(const agent of this.agents)
		{
			const agentStatus = {};
			for(const key of ["agentid", "cwd", "port", "outFilePath", "errFilePath", "running", "lastDuration"])
			{
				if(Object.hasOwn(agent, key))
					agentStatus[key] = agent[key];
			}
			if(agent.startedAt)
				agentStatus.duration = performance.now()-agent.startedAt;
			r.agents.push(agentStatus);
		}
		
		return r;
	}

	empty()
	{
		return this.queue.length===0 && !this.agents.some(agent => agent.startedAt);
	}

	process(vals)
	{
		this.queue = Array.force(vals).map(v => (v || {})).reverse().concat(this.queue);
	}

	processPriority(vals)
	{
		this.queue = this.queue.concat(Array.force(vals).map(v => (v || {})).reverse());
	}

	async broadcast(msg)
	{
		return await this.agents.filter(agent => agent.running).parallelMap(async agent => await agent.send(msg), this.agents.length);
	}
}

export async function agentInit(handler, {xlog=new XLog("warn")}={})
{
	const agentCWD = Deno.env.get("AGENT_CWD");
	if(!agentCWD?.length)
		throw new Error("AGENT_CWD env not set!");

	if(!(await fileUtil.exists(agentCWD)))
		throw new Error(`AGENT_CWD env points to non-existent path: ${agentCWD}`);

	const webServer = webUtil.serve({hostname : "127.0.0.1", port : 0}, async request =>
	{
		let r = null;

		try
		{
			r = new Response(JSON.stringify((await handler(await request.json())) || {}));
		}
		catch(err)
		{
			r = new Response(err.stack, {status : 500});
		}

		return r;
	});
		
	await fileUtil.writeTextFile(path.join(agentCWD, "port"), webServer.server.addr.port.toString());
}
