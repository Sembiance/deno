export {DOMParser} from "https://deno.land/x/deno_dom@v0.1.19-alpha/deno-dom-native.ts";
export {parse as xmlParse} from "https://deno.land/x/xml@2.0.1/mod.ts";

// These require seeperate import/export lines due to 'export var from' not being available yet: https://github.com/tc39/proposal-export-default-from/issues
import PQueue from "https://deno.land/x/p_queue@1.0.1/mod.ts";
export {PQueue};
