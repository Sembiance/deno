import {xu} from "xu";
import {xwork} from "xwork";
import {XLog} from "xlog";

export class XWorkerPool
{
	constructor({workercb, emptycb, crashcb, xlog=new XLog("warn")}={})
	{
		this.queue = [];
		this.ready = false;
		this.workers = [];
		this.available = [];
		this.busy = {};
		this.xlog = xlog;
		this.workercb = workercb;
		this.emptycb = emptycb;
		this.crashcb = crashcb;
		this.stopped = false;
	}

	async start(fun, {size=navigator.hardwareConcurrency, imports}={})
	{
		this.xlog.debug`Starting worker pool of ${size} size...`;

		this.workers = await [].pushSequence(0, size-1).parallelMap(async workerid =>
		{
			const worker = await xwork.run(fun, workerid, {xlog : this.xlog, imports, detached : true, exitcb : status => this.workerExit(workerid, status), recvcb : msg => this.workerDone(workerid, msg)});
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
		this.workers.find(worker => worker.workerid===workerid).exited = true;
		
		// remove it from busy and available
		delete this.busy[workerid];
		this.available.filterInPlace(worker => worker.workerid!==workerid);
		
		if(this.stopping || !this.crashcb)
			return;
		
		await this.crashcb(workerid, status);
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
			const val = this.queue.shift();
			await worker.send(val);
		}
	}

	async workerDone(workerid, r)
	{
		const worker = this.busy[workerid];
		if(!worker)
			this.xlog.error`Worker done but pool says worker ${workerid} is not busy!`;

		this.xlog.debug`Worker ${workerid} done`;

		if(this.workercb)
			await this.workercb(workerid, r);

		delete this.busy[workerid];
		this.available.push(worker);

		if(this.emptycb && this.empty)
			await this.emptycb();
	}

	get empty()
	{
		return this.queue.length===0 && this.available.length===this.workers.length;
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
