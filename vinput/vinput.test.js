import {keypress} from "./vinput.js";

Deno.test("keypress", async () =>
{
	await keypress("a");
});
