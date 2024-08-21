import {xu} from "xu";
import {path, delay} from "std";
import {fileUtil} from "xutil";
import {agentInit} from "AgentPool";

await delay(xu.SECOND);
await agentInit(({v}) =>
{
	if(v===7)
		throw new Error("EXPECTED EXCEPTION DUE TO #7");
	
	return {good : true, v};
});
