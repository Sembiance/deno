import {xu} from "xu";

/** prints out a single object in a tabular format where the keys are listed in column 1 and the values are in column 2 */
export function columnizeObject(o, options={})
{
	let rows = Object.entries(o);
	if(options.sorter)
		rows.sort(options.sorter);

	rows = options.formatter ? rows.map(options.formatter) : rows.map(row => { row[1] = (typeof row[1]==="number" ? row[1].toLocaleString() : row[1]); return row; });

	if(options.header)
		rows.unshift(options.header);

	options.alignment &&= options.alignment.map(a => a.charAt(0).toLowerCase());

	const maxColSizes = [];
	rows.forEach(row => row.forEach((col, i) => { maxColSizes[i] = Math.max((maxColSizes[i] || 0), `${(col)}`.decolor().length); }));

	if(options.header)
		rows.splice(1, 0, maxColSizes.map(maxColSize => xu.cf.fg.cyan("-".repeat(maxColSize))));

	let result = "";

	const spacing = options.padding || 5;
	rows.forEach((row, rowNum) =>
	{
		let rowOut = "";
		row.forEach((_col, i) =>
		{
			const col = `${_col}`;
			
			const a = (options.header && rowNum===0) ? "c" : (options.alignment ? (options.alignment[i] || "l") : "l");
			const colPadding = maxColSizes[i] - col.decolor().length;

			if(a==="c" || a==="r")
				rowOut += " ".repeat(Math.max(Math.floor(colPadding/(a==="c" ? 2 : 1)), 0));

			rowOut += col;

			if(a==="c" || a==="l")
				rowOut += " ".repeat(Math.max(Math.round(colPadding/(a==="c" ? 2 : 1)), 0));

			rowOut += " ".repeat(spacing);
		});

		result += `${rowOut}\n`;
	});

	return result;
}

/** prints out an array of objects in a columinized table */
export function columnizeObjects(objects, options={})
{
	const rows = xu.clone(objects);
	const colNames = options.colNames || rows.flatMap(object => Object.keys(object).filter(k => !k.startsWith("_"))).unique();
	const colNameMap = Object.assign(Object.fromEntries(colNames.map(colName => ([colName, colName.replace( /([A-Z])/g, " $1" ).toProperCase()]))), options.colNameMap || {});
	
	const alignmentDefault = options.alignmentDefault || "l";
	const colTypes = colNames.map(colName => (typeof rows[0][colName]));
	const booleanValues = options.booleanValues || ["True", "False"];

	if(options.sorter)
		rows.sort(options.sorter);

	function defaultFormatter(k, v, o, i)
	{
		if(colTypes[i]==="boolean")
			return booleanValues[v ? 0 : 1];
		if(colTypes[i]==="number")
			return (typeof v==="number" ? v.toLocaleString() : 0);

		return v===undefined ? "" : v;
	}

	rows.forEach(object => colNames.forEach((colName, i) => { object[colName] = (options.formatter || defaultFormatter)(colName, object[colName], object, i); }));

	const maxColSizeMap = {};

	rows.forEach(row => colNames.forEach(colName => { if(Object.hasOwn(row, colName)) { maxColSizeMap[colName] = Math.max((maxColSizeMap[colName] || 0), `${row[colName]}`.decolor().length, colNameMap[colName].length); } }));	// eslint-disable-line curly

	rows.unshift(Object.map(colNameMap, (k, v) => v), Object.map(colNameMap, k => [k, xu.cf.fg.cyan("-".repeat(maxColSizeMap[k]))]));

	let result = "";

	rows.forEach((row, rowNum) =>
	{
		let rowOut = "";
		colNames.forEach((colName, i) =>
		{
			const col = `${row[colName]}`;
			const a = rowNum===0 ? "c" : (options.alignment ? (options.alignment[colName] || alignmentDefault) : (colTypes[i]==="number" ? "r" : (colTypes[i]==="boolean" ? "c" : alignmentDefault)));
			const colPadding = maxColSizeMap[colName] - col.decolor().length;

			if(a==="c" || a==="r")
				rowOut += " ".repeat(Math.max(Math.floor(colPadding/(a==="c" ? 2 : 1)), 0));

			let color = rowNum===0 ? "white" : null;
			if(rowNum>1 && options && options.color && options.color[colName])
				color = (typeof options.color[colName]==="function") ? options.color[colName](objects[rowNum-2][colName], objects[rowNum-2]) : options.color[colName];

			rowOut += (color ? xu.cf.fg[color](col) : col);

			if(a==="c" || a==="l")
				rowOut += " ".repeat(Math.max(Math.round(colPadding/(a==="c" ? 2 : 1)), 0));

			rowOut += " ".repeat((options.padding ? (typeof options.padding==="function" ? options.padding(colName) : (Object.isObject(options.padding) ? (options.padding[colName] || 5) : options.padding)) : 5));
		});

		result += `${rowOut + (Object.hasOwn(row, "_suffix") ? row._suffix : "")}\n`;
	});

	return (options.noHeader ? result.split("\n").slice(2).join("\n") : result);
}

