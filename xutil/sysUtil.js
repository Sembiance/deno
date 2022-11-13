import {xu} from "xu";
import {run} from "./runUtil.js";

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

	await run("free", ["-m"], {stdoutcb : stdoutMemCB});

	return {total, available, usedPercent : Math.floor((1-(available/total))*100)};
}

export function getAvailablePorts(qty=1)
{
	return Array.from({length : qty}).fill(1).map(() => Deno.listen({port : 0})).map(l => { l.close(); return l.addr.port; });
}
