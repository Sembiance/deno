import {xu, fg} from "xu";
import {path, delay} from "std";
import {webUtil, runUtil, fileUtil} from "xutil";
import {XLog} from "xlog";

// NOTE: Could replace web communication with a lower level, unix sock based, new binary ipcUtil communication (pascal style TextEncoder JSON stringify messages). While this may be faster/lighter, it's unlikely to provide any real benefit in this context
// onSuccess(responseData, {msg, duration, log})
// onFail({reason, error}, {msg, duration, log})
export class AgentPool
{
	constructor(agentFilePath, {onSuccess, onFail, xlog=new XLog("warn")}={})
	{
		this.queue = [];
		this.agents = [];
		this.stopping = false;
		this.textDecoder = new TextDecoder();

		this.agentFilePath = agentFilePath;
		this.onSuccess = onSuccess;
		this.onFail = onFail;
		this.xlog = xlog;

		this.logPrefix = `${xu.bracket(`${fg.white("AgentPool")}${fg.cyan("-")}${fg.peach(path.basename(this.agentFilePath, path.extname(this.agentFilePath)))}`)}`;
	}

	async init()
	{
		this.cwd = await fileUtil.genTempPath(undefined, `AgentPool-${path.basename(this.agentFilePath, path.extname(this.agentFilePath))}`);
		await Deno.mkdir(this.cwd, {recursive : true});
	}

	async start({qty=navigator.hardwareConcurrency, runEnv, sequential, interval}={})
	{
		this.xlog.debug`${this.logPrefix} Starting ${qty} agents...`;

		while(qty)
		{
			const agent = {agentid : this.agents.length, running : false, log : []};
			this.agents.push(agent);
			this.startAgent(agent, {runEnv});	// we don't wait for this to finish, it runs in the background

			if(sequential)
				await xu.waitUntil(() => agent.running);

			qty--;
			if(qty && interval)
				await delay(interval);
		}

		await xu.waitUntil(() => this.agents.every(agent => agent.running));

		this.xlog.debug`${this.logPrefix} Started.`;
	}

	async startAgent(agent, {runEnv}={})
	{
		agent.cwd = await fileUtil.genTempPath(this.cwd);
		await Deno.mkdir(agent.cwd, {recursive : true});
		agent.portFilePath = path.join(agent.cwd, "port");
		agent.logPrefix = `${this.logPrefix}${fg.cyan("#")}${fg.white(agent.agentid)}`;

		agent.send = async msg =>
		{
			agent.log.clear();
			agent.liveOutput = !!msg.liveOutput;	// 'magic' key that tells the agent to output logs live, don't like that it has to be 'magic' but it's the least complicated
			agent.startedAt = performance.now();

			let sendResult = null;
			try
			{
				// NOTE: Could add an AbortController to fetch that is triggered if the agent crashes or if an optional 'timeout' is specified (see how it's done in xu.fetch)
				const fetchResult = await fetch(agent.opURL, {method : "POST", headers : {"content-type" : "application/json"}, body : JSON.stringify(msg)});
				const fetchText = await fetchResult.text();
				sendResult = fetchResult.status===200 ? {cb : "onSuccess", r : xu.parseJSON(fetchText)} : {cb : "onFail", r : {reason : "exception", error : fetchText}};
			}
			catch(err)
			{
				sendResult = {cb : "onFail", r : {reason : agent.running ? "fetch failed" : "crashed", error : err.stack}};
			}
			agent.lastDuration = performance.now()-agent.startedAt;

			const sendResultMeta = {msg, duration : agent.lastDuration, log : Array.from(agent.log)};
			agent.log.clear();

			if(this[sendResult.cb])
				this[sendResult.cb](sendResult.r, sendResultMeta);

			delete agent.startedAt;
		};

		agent.logHandler = (type, line) =>
		{
			if(agent.liveOutput)
				console[type==="err" ? "error" : "log"](line);
			else
				agent.log.push(line);
		};

		agent.exitHandler = async () =>
		{
			this.xlog[agent.stopping ? "debug" : "warn"]`${agent.logPrefix} ${agent.stopping ? "Exited" : "Crashed"}...`;
			if(!agent.stopping && agent.log.length)
				this.xlog.warn`${agent.logPrefix} ${agent.log.join("\n")}`;

			agent.running = false;
			delete agent.runner;
			await fileUtil.unlink(agent.portFilePath);

			if(!agent.startedOnce)
				return this.xlog.error`${agent.logPrefix} agent crashed on first start attempt:\n${agent.log.join("\n")}`;

			if(agent.stopping)
				return;

			await agent.start();
		};

		agent.start = async () =>
		{
			this.xlog.debug`${agent.logPrefix} Starting...`;

			agent.log.clear();

			const runOpts = runUtil.denoRunOpts();
			runOpts.cwd = agent.cwd;
			runOpts.detached = true;
			runOpts.env.AGENT_CWD = agent.cwd;
			if(runEnv)
				Object.assign(runOpts.env, runEnv);

			runOpts.stdoutcb = line => agent.logHandler("out", line);
			runOpts.stderrcb = line => agent.logHandler("err", line);

			runOpts.exitcb = agent.exitHandler;
			agent.runner = await runUtil.run("deno", runUtil.denoArgs(this.agentFilePath), runOpts);

			await xu.waitUntil(async () => await fileUtil.exists(agent.portFilePath));
			agent.port = +(await fileUtil.readTextFile(agent.portFilePath));
			agent.opURL = `http://127.0.0.1:${agent.port}/op`;
			agent.running = true;
			agent.startedOnce = true;

			this.xlog.debug`${agent.logPrefix} Started on port ${agent.port}...`;
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
		this.xlog.debug`${this.logPrefix} Stopping ${this.agents.length} agents...`;

		this.stopping = true;
		await this.agents.parallelMap(async agent => await agent.stop(), this.agents.length);

		await xu.waitUntil(() => this.agents.every(agent => !agent.running && agent.finished));
		if(!keepCWD)
			await fileUtil.unlink(this.cwd, {recursive : true});

		this.xlog.debug`${this.logPrefix} Stopped.`;
	}

	status({simpleLog}={})
	{
		const r = {cwd : this.cwd, queue : Array.from(this.queue), agents : []};
		for(const agent of this.agents)
		{
			const agentStatus = {};
			for(const key of ["agentid", "cwd", "port", "running", "lastDuration"])
			{
				if(Object.hasOwn(agent, key))
					agentStatus[key] = agent[key];
			}
			if(agent.startedAt)
			{
				agentStatus.log = Array.from(agent.log || []);
				if(simpleLog)
					agentStatus.log = agentStatus.log.join("\n").decolor();
				agentStatus.duration = performance.now()-agent.startedAt;
			}
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