/** returns a nice pretty representation of val */
export function inspect(val, options={})
{
	return Deno.inspect(val, {colors : true, compact : true, depth : 7, iterableLimit : 200, strAbbreviateSize : 150, showProxy : false, sorted : false, trailingComma : false, getters : false, showHidden : false, ...options});
}

/** Prints out a multi-line pie chart */
export function multiLineBarChart(o, label="Label", lineLength=120)
{
	if(!o)
		return "";
	
	const r = [];

	const COLORS = Array(100).fill(["orange", "violet", "blueGreen", "chartreuse", "violetRed", "deepSkyblue", "fogGray"]).flat();
	const LINES = Object.entries(o).sort((a, b) => b[1]-a[1]);
	const TOTAL = Object.values(o).sum();
	const VALUES = LINES.map(line => `${xu.cf.fg.white(line[1].toLocaleString())} (${Math.round((line[1]/TOTAL)*100)}%)`);
	const longestKey = LINES.map(line => line[0].length).sort((a, b) => b-a)[0];
	const barLength = lineLength-(longestKey+2);

	r.push(`${" ".repeat(Math.round((lineLength-label.length)/2)) + xu.cf.fg.yellow(label)}\n`);
	r.push(`${xu.cf.fg.cyan("=").repeat(lineLength)}\n`);

	LINES.forEach((LINE, i) =>
	{
		r.push(`${xu.cf.fg.greenDim(LINE[0].padStart(longestKey))}${xu.cf.fg.cyan(":")} `);
		r.push(xu.cf.fg[COLORS[i]]("█".repeat(Math.max((LINE[1] > 0 ? 1 : 0), Math.round(barLength*(LINE[1]/TOTAL))))));
		r.push(` ${VALUES[i]}`);
		r.push("\n");
	});

	r.push("\n");
	return r.join("");
}

/** Prints out a single line boolean pie chart */
export function singleLineBooleanPie(o, label="Label", lineLength=120)
{
	const r=[];
	const COLORS = ["orange", "violet"];
	const barLength = lineLength-(label.length+2);
	const keys = Object.keys(o);
	const values = Object.values(o);
	const TOTAL = Object.values(o).sum();

	if(keys.length===1)
		keys.push(keys[0]==="true" ? "false" : "true");
	if(values.length===1)
		values.push(0);

	// Labels
	r.push(`${xu.cf.fg.white(label)}: `);
	r.push(xu.cf.fg.yellow(keys[0]));
	const firstValue = ` ${values[0].toLocaleString()} (${Math.round((values[0]/TOTAL)*100)}%)`;
	r.push(firstValue);
	const secondValue = ` ${values[1].toLocaleString()} (${Math.round((values[1]/TOTAL)*100)}%)`;
	r.push(" ".repeat(barLength-((keys[0].length+keys[1].length+firstValue.length+secondValue.length)-1)));
	r.push(xu.cf.fg.yellow(keys[1]));
	r.push(secondValue);
	r.push("\n");

	// Pie
	r.push(" ".repeat(label.length+1) + xu.cf.fg.cyan("["));
	values.forEach((v, i) => r.push(xu.cf.fg[COLORS[i]]("█".repeat(barLength*(v/TOTAL)))));
	r.push(xu.cf.fg.cyan("]"));

	return r.join("");
}

/** Prints out a major header that looks like this
/--------------\
| Major Header |
\--------------/  */
export function majorHeader(text, options={})
{
	const r=[];
	if(options.prefix)
		r.push(options.prefix);

	r.push(`${xu.cf.fg.cyan(`/${"-".repeat(text.decolor().length+2)}\\`)}\n`);
	r.push(`${xu.cf.fg.cyan("| ")}${xu.cf.fg.white(text)}${xu.cf.fg.cyan(" |")}\n`);
	r.push(`${xu.cf.fg.cyan(`\\${"-".repeat(text.decolor().length+2)}/`)}`);

	if(options.suffix)
		r.push(options.suffix);
	return r.join("");
}

/** Prints out a minor header that looks like this
Minor Header
------------ */
export function minorHeader(text, options={})
{
	const r=[];
	if(options.prefix)
		r.push(options.prefix);

	r.push(`${xu.cf.fg.white(text)}\n`);
	r.push(`${xu.cf.fg.cyan("-".repeat(text.decolor().length))}`);

	if(options.suffix)
		r.push(options.suffix);
	return r.join("");
}

