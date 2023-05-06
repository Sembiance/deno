// ALERT! MAKE SURE you are running the LATEST `deno` version BEFORE updating the 'std' versions below. This is important, been bitten by this first hand.
// Visit here to find latest version: https://deno.land/std
// Can see changelog here: https://github.com/denoland/deno_std/releases
// Sadly, because 'export' is a magic statement, I can't use a template string and have a single global "0.114.0" var
// So you need to search/replace to update version
// Then go run the deno xu/xutil/xwork tests not just to pull down the new std code, but also to test that nothing broke
export {delay, deadline} from "https://deno.land/std@0.180.0/async/mod.ts";
export * as path from "https://deno.land/std@0.180.0/path/mod.ts";
export * as fs from "https://deno.land/std@0.180.0/fs/mod.ts";
export * as streams from "https://deno.land/std@0.180.0/streams/mod.ts";
export {crypto} from "https://deno.land/std@0.180.0/crypto/mod.ts";
export {format as dateFormat, parse as dateParse} from "https://deno.land/std@0.180.0/datetime/mod.ts";
export {assert, assertEquals, assertNotEquals, assertNotStrictEquals, assertStrictEquals, assertThrows, assertRejects} from "https://deno.land/std@0.180.0/testing/asserts.ts";
export {decode as base64Decode, encode as base64Encode} from "https://deno.land/std@0.180.0/encoding/base64.ts";
export {decode as hexDecode, encode as hexEncode} from "https://deno.land/std@0.180.0/encoding/hex.ts";
export {readLines} from "https://deno.land/std@0.180.0/io/mod.ts";
export {parse as csvParse} from "https://deno.land/std@0.180.0/encoding/csv.ts";
