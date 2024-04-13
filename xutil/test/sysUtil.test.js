import {xu} from "xu";
import {memInfo, pidMemInfo, getDiskUsage} from "../sysUtil.js";
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

Deno.test("pidMemInfo", async () =>
{
	const a = await pidMemInfo(Deno.pid);
	assert(a.vmRSS>0);
});

Deno.test("getDiskUsage", async () =>
{
	const mountPoints = ["/", "/mnt/ram", "/mnt/compendium"];
	const r = await getDiskUsage(mountPoints);
	assert(Object.keys(r).length===3);
	assert(Object.keys(r).includesAll(mountPoints));
	for(const mountPoint of mountPoints)
	{
		assert(r[mountPoint].used>0);
		assert(r[mountPoint].available>0);
		assert(r[mountPoint].target===mountPoint);
		assert(r[mountPoint].used<r[mountPoint].available);
	}
});
