import {xu} from "xu";
import * as sysUtil from "../sysUtil.js";
import {assert, assertStrictEquals} from "std";

Deno.test("calcMaxProcs", async () =>
{
	const a = await sysUtil.calcMaxProcs(undefined, {expectedMemoryUsage : 8*xu.GB});
	assertStrictEquals(a, 12);
});

Deno.test("getAudioPlaybackDevices", async () =>
{
	const a = await sysUtil.getAudioPlaybackDevices();
	assert(a.length>3);
	assert(a.find(o => o.longName.includes("Shure MV5")));
	assert(a.find(o => o.longName.includes("DragonFly Red")));
});

Deno.test("getCPUIdleUsage", async () =>
{
	const a = await sysUtil.getCPUIdleUsage();
	assert(a>0 && a<100);
});

Deno.test("getDiskUsage", async () =>
{
	const mountPoints = ["/", "/mnt/ram", "/mnt/compendium"];
	const r = await sysUtil.getDiskUsage(mountPoints);
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

Deno.test("memInfo", async () =>
{
	const a = await sysUtil.memInfo();
	assert(typeof a.total==="number");
	assert(typeof a.available==="number");
	assert(typeof a.usedPercent==="number");

	assert(a.total>0);
	assert(a.available>0);
	assert(a.usedPercent>0);

	assert(a.total>a.available);
});


Deno.test("optimalParallelism", async () =>
{
	assertStrictEquals(await sysUtil.optimalParallelism(3), 1);
	assertStrictEquals(await sysUtil.optimalParallelism(300), 15);
	assertStrictEquals(await sysUtil.optimalParallelism(3000), 15);
});

Deno.test("pidMemInfo", async () =>
{
	const a = await sysUtil.pidMemInfo(Deno.pid);
	assert(a.vmRSS>0);
});
