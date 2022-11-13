import {memInfo, getAvailablePorts} from "../sysUtil.js";
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

Deno.test("memInfo", async () =>
{
	assert((await getAvailablePorts()).length===1);
	assert((await getAvailablePorts(222)).length===222);
});
