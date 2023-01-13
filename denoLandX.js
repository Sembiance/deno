export {DOMParser} from "./denoLandX/deno-dom/deno-dom-native.ts";

export {parse as xmlParse, stringify as xmlStringify} from "https://deno.land/x/xml@2.0.4/mod.ts";

// These require seperate import/export lines due to 'export var from' not being available yet: https://github.com/tc39/proposal-export-default-from/issues
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export {PQueue};	// eslint-disable-line unicorn/prefer-export-from

export {connect as redisConnect} from "https://deno.land/x/redis@v0.27.4/mod.ts";

export {create as jwtCreate, getNumericDate} from "https://deno.land/x/djwt@v2.4/mod.ts";
