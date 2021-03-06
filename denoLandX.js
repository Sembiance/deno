// The 'native' version of this module is much faster (takes about 50% of the time) but requires ffi/plugin access which requires env/read/write for every single thing that uses it
// So I only export the wasm version, since it's good enough in most cases. You can require the native version yourself in any project that needs such blazing speed
// Also, you must run `await initDOMParser();` before you can use DOMParser
export {initParser as initDOMParser, DOMParser} from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm-noinit.ts";

export {parse as xmlParse, stringify as xmlStringify} from "https://deno.land/x/xml@2.0.4/mod.ts";

// These require seperate import/export lines due to 'export var from' not being available yet: https://github.com/tc39/proposal-export-default-from/issues
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export {PQueue};	// eslint-disable-line unicorn/prefer-export-from

export {connect as redisConnect} from "https://deno.land/x/redis@v0.25.4/mod.ts";

export {create as jwtCreate, getNumericDate} from "https://deno.land/x/djwt@v2.4/mod.ts";
