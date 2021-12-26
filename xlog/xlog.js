import {xu, fg} from "xu";
import {path} from "std";

const LEVELS = ["none", "fatal", "error", "warn", "info", "debug", "trace"];

/** Creates a log object that has xlog.<level>``; functions to only log if verbose level is set high enough */
export class XLog
{
	logLines = [];

	constructor(level="info", {logger, mapper, logFilePath}={})
	{
		this.level = level;
		this.logger = logger;
		this.mapper = mapper;
		this.logFilePath = logFilePath;
		this.signalHandler = async () => await this.flush();

		if(this.logFilePath)
			Deno.addSignalListener("SIGUSR2", this.signalHandler);

		for(const levelName of LEVELS)
		{
			if(levelName==="none")
				continue;
				
			this[levelName] = function log(strs, ...vals)
			{
				if(!this.atLeast(levelName))
					return;

				const r = [];
				if(this.atLeast("debug"))
				{
					const stackTrace = (new Error()).stack.split("\n");	// eslint-disable-line unicorn/error-message
					const {filePath, lineNum} = (stackTrace[2].match(/\(?file:\/\/(?<filePath>[^):]+):?(?<lineNum>\d*):?\d*\)?$/) || {groups : {}}).groups;		// can add to beginning for methodName: ^\s+at (?<methodName>[^(]*) ?
					r.push(`${fg.black(`${path.basename(filePath)}:${lineNum.padStart(3, " ")}`)}${fg.cyanDim(":")} `);
				}
				
				strs.forEach(str =>
				{
					r.push(str);

					if(vals.length>0)
					{
						const val = vals.shift();
						if(typeof val==="string")
							r.push(xu.cf.fg.greenDim(val));
						else
							r.push(xu.inspect(val));
					}
				});

				let s = r.join("");
				if(this.mapper)
					s = this.mapper(s);
				
				const prefixColor = {warn : "yellow", error : "red", fatal : "red"}[levelName];
				if(prefixColor)
					s = `${fg[prefixColor]((levelName==="fatal" ? xu.c.blink : "") + levelName.toUpperCase())}${fg.cyan(":")} ${s}`;

				if(this.logFilePath)
					this.logLines.push(`${s}\n`);

				if(this.logger)
					this.logger(s);
				
				if(!this.logFilePath && !this.logger)
					console.log(s);
			};
		}
	}

	cleanup()
	{
		Deno.removeSignalListener("SIGUSR2", this.signalHandler);
	}

	/* will flush the current logLines to filePath */
	async flush()
	{
		if(!this.logFilePath)
			return;

		await Deno.writeTextFile(this.logFilePath, this.logLines.join("").decolor(), {append : true});
		this.logLines.clear();
	}

	atLeast(logLevel)
	{
		return LEVELS.indexOf(this.level)>=LEVELS.indexOf(logLevel);
	}

	/* returns a shallow copy, assigning a possible new log level but keeping the old logger function if present */
	clone(newLogLevel)
	{
		return new XLog(newLogLevel || this.level, {logger : this.logger, mapper : this.mapper, logFilePath : this.logFilePath});
	}
}
