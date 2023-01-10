import {xu} from "xu";
import {xwork} from "xwork";
import {XLog} from "xlog";

export class XWorkerPool
{
	constructor({workercb, emptycb, crashcb, crashRecover, xlog=new XLog("warn")}={})
	{
		this.queue = [];
		this.ready = false;
		this.workers = [];
		this.available = [];
		this.busy = {};
		this.busyValues = {};
		this.xlog = xlog;
		this.workercb = workercb;
		this.emptycb = emptycb;
		this.crashcb = crashcb;
		this.stopped = false;
		this.crashRecover = crashRecover;
		this.recoverArgs = {};
	}

	async start(fun, {size=navigator.hardwareConcurrency, imports}={})
	{
		this.xlog.debug`Starting worker pool of ${size} size...`;

		this.workers = await [].pushSequence(0, size-1).parallelMap(async workerid =>
		{
			const xworkRunOpts = {xlog : this.xlog, imports, detached : true, runArgs : [workerid.toString(), size.toString()], exitcb : status => this.workerExit(workerid, status), recvcb : msg => this.workerDone(workerid, msg)};
			this.recoverArgs[workerid] = {fun, xworkRunOpts};
			const worker = await xwork.run(fun, workerid, xworkRunOpts);
			await worker.ready();
			worker.workerid = workerid;
			this.available.push(worker);
			return worker;
		}, size);

		this.ready = true;
		this.processQueue();
	}

	async workerExit(workerid, status)
	{
		this.xlog.debug`workerExit ${workerid} exited with status ${status} busy ${Object.keys(this.busy).join(" ")}`;

		this.workers.find(worker => worker.workerid===workerid).exited = true;

		// remove it from busy and available
		delete this.busy[workerid];
		this.available.filterInPlace(worker => worker.workerid!==workerid);
		
		if(this.stopping)
			return;
		
		this.xlog.warn`Worker ${workerid} crashed with status ${status} and queue value ${this.busyValues[workerid]}`;
		if(this.crashcb)
			await this.crashcb(workerid, status, this.busyValues[workerid]);

		if(this.crashRecover)
		{
			this.xlog.warn`Recovering from crash...`;
			const worker = await xwork.run(this.recoverArgs[workerid].fun, workerid, this.recoverArgs[workerid].xworkRunOpts);
			await worker.ready();
			worker.workerid = workerid;
			delete this.busy[workerid];
			this.workers[workerid] = worker;
			this.available.push(worker);
		}
	}

	async stop()
	{
		this.xlog.debug`Stopping worker pool...`;

		this.stopping = true;
		await this.workers.parallelMap(async worker =>
		{
			if(worker.exited)
				return;
				
			await worker.kill();
		}, this.workers.length);
		this.ready = false;
		await xu.waitUntil(() => this.stopped, {timeout : xu.SECOND*10});
	}

	async processQueue()
	{
		while(this.ready)
		{
			this.xlog.trace`processQueue: Waiting...`;
			await xu.waitUntil(() => !this.ready || (this.queue.length>0 && this.available.length>0));
			//this.xlog.trace`processQueue: Done waiting. this.ready = ${this.ready}  this.queue.length = ${this.queue.length}  this.available.length = ${this.available.length}`;
			if(!this.ready)
			{
				this.xlog.trace`processQueue: Breaking loop due to ready===false`;
				this.stopped = true;
				break;
			}

			const worker = this.available.pop();
			if(!worker)
			{
				this.xlog.trace`processQueue: Looping again due to no available workers`;
				continue;
			}

			this.busy[worker.workerid] = worker;
			this.busyValues[worker.workerid] = this.queue.shift();
			//this.xlog.trace`processQueue ${worker.workerid} A: await worker.send(${this.busyValues[worker.workerid]})`;
			await worker.send(this.busyValues[worker.workerid]);
			//this.xlog.trace`processQueue ${worker.workerid} B: worker.send(${this.busyValues[worker.workerid]}) finished`;
		}
	}

	async workerDone(workerid, r)
	{
		//this.xlog.debug`workerDone ${workerid} A: busy ${Object.keys(this.busy).join(" ")}`;
		delete this.busyValues[workerid];
		
		const worker = this.busy[workerid];
		if(!worker)
			this.xlog.warn`Worker done but pool says worker ${workerid} is not busy!`;

		if(this.workercb)
			await this.workercb(workerid, r);

		if(worker)
		{
			delete this.busy[workerid];
			this.available.push(worker);
		}
		//this.xlog.debug`workerDone ${workerid} B: busy ${Object.keys(this.busy).join(" ")}`;

		if(this.emptycb && this.empty)
			await this.emptycb();
	}

	get empty()
	{
		return this.queue.length===0 && Object.keys(this.busy).length===0;
	}

	// add the vals to the queue
	process(vals)
	{
		if(Array.force(vals).length>1)
			this.xlog.debug`process: Adding ${Array.force(vals).length} vals to queue...`;

		this.queue = this.queue.concat(Array.force(vals));	// use use concat instead of ...vals to avoid call stack overflow
	}

	// send a message to all workers
	async broadcast(msg)
	{
		await this.workers.parallelMap(async worker => await worker.send(msg), this.workers.length);
	}
}
