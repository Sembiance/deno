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
		this.busyCount = 0;
		this.busyValues = {};
		this.xlog = xlog;
		this.workercb = workercb;
		this.emptycb = emptycb;
		this.crashcb = crashcb;
		this.stopped = false;
		this.crashRecover = crashRecover;
		this.recoverArgs = {};
	}

	async start(fun, {size=navigator.hardwareConcurrency, imports, runEnv}={})
	{
		this.workers = await [].pushSequence(0, size-1).parallelMap(async workerid =>
		{
			const xworkRunOpts = {xlog : this.xlog, imports, runEnv, detached : true, runArgs : [workerid.toString(), size.toString()], exitcb : status => this.workerExit(workerid, status), recvcb : msg => this.workerDone(workerid, msg)};
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
		this.workers.find(worker => worker.workerid===workerid).exited = true;

		// remove it from busy and available
		delete this.busy[workerid];
		this.busyCount--;
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
			this.workers[workerid] = worker;
			this.available.push(worker);
		}
	}

	async stop()
	{
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
			await xu.waitUntil(() => !this.ready || (this.available.length>0 && this.queue.length>0));
			if(!this.ready)
			{
				this.stopped = true;
				break;
			}

			const worker = this.available.pop();
			if(!worker)
				continue;

			this.busy[worker.workerid] = worker;
			this.busyCount++;
			this.busyValues[worker.workerid] = this.queue.pop();
			await worker.send(this.busyValues[worker.workerid]);
		}
	}

	async workerDone(workerid, r)
	{
		delete this.busyValues[workerid];
		
		const worker = this.busy[workerid];
		if(!worker)
			this.xlog.warn`Worker done but pool says worker ${workerid} is not busy!`;

		if(this.workercb)
			await this.workercb(workerid, r);

		if(worker)
		{
			delete this.busy[workerid];
			this.busyCount--;
			this.available.push(worker);
		}

		if(this.emptycb && this.empty)
			await this.emptycb();
	}

	get empty()
	{
		return this.queue.length===0 && this.busyCount===0;
	}

	// add the vals to the queue
	process(vals)
	{
		this.queue = Array.force(vals).reverse().concat(this.queue);	// use use concat instead of ...arr to avoid call stack overflow
	}

	// send a message to all workers
	async broadcast(msg)
	{
		await this.workers.parallelMap(async worker => await worker.send(msg), this.workers.length);
	}

	// Process a given array of values via a worker pool. WARNING! ORDERING OF MAP VALUES ARE NOT MAINTAINED!
	static async quickProcess(arr, fun, xWorkOptions={})
	{
		const size = Math.min(xWorkOptions.size || navigator.hardwareConcurrency, arr.length);
		let empty = false;
		const results = [];
		const pool = new XWorkerPool({crashcb : (workerid, status, v) => console.error(`worker ${workerid} crash with status ${status} and value ${v}`), workercb : (workerid, result) => results.push(result), emptycb : () => { empty = true; }, xlog : xWorkOptions.xlog});
		await pool.start(fun, {...xWorkOptions, size});
		pool.process(arr);
		await xu.waitUntil(() => empty===true);
		await pool.stop();
		return results;
	}
}
