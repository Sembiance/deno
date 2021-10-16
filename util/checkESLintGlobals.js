import { xu } from "xu";
import { createRequire } from "https://deno.land/std/node/module.ts";

const require = createRequire(import.meta.url);
const {globals : eslintGlobals } = require("/mnt/compendium/DevLab/common/eslint/shared-deno.eslintrc");
const denoGlobals = Object.fromEntries(Array.from(Object.getOwnPropertyNames(globalThis)).sortMulti(v => v).map(v => ([v, "writable"])));

if(!Object.equals(eslintGlobals, denoGlobals))
	console.log(`Globals have changed! Update /mnt/compendium/DevLab/common/eslint/shared-deno.eslintrc with:\n${JSON.stringify(denoGlobals)},	// eslint-disable-line max-len, key-spacing, comma-spacing`);
else
	console.log(`Globals are unchanged.`);
