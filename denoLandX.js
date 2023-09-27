export {parse as xmlParse, stringify as xmlStringify} from "https://deno.land/x/xml@2.1.1/mod.ts";

// These require seperate import/export lines due to 'export var from' not being available yet: https://github.com/tc39/proposal-export-default-from/issues
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export {PQueue};	// eslint-disable-line unicorn/prefer-export-from

export {connect as redisConnect} from "https://deno.land/x/redis@v0.30.0/mod.ts";

export {create as jwtCreate, getNumericDate} from "https://deno.land/x/djwt@v2.9/mod.ts";
