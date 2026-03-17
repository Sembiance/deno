import {xu} from "xu";
import {RateLimiter} from "./RateLimiter.js";
import {delay, assert} from "std";

function assertRateLimits(goTimes, limits)
{
	const sorted = goTimes.toSorted((a, b) => a-b);
	for(const {per, period} of limits)
	{
		for(let i=0;i<sorted.length;i++)
		{
			const count = sorted.filter(t => t>=sorted[i] && t<sorted[i]+period).length;
			assert(count<=per, `Exceeded ${per}/${period}ms limit: ${count} ops in window starting at index ${i}`);
		}
	}
}

Deno.test("rateLimiter", async () =>
{
	const limits = [{per : 2, period : xu.SECOND}];
	const limiter = new RateLimiter(...limits.flatMap(l => [l.per, l.period]));
	limiter.start();

	const goTimes = [];
	await [].pushSequence(1, 10).parallelMap(async () =>
	{
		await limiter.wait();
		goTimes.push(performance.now());
		await delay(Math.randomInt(70, 2000));
	}, 100);

	await limiter.stop();
	assertRateLimits(goTimes, limits);
});

Deno.test("rateLimiterMulti", async () =>
{
	const limits = [{per : 3, period : xu.SECOND}, {per : 5, period : 3*xu.SECOND}];
	const limiter = new RateLimiter(...limits.flatMap(l => [l.per, l.period]));
	limiter.start();

	const goTimes = [];
	await [].pushSequence(1, 15).parallelMap(async () =>
	{
		await limiter.wait();
		goTimes.push(performance.now());
		await delay(Math.randomInt(70, 2000));
	}, 100);

	await limiter.stop();
	assertRateLimits(goTimes, limits);
});
