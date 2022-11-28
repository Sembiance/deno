import {memInfo, getAvailablePorts, getAvailablePort, pidMemInfo} from "../sysUtil.js";
import {assert} from "std";


Deno.test("memInfo", async () =>
{
	const a = await memInfo();
	assert(typeof a.total==="number");
	assert(typeof a.available==="number");
	assert(typeof a.usedPercent==="number");

	assert(a.total>0);
	assert(a.available>0);
	assert(a.usedPercent>0);

	assert(a.total>a.available);
});

Deno.test("getAvailablePorts", () =>
{
	assert((getAvailablePorts()).length===1);
	const ports = getAvailablePorts(2222);
	assert(ports.length===2222);
	assert(ports.unique().length===2222);
	assert(typeof getAvailablePort()==="number");
});

Deno.test("pidMemInfo", async () =>
{
	const a = await pidMemInfo(Deno.pid);
	assert(a.vmRSS>0);
});
