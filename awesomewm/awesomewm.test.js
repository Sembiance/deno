import {xu} from "xu";
import {assertStrictEquals} from "std";
import {runAwesomeCode} from "./awesomewm.js";
import {XLog} from "xlog";

const xlog = new XLog();

Deno.test("runAwesomeCode", async () =>	// eslint-disable-line sembiance/shorter-arrow-funs
{
	assertStrictEquals((await runAwesomeCode("return 1+2"))?.stdout?.trim(), "double 3");
});

