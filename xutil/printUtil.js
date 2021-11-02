import {xu} from "xu";

/** returns the string str without any ansi escape codes. Useful for measuring actual length of string that will be printed to the terminal */
export function decolor(str)
{
	return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");	// eslint-disable-line no-control-regex, unicorn/better-regex, unicorn/escape-case
}

/** prints out a single object in a tabular format where the keys are listed in column 1 and the values are in column 2 */
export function columnizeObject(o, options={})
{
	let rows = Object.entries(o);
	if(options.sorter)
		rows.sort(options.sorter);

	rows = options.formatter ? rows.map(options.formatter) : rows.map(row => { row[1] = (typeof row[1]==="number" ? row[1].toLocaleString() : row[1]); return row; });

	if(options.header)
		rows.unshift(options.header);

	if(options.alignment)
		options.alignment = options.alignment.map(a => a.charAt(0).toLowerCase());

	const maxColSizes = [];
	rows.forEach(row => row.forEach((col, i) => { maxColSizes[i] = Math.max((maxColSizes[i] || 0), decolor(`${(col)}`).length); }));

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
			const colPadding = maxColSizes[i] - decolor(col).length;

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
	const colNameMap = Object.assign(Object.fromEntries(colNames.map(colName => ([colName, colName.replace( /([A-Z])/g, " $1" ).toProperCase()]))), options.colNameMap || {});	// eslint-disable-line prefer-named-capture-group
	
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

		return typeof v==="undefined" ? "" : v;
	}

	rows.forEach(object => colNames.forEach((colName, i) => { object[colName] = (options.formatter || defaultFormatter)(colName, object[colName], object, i); }));

	const maxColSizeMap = {};

	rows.forEach(row => colNames.forEach(colName => { if(Object.hasOwn(row, colName)) { maxColSizeMap[colName] = Math.max((maxColSizeMap[colName] || 0), decolor(`${row[colName]}`).length, colNameMap[colName].length); } }));	// eslint-disable-line curly

	rows.unshift(Object.map(colNameMap, (k, v) => v), Object.map(colNameMap, k => [k, xu.cf.fg.cyan("-".repeat(maxColSizeMap[k]))]));

	let result = "";

	rows.forEach((row, rowNum) =>
	{
		let rowOut = "";
		colNames.forEach((colName, i) =>
		{
			const col = `${row[colName]}`;
			const a = rowNum===0 ? "c" : (options.alignment ? (options.alignment[colName] || alignmentDefault) : (colTypes[i]==="number" ? "r" : (colTypes[i]==="boolean" ? "c" : alignmentDefault)));
			const colPadding = maxColSizeMap[colName] - decolor(col).length;

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

/** Prints out a multi-line pie chart */
export function multiLineBarChart(o, label="Label", lineLength=120)
{
	if(!o)
		return;

	const COLORS = Array(100).fill(["orange", "violet", "blueGreen", "chartreuse", "violetRed", "deepSkyblue", "fogGray"]).flat();
	const LINES = Object.entries(o).sort((a, b) => b[1]-a[1]);
	const TOTAL = Object.values(o).sum();
	const VALUES = LINES.map(line => `${xu.cf.fg.white(line[1].toLocaleString())} (${Math.round((line[1]/TOTAL)*100)}%)`);
	const longestKey = LINES.map(line => line[0].length).sort((a, b) => b-a)[0];
	const barLength = lineLength-(longestKey+2);

	xu.stdoutWrite(`${" ".repeat(Math.round((lineLength-label.length)/2)) + xu.cf.fg.yellow(label)}\n`);
	xu.stdoutWrite(`${xu.cf.fg.cyan("=").repeat(lineLength)}\n`);

	LINES.forEach((LINE, i) =>
	{
		xu.stdoutWrite(`${xu.cf.fg.greenDim(LINE[0].padStart(longestKey))}${xu.cf.fg.cyan(":")} `);
		xu.stdoutWrite(xu.cf.fg[COLORS[i]]("█".repeat(Math.max((LINE[1] > 0 ? 1 : 0), Math.round(barLength*(LINE[1]/TOTAL))))));
		xu.stdoutWrite(` ${VALUES[i]}`);
		xu.stdoutWrite("\n");
	});

	xu.stdoutWrite("\n");
}

/** Prints out a single line boolean pie chart */
export function singleLineBooleanPie(o, label="Label", lineLength=120)
{
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
	xu.stdoutWrite(`${xu.cf.fg.white(label)}: `);
	xu.stdoutWrite(xu.cf.fg.yellow(keys[0]));
	const firstValue = ` ${values[0].toLocaleString()} (${Math.round((values[0]/TOTAL)*100)}%)`;
	xu.stdoutWrite(firstValue);
	const secondValue = ` ${values[1].toLocaleString()} (${Math.round((values[1]/TOTAL)*100)}%)`;
	xu.stdoutWrite(" ".repeat(barLength-((keys[0].length+keys[1].length+firstValue.length+secondValue.length)-1)));
	xu.stdoutWrite(xu.cf.fg.yellow(keys[1]));
	xu.stdoutWrite(secondValue);
	xu.stdoutWrite("\n");

	// Pie
	xu.stdoutWrite(" ".repeat(label.length+1) + xu.cf.fg.cyan("["));
	values.forEach((v, i) => xu.stdoutWrite(xu.cf.fg[COLORS[i]]("█".repeat(barLength*(v/TOTAL)))));
	xu.stdoutWrite(xu.cf.fg.cyan("]"));

	xu.stdoutWrite("\n\n");
}

/** Prints out a major header that looks like this
/--------------\
| Major Header |
\--------------/  */
export function majorHeader(text, options={})
{
	if(options.prefix)
		xu.stdoutWrite(options.prefix);

	/* eslint-disable no-restricted-syntax */
	console.log(`${xu.c.fg.cyan}/${"-".repeat(text.length+2)}\\`);
	console.log(`${xu.c.fg.cyan}| ${xu.c.fg.white + text} ${xu.c.fg.cyan}|`);
	console.log(`${xu.c.fg.cyan}\\${"-".repeat(text.length+2)}/${xu.c.reset}`);
	/* eslint-enable no-restricted-syntax */

	if(options.suffix)
		xu.stdoutWrite(options.suffix);
}

/** Prints out a minor header that looks like this
Minor Header
------------ */
export function minorHeader(text, options={})
{
	if(options.prefix)
		xu.stdoutWrite(options.prefix);

	/* eslint-disable no-restricted-syntax */
	console.log(xu.c.fg.white + text);
	console.log(xu.c.fg.cyan + "-".repeat(text.length) + xu.c.reset);
	/* eslint-enable no-restricted-syntax */

	if(options.suffix)
		xu.stdoutWrite(options.suffix);
}

/** Prints out a list of items with an optional "header" in options  */
export function list(items, options={})
{
	if(options.prefix)
		xu.stdoutWrite(options.prefix);

	if(options.header)
	{
		const headerArgs = [options.header, (options.headerColor ? { color : options.headerColor } : undefined)];
		if(options.headerType==="major")
			majorHeader(...headerArgs);
		else
			minorHeader(...headerArgs);
	}

	items.forEach(item => xu.stdoutWrite(`${" ".repeat(options.indent || 2)}${xu.cf.fg.yellow("*")} ${item}\n`));

	if(options.suffix)
		xu.stdoutWrite(options.suffix);
}
