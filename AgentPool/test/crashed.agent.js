import {xu} from "xu";
import {path, delay} from "std";
import {fileUtil} from "xutil";
import {agentInit} from "AgentPool";

await delay(xu.SECOND*5);
await agentInit(async ({v}) =>
{
	const seenOnceFile = path.join(Deno.env.get("AGENT_CWD"), "seenOnce");
	if(!await fileUtil.exists(seenOnceFile))
	{
		await fileUtil.writeTextFile(seenOnceFile, "seen");
		Deno.exit(47);
	}
	
	return {recovered : true, v};
});
