export async function monitor(dirPath, cb, {queueFor=50, includeDotFiles}={})
{
	let lastEvent = null;
	let publishTimer = null;
	const publishEvent = event =>
	{
		if(lastEvent && lastEvent.type===event.type && lastEvent.filePath===event.filePath)
		{
			lastEvent.when = event.when;
			return;
		}

		if(lastEvent)
		{
			if(publishTimer)
			{
				clearTimeout(publishTimer);
				publishTimer = null;
			}

			cb(lastEvent);
		}

		lastEvent = event;
		publishTimer = setTimeout(() =>
		{
			const eventToPublished = lastEvent;
			lastEvent = null;
			publishTimer = null;
			cb(eventToPublished);
		}, queueFor);
	};
	
	const linecb = async line =>
	{
		if(line.startsWith("Setting up watches"))
			return;

		if(line.trim()==="Watches established.")
			return await cb({type : "ready"});

		let {when, events, filePath} = line.match(/^(?<when>\d+) (?<events>[^ ]+) (?<filePath>.+)$/)?.groups || {};		// eslint-disable-line prefer-const
		if(!when)
			return console.error(`Failed to parse inotifywait line: ${line}`);
		if(!includeDotFiles && path.basename(filePath).startsWith("."))
			return;
	
		events = events.split(",");

		const o = {when : new Date((+when*xu.SECOND)), filePath};
		if(events.includesAny(["CREATE", "MOVED_TO"]))
			o.type = "create";
		else if(events.includesAny(["CLOSE_WRITE", "MODIFY", "ATTRIB"]))
			o.type = "modify";
		else if(events.includesAny(["DELETE", "MOVED_FROM"]))
			o.type = "delete";
		else
			o.type = `UNKNOWN: ${events.join(",")}`;
		
		publishEvent(o);
	};

	const {p} = await runUtil.run("inotifywait", ["-mr", "--timefmt", "%s", "--format", "%T %e %w%f", "-e", "create", "-e", "close_write", "-e", "delete", "-e", "moved_from", "-e", "moved_to", "-e", "modify", "-e", "attrib", dirPath], {detached : true, stdoutcb : linecb, stderrcb : linecb});
	return {stop : async () => await runUtil.kill(p)};
}
