// ALERT! MAKE SURE you are running the LATEST `deno` version BEFORE updating the 'std' versions below. This is important, been bitten by this first hand.
// Visit here to find latest version: https://deno.land/std
// Can see changelog here: https://github.com/denoland/deno_std/releases
// Sadly, because 'export' is a magic statement, I can't use a template string and have a single global "0.114.0" var
// So you need to search/replace to update version
// Update denoLandX.js versions now too, before running any tests!
// Then go run the dtest in deno/xu to pull down the new std code, but also to test that nothing broke

// assert
export {assert, assertEquals, assertNotEquals, assertNotStrictEquals, assertStrictEquals, assertThrows, assertRejects} from "https://deno.land/std@0.203.0/assert/mod.ts";

// async
export {delay} from "https://deno.land/std@0.203.0/async/delay.ts";
export {deadline} from "https://deno.land/std@0.203.0/async/deadline.ts";

// csv
export {parse as csvParse} from "https://deno.land/std@0.203.0/csv/parse.ts";

// crypto
export {crypto} from "https://deno.land/std@0.203.0/crypto/crypto.ts";

// datetime
export {format as dateFormat} from "https://deno.land/std@0.203.0/datetime/format.ts";
export {parse as dateParse} from "https://deno.land/std@0.203.0/datetime/parse.ts";

// encoding
export {decode as base64Decode, encode as base64Encode} from "https://deno.land/std@0.203.0/encoding/base64.ts";
export {decode as hexDecode, encode as hexEncode} from "https://deno.land/std@0.203.0/encoding/hex.ts";

// fs
export * as fs from "https://deno.land/std@0.203.0/fs/mod.ts";

// path
export * as path from "https://deno.land/std@0.203.0/path/mod.ts";

// streams
export {TextLineStream} from "https://deno.land/std@0.203.0/streams/text_line_stream.ts";
export {toArrayBuffer} from "https://deno.land/std@0.203.0/streams/to_array_buffer.ts";
