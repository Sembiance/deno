import {xu} from "xu";
import {agentInit} from "AgentPool";
import {delay} from "std";

await agentInit(async msg =>
{
	if(msg.broadcast)
		return console.log("got broadcast message: ", msg);

	if(msg.delay)
		await delay(msg.delay);

	console.error(`error for id ${msg.id}`);

	return {id : msg.id, nums : msg.nums.map(v => v*2), str : msg.str.reverse(), bool : !msg.bool};
});
