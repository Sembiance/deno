import {xu} from "xu";
import {agentInit} from "AgentPool";
import {delay} from "std";

const status = [];

console.log("stdout from agent");
console.error("stderr from agent");
await agentInit(async msg =>
{
	if(msg.broadcast)
		return console.log("got broadcast message: ", msg);

	if(msg.delay)
		await delay(msg.delay);

	if(msg.memoryLeakTest)
		console.error(`invisible error for id #${msg.id}`);

	status.push(`handling ${msg.id}`);

	return {id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool};
}, () => status);
