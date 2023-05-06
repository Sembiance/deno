import {keypress} from "./vinput.js";

Deno.test("keypress", async () =>	// eslint-disable-line sembiance/shorter-arrow-funs
{
	await keypress("a");
});
