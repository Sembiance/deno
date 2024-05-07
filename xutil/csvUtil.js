import {xu} from "xu";

// TODO: Add parseFile support with: for await(const line of (await Deno.open(csvFilePath)).readable.pipeThrough(new TextDecoderStream()).pipeThrough(new TextLineStream()))
export function parse(raw, {fixCRLF=true, header=true, colidMapper, returnColids}={})
{
	if(!header)
		throw new Error("Only header supported right now");

	const lines = (fixCRLF ? raw.replaceAll("\r\n", "\n").trim() : raw).split("\n");
	const colids = [];
	const entries = [];
	let firstLine = true;

	for(const line of lines)
	{
		const entry = {};
		let inQuote = false;
		let lastCharWasQuote = false;
		let wasInQuote = false;
		const val = [];
		let coli = 0;

		const addValue = () =>	// eslint-disable-line no-loop-func
		{
			if(firstLine)
				colids.push(colidMapper ? colidMapper(val.join("").trim()) : val.join("").trim());	// trim header names so "id, name" is "id" and "name" with no trailing or leading spaces
			else
				entry[colids[coli]] = val.join("");

			coli++;
			inQuote = false;
			wasInQuote = false;
			val.clear();
		};

		const addChar = c =>
		{
			if(val.length===0)	// only allow quoted strings if it's right after the comma, otherwise treat quotes as just bare loose characters
			{
				if(c==='"')
					inQuote = true;
				else
					val.push(c);
			}
			else
			{
				if(c==='"')
				{
					if(lastCharWasQuote)
					{
						val.push('"');
						lastCharWasQuote = false;
						if(wasInQuote)
							inQuote = true;
					}
					else if(inQuote)
					{
						lastCharWasQuote = true;
						wasInQuote = true;
						inQuote = false;
					}
					else
					{
						lastCharWasQuote = false;
						val.push(c);
					}
				}
				else
				{
					lastCharWasQuote = false;
					val.push(c);
				}
			}
		};

		for(const c of line.split(""))
		{
			if(c==="," && !inQuote)
				addValue();
			else
				addChar(c);
		}

		addValue();	// add the last value

		if(firstLine)
			firstLine = false;
		else
			entries.push(entry);
	}

	return returnColids ? {colids, entries} : entries;
}
