import {xu} from "xu";

/** Will run the given cmd and pass it the given args.
 * Options:
 *   cmdid				The program name/id
 *   desc				A textual description of the program
 *   version			Version numebr of the program
 *   opts				An object representing the various options that can be set. The key is the optid and each opt has properties:
 * 		allowed				An array of approved values
 * 		defaultValue		Set to the value you want it to hold if the user doesn't specify. If set, it implies hasValue.
 * 	 	desc				The description of this option
 * 		hasValue			Set to true if this option takes a value (otherwise the option is simply a boolean toggle)
 * 		required			Set to true to require this option be set
 *      short				Single letter to use as a short name. Default is first letter of the key (optid). Can set to null/undefined to omit short
 *      multiple            Whether or not multiple values can be specified for this option
 *      asString			Don't parse the number as anything other than a string
 *	 args				An array of objects representing the arguments this command takes. Each one has properties:
 *      allowed				An array of approved values
 * 		argid				The argument name/id
 *      defaultValue		Set to the value you want it to hold if the user doesn't specify. If set, it implies hasValue.
 *		desc				The description of this argument
 *		multiple			Whether or not multiple values can be specified for this argument
 *		required			Whether or not the argument is required
 */
export function cmdInit({cmdid="<program>", version="1.0.0", desc="", opts : _opts={}, args=[], testDenoArgs})
{
	const denoArgs = Array.from(testDenoArgs || Deno.args);
	const opts = {..._opts, help : {desc : "Show programs help"}, version : {desc : "Show program version"}};
	
	// Add short entries
	for(const [optid, opt] of Object.entries(opts))
	{
		if(!Object.hasOwn(opt, "short"))
			opt.short = optid.at(0).toLowerCase();
	}

	function showVersion()
	{
		console.log(version);
		Deno.exit(0);
	}

	function showUsage(errorMsg)
	{
		if(errorMsg)
			console.log(`Error: ${errorMsg}\n`);
			
		console.log(`Usage: ${cmdid}${Object.keys(opts).length>0 ? " [options]" : ""}${args.map(({argid, required, multiple}) => ` ${required ? "<" : "["}${argid}${multiple ? "..." : ""}${required ? ">" : "]"}`).join(" ").replaceAll("  ", " ")}`);
		if(desc.length>0)
			console.log(`\n${desc}`);

		const argOptPadding = Math.max("version".length, args.map(arg => arg.argid.length).max(), Object.entries(opts).map(([k, opt]) => k.length + (opt.hasValue ? " <value>".length : 0) + (opt.multiple ? 4 : 0)).max()) + 8;

		if(args.length>0)
			console.log(`\nArguments:\n${args.map(arg => `  ${arg.argid.padEnd(argOptPadding, " ")}${arg.desc}${arg.allowed ? ` (${arg.allowed.join(" | ")})` : ""}${Object.hasOwn(arg, "defaultValue") ? ` (Default: ${arg.defaultValue})` : ""}`).join("\n")}`);
		
		console.log(`\nOptions:\n${Object.entries(opts).map(([optid, opt]) =>
			`${`  ${opt.short ? `-${opt.short}, ` : "    "}--${optid}${opt.hasValue ? " <value>" : ""}${opt.multiple ? " ..." : ""}`.padEnd(argOptPadding+2, " ")}${opt.desc}${Object.hasOwn(opt, "defaultValue") ? ` (Default: ${opt.defaultValue})` : ""}${opt.allowed ? ` (${opt.allowed.join(" | ")})` : ""}${opt.required ? " (REQUIRED)" : ""}`).join("\n")}`);

		Deno.exit(0);
	}

	const argv = {};

	function assignOptionValue(optid, optValue)
	{
		const opt = opts[optid];
		if(Object.hasOwn(argv, optid))
		{
			if(!opt.multiple)
				return showUsage(`Multiple values not allowed for option: ${optid}`);

			argv[optid].push(optValue);
		}
		else
		{
			argv[optid] = opt.multiple ? [optValue] : optValue;
		}
	}

	// First handle our options
	let curOptid = null;
	
	while(denoArgs.length>0)
	{
		const denoArg = denoArgs.shift();

		if(curOptid)
		{
			assignOptionValue(curOptid, denoArg);
			curOptid = null;
			continue;
		}

		if(!denoArg.startsWith("-"))
		{
			denoArgs.unshift(denoArg);
			break;
		}

		if(denoArg==="--")
			break;
		
		const equalLoc = denoArg.indexOf("=");
		const isShort = !denoArg.startsWith("--");

		let optid = denoArg.substring(isShort ? 1 : 2, equalLoc===-1 ? undefined : equalLoc);
		if(isShort)
			optid = Object.entries(opts).find(([, opt]) => opt.short===optid)?.[0];
		
		if(optid==="help")
			return showUsage();
		if(optid==="version")
			return showVersion();

		const opt = opts[optid];
		if(!opt)
			return showUsage(`No such option: ${optid}`);

		if(!opt.hasValue && !Object.hasOwn(opt, "defaultValue"))
			assignOptionValue(optid, true);
		else if(denoArg.startsWith(`${isShort ? "-" : "--"}${optid}=`))
			assignOptionValue(optid, denoArg.substring(equalLoc+1));
		else
			curOptid = optid;
	}

	// Set any default options we may have and convert any numbers to numbers
	Object.entries(opts).forEach(([optid, opt]) =>
	{
		if(Object.hasOwn(opt, "defaultValue") && !Object.hasOwn(argv, optid))
			argv[optid] = opt.defaultValue;
		
		if(Object.hasOwn(argv, optid))
		{
			if(Object.hasOwn(opt, "defaultValue") && typeof opt.defaultValue==="number" && typeof argv[optid]!=="number" && typeof argv[optid]==="string" && !argv[optid].isNumber())
				return showUsage(`Expected ${optid} to be a number. Got: ${argv[optid]}`);
			
			if(typeof argv[optid]==="string" && argv[optid].isNumber() && !opt.asString)
				argv[optid] = +argv[optid];
		}
		else if(opt.required)
		{
			return showUsage(`Required property ${optid} was not set.`);
		}
	});

	// Now go through our args
	const argsQueue = Array.from(args);
	let curArg = argsQueue.shift();
	while(curArg && denoArgs.length>0)
	{
		const denoArg = denoArgs.shift();
		if(curArg.multiple)
		{
			if(!Object.hasOwn(argv, curArg.argid))
				argv[curArg.argid] = [];
			argv[curArg.argid].push(denoArg);
		}
		else
		{
			argv[curArg.argid] = denoArg;
			curArg = argsQueue.shift();
		}
	}

	if(curArg?.required && !Object.hasOwn(argv, curArg.argid))
		return showUsage(`Required argument ${curArg.argid} was not supplied.`);

	// Set any default arguments we may have and convert any numbers to numbers
	Array.from(args).forEach(arg =>
	{
		if(!Object.hasOwn(arg, "defaultValue") || Object.hasOwn(argv, arg.argid))
			return;
		
		argv[arg.argid] = arg.defaultValue;
	});

	// Verify that we have allowed values
	for(const [argoptid, allowed] of [...args.filter(arg => arg.allowed?.length).map(arg => [arg.argid, arg.allowed]), ...Object.entries(opts).filter(([, opt]) => opt.allowed?.length).map(([optid, opt]) => [optid, opt.allowed])])
	{
		if(allowed && Object.hasOwn(argv, argoptid))
		{
			const invalidValues = Array.force(argv[argoptid]).unique().subtractOnce(allowed);
			if(invalidValues.length>0)
				return showUsage(`Argument/Option ${argoptid} has ${invalidValues.length===1 ? "an invalid value" : "several invalid values"}: [${invalidValues.join("], [")}]. Allowed: [${allowed.join("] [")}]`);
		}
	}

	// Now add any extra unknown args
	if(denoArgs.length>0)
		argv.argv = denoArgs;

	return argv;
}