/** Prints out a list of items with an optional "header" in options  */
export function list(items, options={})
{
	const r=[];
	if(options.prefix)
		r.push(options.prefix);

	if(options.header)
	{
		const headerArgs = [options.header, (options.headerColor ? { color : options.headerColor } : undefined)];
		if(options.headerType==="major")
			r.push(majorHeader(...headerArgs));
		else
			r.push(minorHeader(...headerArgs), "\n");
	}

	items.forEach(item => r.push(`${" ".repeat(options.indent || 2)}${xu.cf.fg.yellow("*")} ${item}\n`));

	if(options.suffix)
		r.push(options.suffix);
	
	return r.join("");
}

const stdoutEncoder = new TextEncoder();
export function stdoutWrite(str)
{
	Deno.stdout.writeSync(stdoutEncoder.encode(str));
}

/* eslint-disable unicorn/no-hex-escape */
class Progress
{
	constructor({min=0, max=100, barWidth=70, status="", includeCount=true, includeDuration, includePer, perSampleCount=20, dontAutoFinish}={})
	{
		this.min = min;
		this.max = max;
		this.barWidth = barWidth;
		this.status = status;
		this.includeCount = includeCount;
		this.includeDuration = includeDuration;
		this.includePer = includePer;
		this.maxLength = this.max.toLocaleString().length;
		this.lastValue = min;
		this.lastPerValue = this.lastValue;
		this.startedAt = performance.now();
		this.lastPerTime = this.startedAt;
		this.perText = this.includePer ? "     ?/s" : null;
		this.perTextValues = [];
		this.perSampleCount = perSampleCount;
		this.dontAutoFinish = dontAutoFinish;

		stdoutWrite(`${xu.c.cursor.hide}${xu.c.fg.cyan}[${" ".repeat(barWidth)}]`);
		this.set(min);
	}

	set(v, status=this.status)
	{
		if(this.includePer)
		{
			const now = performance.now();
			const timeDiff = now-this.lastPerTime;
			if(timeDiff>=250)
			{
				this.perTextValues.push(Math.floor((v-this.lastPerValue)/(timeDiff/xu.SECOND)));
				this.perTextValues = this.perTextValues.slice(-this.perSampleCount);
				this.perText = `${Math.floor(this.perTextValues.average()).toLocaleString().padStart(6, " ")}/s`;
				this.lastPerValue = v;
				this.lastPerTime = now;
			}
		}

		v = Math.max(Math.min(v, this.max), this.min);
		this.lastValue = v;
		const pos = Math.floor(v.scale(this.min, this.max, 0, this.barWidth));
		stdoutWrite(`\x1B[2G${xu.c.fg.white}${"=".repeat(pos>0 ? pos-1 : 0)}${pos>0 ? ">" : ""}${" ".repeat(this.barWidth-pos)}`);

		let curPos = this.barWidth+4;
		if(this.includeCount)
		{
			stdoutWrite(`\x1B[${curPos}G${xu.c.fg.white}${v.toLocaleString().padStart(this.maxLength)} ${xu.c.fg.cyan}/${xu.c.fg.white} ${this.max.toLocaleString().padStart(this.maxLength)}  `);
			curPos += (this.maxLength*2)+5;
		}

		const percent = ((v/this.max)*100).toFixed(2).padStart(6, " ");
		stdoutWrite(`\x1B[${curPos}G${xu.c.fg.white}${percent}${xu.c.fg.cyan}% `);
		curPos += 6+2;

		if(this.includeDuration)
		{
			const durationText = (performance.now()-this.startedAt).msAsHumanReadable({short : true, maxParts : 2, pad : false}).padStart(7);
			stdoutWrite(`\x1B[${curPos}G${xu.c.fg.white} ${durationText} `);
			curPos += durationText.length+2;
		}

		if(this.perText)
		{
			stdoutWrite(`\x1B[${curPos}G${xu.c.fg.white}${this.perText} `);
			curPos += this.perText.length+1;
		}

		stdoutWrite(`\x1B[${curPos}G${status===undefined ? "" : `${xu.c.fg.whiteDim}${status}${" ".repeat(Math.max(this.status.length-status.length, 0))}`}`);
		if(status)
			this.status = status;
		if(v===this.max && !this.dontAutoFinish)
			this.finish();
	}

	setStatus(status)
	{
		this.set(this.lastValue, status);
	}

	incrementBy(amount)
	{
		this.set(this.lastValue+amount);
	}

	increment(status)
	{
		this.set(++this.lastValue, status);
	}

	tick(status)
	{
		this.increment(status);
	}

	incrementMax(increaseBy=1)
	{
		this.setMax(this.max+increaseBy);
	}

	setMax(max)
	{
		this.max = max;
		this.maxLength = this.max.toLocaleString().length;
		this.set(this.lastValue);
	}

	finish(msg="")
	{
		console.log(`${msg}${xu.c.reset}${xu.c.cursor.show}`);
	}
}
/* eslint-enable unicorn/no-hex-escape */

export function progress(o)
{
	return new Progress(o);
}

