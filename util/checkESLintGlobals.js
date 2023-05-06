import {xu, fg} from "xu";
import {diffUtil} from "xutil";
import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const {globals : eslintGlobals } = require("/mnt/compendium/DevLab/common/eslint/shared-deno.eslintrc");
const denoGlobals = Object.fromEntries(Array.from(Object.getOwnPropertyNames(globalThis)).sortMulti().map(v => ([v, "writable"])));

// extras that are conditionaly enabled with --v8-flags
denoGlobals.gc = "writable";	// --expose-gc

for(const o of [eslintGlobals, denoGlobals])
{
	for(const k of Object.keys(o))
	{
		if(k.startsWith("__DENO_NODE_GLOBAL_THIS"))
			delete o[k];
	}
}

if(!Object.equals(eslintGlobals, denoGlobals))
{
	console.log(`${JSON.stringify(denoGlobals)},	// eslint-disable-line key-spacing, comma-spacing`);
	console.log(`\n${fg.peach(`${xu.c.blink}Globals have changed!`)} Update the ${xu.quote(fg.magenta("globals"))} key in ${fg.yellowDim("/mnt/compendium/DevLab/common/eslint/shared-deno.eslintrc.js")} with the above line\nChanged:`);
	console.log(`\t${diffUtil.diff(eslintGlobals, denoGlobals).squeeze()}`);
}
else
{
	console.log(`Globals are unchanged.`);
}
