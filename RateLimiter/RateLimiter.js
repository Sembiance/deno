import {xu} from "xu";
import {delay} from "std";

export class RateLimiter
{
	status = "idle";
	times = [];
	queue = [];

	// limit the queue to any number of per/period pairs, e.g. new RateLimitedQueue(5, xu.SECOND, 100, xu.MINUTE)
	constructor(...args)
	{
		if(args.length===0 || args.length%2!==0)
			throw new Error("Expected pairs of per, period arguments");

		this.limits = [];
		for(let i=0;i<args.length;i+=2)
			this.limits.push({per : args[i], period : args[i+1]});

		this.maxPeriod = Math.max(...this.limits.map(l => l.period));
	}

	// call this await rlq.wait(); whenever you are about to perform an op, and this will ensure you don't go over the rate limit
	async wait()
	{
		if(this.status!=="running")
			throw new Error("Queue not running");

		const p = new Promise((resolve, reject) => this.queue.push({resolve, reject}));	// eslint-disable-line no-promise-executor-return
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
			
			// now we have something in the queue, let's wait if needed to stay within our rate limits
			while(true)
			{
				const now = performance.now();

				// clean up times older than the longest period
				this.times.filterInPlace(t => (now-t)<this.maxPeriod);

				// find the longest delay needed across all limits
				let maxDelay = 0;
				for(const limit of this.limits)
				{
					const timesInPeriod = this.times.filter(t => (now-t)<limit.period);
					if(timesInPeriod.length>=limit.per)
					{
						const neededDelay = (limit.period-(now-timesInPeriod.at(-1)))+1;
						if(neededDelay>maxDelay)
							maxDelay = neededDelay;
					}
				}

				if(maxDelay===0)
					break;

				await delay(maxDelay);

				if(this.status==="stop")
					break;
			}

			if(this.status==="stop")
				break;
			
			// add our current time to the times
			this.times.unshift(performance.now());

			// grab the first item in the queue and call it, resolving the promise from the .wait() call
			this.queue.shift().resolve();
		}

		while(this.queue.length>0)
			this.queue.shift().reject(new Error("Queue was stopped"));

		this.status = "stopped";
	}

	async stop()
	{
		this.status = "stop";
		await xu.waitUntil(() => this.status==="stopped");
	}
}

