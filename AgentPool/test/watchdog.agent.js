import {xu} from "xu";
import {agentInit} from "AgentPool";
import {delay} from "std";

await agentInit(async msg =>
{
	if(msg.v===7)
		await delay(xu.SECOND*5);
	return {v : msg.v};
});
