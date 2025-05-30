export {parse as xmlParse, stringify as xmlStringify} from "jsr:@libs/xml@6.0.1";

// These require seperate import/export lines due to 'export var from' not being available yet: https://github.com/tc39/proposal-export-default-from/issues
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export {PQueue};	// eslint-disable-line unicorn/prefer-export-from

export {create as jwtCreate, getNumericDate} from "https://deno.land/x/djwt@v3.0.2/mod.ts";
