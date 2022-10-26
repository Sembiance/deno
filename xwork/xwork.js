import {xu} from "xu";
import {fileUtil, runUtil} from "xutil";

const xwork = {};

// this is called by worker 'files' that need to get their args
xwork.args = async function args()
{
	return xu.parseJSON(await fileUtil.readTextFile(Deno.env.get("XWORK_ARGS_FILE_PATH")), []);
};

// this is called by worker 'files' upon completion to return values
xwork.done = async function done(r)
{
	return await Deno.writeTextFile(Deno.env.get("XWORK_ARGS_FILE_PATH"), JSON.stringify(r));
};

// this will execut the given fun on a seperate deno instance entirely because Worker support in deno is prone to crashing and all sorts of nasty things
// this also allows 'inline' function execution on other threads via fun.toString()
xwork.run = async function run(fun, args=[], {timeout, imports={}}={})
{
	const inOutFilePath = await fileUtil.genTempPath(undefined, ".xwork");
	await Deno.writeTextFile(inOutFilePath, JSON.stringify(Array.force(args)));

	const runOpts = runUtil.denoRunOpts({liveOutput : true});

	let srcFilePath = null;
	if(typeof fun==="function")
	{
		const src =
		[
			`import {xu} from "xu";`,
			`import {fileUtil} from "xutil";`,
			...Object.entries(imports).map(([pkg, imp]) => `import {${imp.join(", ")}} from "${pkg}";`)
		];

		srcFilePath = await fileUtil.genTempPath(undefined, ".xwork.js");
		const funSrc = fun.toString();
		src.push(fun.name ? funSrc : `const _xworkFun = ${funSrc}`);
		let execLine = `await Deno.writeTextFile(\`${inOutFilePath}\`, JSON.stringify(`;
		if(funSrc.trim().startsWith("async"))
			execLine += "await ";
		execLine += fun.name || "_xworkFun";
		execLine += `(...xu.parseJSON(await fileUtil.readTextFile(\`${inOutFilePath}\`), []))));`;
		src.push(execLine);

		await Deno.writeTextFile(srcFilePath, src.join("\n"));
	}
	else if(typeof fun==="string")
	{
		// assume a filename
		srcFilePath = fun;
		runOpts.env.XWORK_ARGS_FILE_PATH = inOutFilePath;
	}

	if(timeout)
		runOpts.timeout = timeout;

	await runUtil.run("deno", runUtil.denoArgs(srcFilePath), runOpts);
	if(typeof fun==="function")
		await fileUtil.unlink(srcFilePath);

	const r = xu.parseJSON(await fileUtil.readTextFile(inOutFilePath));
	await fileUtil.unlink(inOutFilePath);
	return r;
};

// this will map all the values in arr calling externally fun for each value
xwork.map = async function map(arr, fun, {atOnce=navigator.hardwareConcurrency, ...rest}={})
{
	if(atOnce<1)
		atOnce = navigator.hardwareConcurrency*atOnce;	// eslint-disable-line no-param-reassign

	return await arr.parallelMap(async arg => await xwork.run(fun, [arg], rest), atOnce);
};

export {xwork};
