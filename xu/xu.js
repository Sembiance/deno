import { delay } from "https://deno.land/std@0.111.0/async/mod.ts";
import * as path from "https://deno.land/std@0.111.0/path/mod.ts";
import {} from "./array.js";
import {} from "./math.js";
import {} from "./number.js";
import {} from "./object.js";
import {} from "./string.js";

const xu = {};
xu.SECOND = 1000;
xu.MINUTE = xu.SECOND*60;
xu.HOUR = xu.MINUTE*60;
xu.DAY = xu.HOUR*24;
xu.WEEK = xu.DAY*7;
xu.MONTH = xu.DAY*30.4375;
xu.YEAR = xu.DAY*365.25;

xu.BYTE = 1;
xu.KB = xu.BYTE*1000;
xu.MB = xu.KB*1000;
xu.GB = xu.MB*1000;
xu.TB = xu.GB*1000;
xu.PB = xu.TB*1000;

/* eslint-disable unicorn/escape-case, unicorn/no-hex-escape */
// https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
xu.c =
{
	reset     : "\x1b[0m",
	bold      : "\x1b[1m",
	dim       : "\x1b[2m",
	italic    : "\x1b[3m",
	underline : "\x1b[4m",
	blink     : "\x1b[5m",
	reverse   : "\x1b[7m",
	strike    : "\x1b[9m",
	bg        :
	{
		black   : "\x1b[40m",

		// bright colors
		red     : "\x1b[41m",
		green   : "\x1b[42m",
		yellow  : "\x1b[43m",
		blue    : "\x1b[44m",
		magenta : "\x1b[45m",
		cyan    : "\x1b[46m",
		white   : "\x1b[47m",

		// dim colors
		redDim     : "\x1b[41m",
		greenDim   : "\x1b[42m",
		yellowDim  : "\x1b[43m",
		blueDim    : "\x1b[44m",
		magentaDim : "\x1b[45m",
		cyanDim    : "\x1b[46m",
		whiteDim   : "\x1b[47m",

		// 256 colors
		peach       : "\x1b[48;5;203m",
		orange      : "\x1b[48;5;208m",
		violet      : "\x1b[48;5;93m",
		chartreuse  : "\x1b[48;5;190m",
		deepSkyblue : "\x1b[48;5;27m",
		violetRed   : "\x1b[48;5;163m",
		blueGreen   : "\x1b[48;5;23m",
		fogGray     : "\x1b[48;5;250m"
	},
	fg :
	{
		black   : "\x1b[90m",

		// bright colors
		red     : "\x1b[91m",
		green   : "\x1b[92m",
		yellow  : "\x1b[93m",
		blue    : "\x1b[94m",
		magenta : "\x1b[95m",
		cyan    : "\x1b[96m",
		white   : "\x1b[97m",

		// dim colors
		redDim     : "\x1b[31m",
		greenDim   : "\x1b[32m",
		yellowDim  : "\x1b[33m",
		blueDim    : "\x1b[34m",
		magentaDim : "\x1b[35m",
		cyanDim    : "\x1b[36m",
		whiteDim   : "\x1b[37m",

		// 256 colors
		peach       : "\x1b[38;5;203m",
		orange      : "\x1b[38;5;208m",
		violet      : "\x1b[38;5;93m",
		chartreuse  : "\x1b[38;5;190m",
		deepSkyblue : "\x1b[38;5;27m",
		violetRed   : "\x1b[38;5;163m",
		blueGreen   : "\x1b[38;5;23m",
		fogGray     : "\x1b[38;5;250m",
		brown       : "\x1b[38;5;94m"
	}
};
/* eslint-enable unicorn/escape-case, unicorn/no-hex-escape */

// This will convert the above exports.c so you can call xy.cf.fg.cyan("Cyan Color")
xu.cf = {};
function functionizeColors(src, dest)
{
	for(const [key, val] of Object.entries(src))
	{
		if(Object.isObject(val))
			functionizeColors(val, dest[key] = {});
		else
			dest[key] = str => `${src[key]}${str}${xu.c.reset}`;
	}
}
functionizeColors(xu.c, xu.cf);

/** clone the given value. Options: skipKeys : ["keyNames", "to", "skip"], shallow : true|false */
xu.clone = function clone(v, {skipKeys, shallow=false}={})
{
	return (Array.isArray(v) ? v.clone({shallow}) : (Object.isObject(v) ? Object.clone(v, {skipKeys, shallow}) : v));
};

/** freezes an object/array, making it immutable. Options: recursive : true|false */
xu.freeze = function freeze(o, {recursive}={})
{
	if(!Array.isArray(o) && !Object.isObject(o))
		return o;

	if(recursive)
		(Object.isObject(o) ? Object.values(o) : o).forEach(v => xu.freeze(v, true));

	Object.freeze(o);

	return o;
};

/** parses the given raw data as JSON and if it fails return the fallback */
xu.parseJSON = function parseJSON(raw, fallback)
{
	try
	{
		return JSON.parse(raw);	// eslint-disable-line no-restricted-syntax
	}
	catch
	{
		return fallback;
	}
};

/** template literaly that allows you to easily include multi-line strings and each line will be trimmed */
xu.trim = function trim(strs, ...vals)
{
	const r = [];
	strs.forEach(str =>
	{
		const rVals = [str];
		if(vals.length>0)
		{
			const val = vals.shift();
			rVals.push((typeof val==="object" ? JSON.stringify(val) : `${val}`));
		}

		r.push(...rVals.map(rVal => rVal.split("\n").map(line => line.trim()).join("\n")));
	});

	return r.join("").trim();
};

/** waits until the given async function fun returns a truthy value. Exponential delay, starting at 5ms */
xu.waitUntil = async function waitUntil(fun, interval)
{
	let i=0;
	while(!(await fun()))
		await delay(interval || Math.min(5*(i++), xu.SECOND));
};

/** returns the node equilivant __dirname when passed in import.meta */
xu.dirname = function dirname(meta)
{
	return path.resolve((new URL(".", meta.url)).pathname);
};

/** returns a nice pretty representation of val */
xu.inspect = function inspect(val)
{
	return Deno.inspect(val, {colors : true, compact : true, depth : 7, iterableLimit : 150, showProxy : false, sorted : false, trailingComma : false, getters : false, showHidden : false});
};

/** improved template literal version of console.log() with better depth settings  */
xu.log = function log(strs, ...vals)
{
	const r = [];
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

	console.log(r.join(""));
};

const stdoutEncoder = new TextEncoder();
xu.stdoutWrite = function stdoutWrite(str)
{
	Deno.stdout.writeSync(stdoutEncoder.encode(str));
};

const fg = xu.cf.fg;
export { xu, fg };
