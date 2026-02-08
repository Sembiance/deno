import {xu} from "xu";
import {run} from "./runUtil.js";
import {fileUtil, runUtil} from "xutil";

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

export async function coreCount()
{
	const {stdout} = await run("nproc");
	return +stdout.trim();
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

export async function getDiskUsage(mountPoints)
{
	const usages = {};
	const {stdout} = await runUtil.run("df", ["--sync", "--block-size=1", "--output=used,avail,target", ...mountPoints]);
	for(const line of stdout.trim().split("\n").slice(1))
	{
		const {used, avail, target} = (/^\s*(?<used>\d+)\s+(?<avail>\d+)\s+(?<target>.*)$/).exec(line)?.groups || {};
		usages[target] = {used : +used, available : +avail, target, percentageUsed : (+used/(+used + +avail))*100};
	}

	return usages;
}

export async function getCPUIdleUsage()
{
	const {stdout : mpstatRaw} = await run("mpstat", ["-o", "JSON", "1", "1"]);
	const mpstat = xu.parseJSON(mpstatRaw);
	return mpstat.sysstat.hosts[0].statistics[0]["cpu-load"][0].idle;
}

export async function optimalParallelism(totalCount)
{
	// if less than 5 just do 1 at a time to avoid calling out to mpstat for a small number of files
	if(totalCount<5)
		return 1;

	const idleUsage = await getCPUIdleUsage();
	return Math.max(1, Math.floor(idleUsage.scale(0, 100, 1, navigator.hardwareConcurrency*0.50)));
}

export async function getAudioPlaybackDevices()
{
	const devices = [];

	const lines = (await runUtil.run("aplay", ["-l"])).stdout.trim().split("\n");
	for(const line of lines)
	{
		if(!line.startsWith("card"))
			continue;

		const {num, shortName, longName} = line.match(/card (?<num>\d+): (?<shortName>[^ ]+) \[(?<longName>[^\]]+)].*/).groups;
		devices.push({num : +num, shortName, longName});
	}

	return devices;
}
