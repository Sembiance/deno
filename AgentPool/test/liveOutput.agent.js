import {xu, fg} from "xu";
import {agentInit} from "AgentPool";

await agentInit(async msg =>	// eslint-disable-line require-await
{
	console.log(`${fg.green("EXPECTED")} ${fg.deepSkyblue("stdout")} from agent for msg.id: ${fg.cyan(msg.id.toString())}`);
	console.error(`${fg.green("EXPECTED")} ${fg.peach("stderr")} from agent for msg.id: ${fg.cyan(msg.id.toString())}`);
	return {id : msg.id};
});
