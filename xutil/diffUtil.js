import {xu, fg} from "xu";

export function diff(o, n, _options={})
{
	const options = Object.assign({}, _options);
	options.indent = (options.indent || 0) + 1;

	if(Object.isObject(o))
		return diffObjects(o, n, options);
	else if(Array.isArray(o))
		return diffArray(o, n, options);
	
	return diffValues(o, n);
}

function diffObjects(o, n, options={})
{
	let result = "";

	const oKeys = Object.keys(o);
	const nKeys = Object.keys(n);

	const keysAdded = nKeys.subtractAll(oKeys);
	keysAdded.forEach(keyAdded => { result += " ".repeat(options.indent*4) + fg.greenDim(`${keyAdded} : ${JSON.stringify(n[keyAdded])}`); });

	const keysRemoved = oKeys.subtractAll(nKeys);
	if(!options.ignoreRemovedKeys)
		keysRemoved.forEach(keyRemoved => { result += " ".repeat(options.indent*4) + fg.redDim(`${keyRemoved} : ${JSON.stringify(o[keyRemoved])}`); });

	oKeys.subtractAll(keysAdded).subtractAll(keysRemoved).forEach(key =>
	{
		const subResult = diff(o[key], n[key], options);
		if(subResult)
			result += " ".repeat(options.indent*4) + fg.yellowDim(key) + fg.whiteDim(" : ") + subResult;
	});

	return (result.length ? "{\n" : "") + result + (result.length ? "}\n" : "");
}

function diffArray(o, n, options)
{
	let result = "";

	if(options.compareArraysDirectly)
	{
		if(o.length!==n.length)
		{
			result += `Arrays are not equal length, cannot compare them directly: old [${o.length}] vs new [${n.length}]`;
		}
		else
		{
			o.forEach((item, i) =>
			{
				const subResult = diff(item, n[i], options);
				if(subResult)
					result += `${" ".repeat(options.indent*4)}[${i}]${options.arrayKey && Object.hasOwn(item, options.arrayKey) ? (` ${item[options.arrayKey]}`) : ""}: ${subResult}`;
			});
		}
	}
	else
	{
		n.map(v => JSON.stringify(v)).subtractAll(o.map(v => JSON.stringify(v))).forEach(added => { result += (result.length ? ", " : "") + fg.greenDim(added); });
		o.map(v => JSON.stringify(v)).subtractAll(n.map(v => JSON.stringify(v))).forEach(removed => { result += (result.length ? ", " : "") + fg.redDim(removed); });
	}

	return (result.length ? "[ " : "") + result + (result.length ? " ]\n" : "");
}

function diffValues(o, n)
{
	if(o!==n)
	{
		const color = typeof o==="string" ? "magenta" : "white";
		return `${fg[color](JSON.stringify(o)) + fg.yellowDim(" => ") + fg[color](JSON.stringify(n))}\n`;
	}

	return "";
}

