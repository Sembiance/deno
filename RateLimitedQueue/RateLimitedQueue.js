import {xu} from "xu";
import {delay} from "std";

export class RateLimitedQueue
{
	status = "idle";
	times = [];
	queue = [];

	// limit the queue to <per> ops per <period>
	constructor(per, period)
	{
		this.period = period;
		this.per = per;
	}

	async wait()
	{
		const p = new Promise(resolve => this.queue.push(resolve));	// eslint-disable-line no-promise-executor-return
		await p;
	}

	// while this is an async function, it should be run 'in the background' so you shouldn't 'await' on this
	async start()
	{
		this.status = "running";

		while(this.status==="running")
		{
			// if the queue is empty, wait until it has something or we are to stop
			if(this.queue.length===0)
				await xu.waitUntil(() => this.queue.length>0 || this.status==="stop");
			
			if(this.status==="stop")
				break;
			
			// now we have something in the queue, let's check to see if we should wait until we act
			const rightNow = performance.now();

			// filter out any times outside of our period
			this.times.filterInPlace(t => (rightNow-t)<this.period);

			// if we have more outstanding calls in our period than per, wait
			if(this.times.length>=this.per)
				await delay((this.period-(rightNow-this.times.at(-1)))+1);
			
			// add our current time to the times
			this.times.unshift(performance.now());

			// grab the first item in the queue and call it, resolving the promise from the .wait() call
			this.queue.shift()();
		}

		this.status = "stopped";
	}

	async stop()
	{
		this.status = "stop";
		await xu.waitUntil(() => this.status==="stopped");
	}
}

