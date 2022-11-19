import {xu} from "xu";
import {xwork} from "xwork";
import {XLog} from "xlog";

export class XWorkerPool
{
	constructor({donecb, xlog=new XLog("warn")}={})
	{
		this.queue = [];
		this.ready = false;
		this.workers = [];
		this.available = [];
		this.busy = {};
		this.xlog = xlog;
		this.donecb = donecb;
		this.stopped = false;
	}

	async start(fun, {size=navigator.hardwareConcurrency, imports}={})
	{
		this.xlog.debug`Starting worker pool of ${size} size...`;

		this.workers = await [].pushSequence(0, size-1).parallelMap(async workerid =>
		{
			const worker = await xwork.run(fun, workerid, {imports, detached : true, recvcb : msg => this.workerDone(workerid, msg)});
			await worker.ready();
			worker.workerid = workerid;
			this.available.push(worker);
			return worker;
		}, size);

		this.ready = true;
		this.processQueue();
	}

	async stop()
	{
		this.xlog.debug`Stopping worker pool...`;

		await this.workers.parallelMap(async worker => await worker.kill(), this.workers.length);
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
			this.xlog.debug`Sending val from queue (size ${this.queue.length}) to worker ${worker.workerid}`;
			await worker.send(this.queue.shift());
		}
	}

	async workerDone(workerid, r)
	{
		const worker = this.busy[workerid];
		if(!worker)
			this.xlog.error`Worker done but pool says worker ${workerid} is not busy!`;

		this.xlog.debug`Worker ${workerid} done`;
		delete this.busy[workerid];
		this.available.push(worker);

		if(this.donecb)
			await this.donecb(workerid, r);
	}

	// add the vals to the queue
	process(vals)
	{
		this.xlog.debug`process: Adding ${Array.force(vals).length} vals to queue...`;

		this.queue = this.queue.concat(Array.force(vals));	// use use concat instead of ...vals to avoid call stack overflow
	}
}
