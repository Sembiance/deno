import {xu} from "xu";
import {XLog} from "xlog";
import {assert, assertEquals, assertStrictEquals, delay, path} from "std";
import {fileUtil} from "xutil";
import {AgentPool} from "AgentPool";

Deno.test("liveOutput", async () =>
{
	const pool = new AgentPool(path.join(import.meta.dirname, "liveOutput.agent.js"));
	await pool.init();
	await pool.start({qty : 3, liveOutput : true});
	pool.process([].pushSequence(1, 3).map(id => ({id})));
	assert(await xu.waitUntil(() => pool.empty(), {timeout : xu.SECOND*5}));
	await pool.stop();
});
