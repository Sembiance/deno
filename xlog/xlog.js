import {xu, fg} from "xu";
import {path, dateFormat} from "std";
import {fileUtil, printUtil} from "xutil";

const LEVELS = ["none", "fatal", "error", "warn", "info", "debug", "trace"];

/** Creates a log object that has xlog.<level>``; functions to only log if verbose level is set high enough */
export class XLog
{
	logLines = [];

	// noANSI does not need to be set if you have a logFilePath or logger set
	constructor(level="info", {logger, mapper, logFilePath, noANSI, alwaysEcho, includeDateTime, inspectOptions={}}={})
	{
		this.lastMessageAt = performance.now();
		this.level = level;
		this.logger = logger;
		this.mapper = mapper;
		this.logFilePath = logFilePath;
		this.noANSI = noANSI;
		this.alwaysEcho = alwaysEcho;
		this.signalHandler = async () => await this.flush();
		this.inspectOptions = inspectOptions;
		this.includeDateTime = includeDateTime;

		if(this.logFilePath)
			Deno.addSignalListener("SIGUSR2", this.signalHandler);

		for(const levelName of LEVELS)
		{
			if(levelName==="none")
				continue;
				
			this[levelName] = (strs, ...vals) =>
			{
				if(!this.atLeast(levelName))
					return;

				const r = [];
				if(this.includeDateTime)
					r.push(`${fg.brown(dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss"))} `);
				if(this.atLeast("trace"))
				{
					const sinceLast = performance.now()-this.lastMessageAt;
					this.lastMessageAt = performance.now();
					r.push(`${fg.peach(`${sinceLast.toFixed(2)}ms`.padStart(10, " "))} `);
				}

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
							r.push(printUtil.inspect(val, this.inspectOptions));
					}
				});

				let s = r.join("");
				if(this.mapper)
					s = this.mapper(s);
				
				if(!s)
					return s;
				
				const prefixColor = {warn : "yellow", error : "red", fatal : "red"}[levelName];
				if(prefixColor)
					s = `${fg[prefixColor]((levelName==="fatal" ? xu.c.blink : "") + levelName.toUpperCase())}${fg.cyan(":")} ${s}`;

				if(this.logFilePath)
					this.logLines.push(`${s}\n`);
				
				const outText = noANSI ? s.decolor() : s;

				if(this.logger)
					this.logger(outText);
				
				if((!this.logFilePath && !this.logger) || this.alwaysEcho)
					console[(["fatal", "error"].includes(levelName) ? "error" : "log")](outText);
				
				return outText;
			};
		}
	}

	timeStart(strs, ...vals)
	{
		this.timePoint = performance.now();
		this.info(strs, ...vals);
	}

	elapsed(strs, ...vals)
	{
		if(!Object.hasOwn(this, "timePoint"))
			return this.timeStart(strs, ...vals);

		const elapsed = performance.now()-this.timePoint;
		this.timePoint = performance.now();
		this.info([`(elapsed ${(elapsed/xu.SECOND).secondsAsHumanReadable()}) ${strs[0]}`, ...strs.slice(1)], ...vals);
	}

	cleanup()
	{
		Deno.removeSignalListener("SIGUSR2", this.signalHandler);
	}

	/* will flush the current logLines to filePath */
	async flush()
	{
		if(!this.logFilePath || this.logLines.length===0)
			return;

		const logLinesCopy = this.logLines.slice();
		this.logLines.clear();

		await fileUtil.writeTextFile(this.logFilePath, logLinesCopy.join("").decolor(), {append : true});
	}

	atLeast(logLevel)
	{
		if(this.level==="none")
			return false;

		return LEVELS.indexOf(this.level)>=LEVELS.indexOf(logLevel);
	}

	/* returns a shallow copy, assigning a possible new log level but keeping the old logger function if present */
	clone(newLogLevel)
	{
		return new XLog(newLogLevel || this.level, {logger : this.logger, mapper : this.mapper, logFilePath : this.logFilePath, noANSI : this.noANSI, alwaysEcho : this.alwaysEcho, includeDateTime : this.includeDateTime, inspectOptions : this.inspectOptions});
	}
}
