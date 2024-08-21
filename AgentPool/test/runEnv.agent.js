import {xu} from "xu";
import {agentInit} from "AgentPool";

await agentInit(msg => ({id : msg.id, envVar : Deno.env.get("AGENT_TEST_ENV_VAR")}));
