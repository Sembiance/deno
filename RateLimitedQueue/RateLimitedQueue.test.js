import {xu} from "xu";
import {RateLimitedQueue} from "./RateLimitedQueue.js";
import {delay} from "std";

Deno.test("rateLimitedQueue", async () =>
{
	const rlq = new RateLimitedQueue(2, xu.SECOND);
	rlq.start();
	console.log(`${performance.now()} START!`);

	await [].pushSequence(1, 10).parallelMap(async v =>
	{
		await rlq.wait();
		console.log(`${performance.now()} GO ${v}`);
		await delay(Math.randomInt(70, 2000));
	}, 100);

	await rlq.stop();
});


