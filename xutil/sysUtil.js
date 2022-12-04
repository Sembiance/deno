import {xu} from "xu";
import {run} from "./runUtil.js";
import {fileUtil} from "xutil";

/* returns info about current system memory */
export async function memInfo()
{
	let total=0, available=0;
	const stdoutMemCB = line =>
	{
		if(!line.startsWith("Mem:"))
			return;
		
		const cols = line.innerTrim().split(" ");
		total = +cols[1];
		available = +cols.at(-1);
	};

	await run("free", ["-b"], {stdoutcb : stdoutMemCB});

	return {total, available, usedPercent : Math.floor((1-(available/total))*100)};
}

export function getAvailablePorts(qty=1)
{
	return Array.from({length : qty}).fill(1).map(() => Deno.listen({port : 0})).map(l => { l.close(); return l.addr.port; });
}

export function getAvailablePort()
{
	return getAvailablePorts(1)[0];
}

export async function pidMemInfo(pid=Deno.pid)
{
	const r = {};
	const pidStatusRaw = await fileUtil.readTextFile(`/proc/${pid}/status`);
	for(const line of pidStatusRaw.split("\n"))
	{
		if(line.startsWith("VmRSS"))
			r.vmRSS = line.innerTrim().split(" ")[1]*xu.KB;
	}
	return r;
}

export async function calcMaxProcs(idealCount=navigator.hardwareConcurrency*0.90, {expectedMemoryUsage=0, extraMemoryUsage=0, memoryUsageFactor=1.2, availableFactor=1}={})
{
	const totalExpectedMemoryUsage = (expectedMemoryUsage || (await pidMemInfo()).vmRSS) + extraMemoryUsage;
	const sysMemInfo = await memInfo();
	return Math.floor(Math.min((sysMemInfo.available*availableFactor)/(totalExpectedMemoryUsage*memoryUsageFactor), idealCount));
}
