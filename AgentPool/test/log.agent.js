import {xu} from "xu";
import {agentInit} from "AgentPool";
import {delay} from "std";

await agentInit(async msg =>
{
	if(msg.broadcast)
		return console.log("got broadcast message: ", msg);

	if(msg.delay)
		await delay(msg.delay);

	if(msg.id%5===0)
		console.log(`stdout for id ${msg.id}`);

	if(msg.id%7===0)
	{
		console.error(`error #1 for id ${msg.id}`);
		console.error(`error #2 for id ${msg.id}`);
	}

	return {id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool};
});
