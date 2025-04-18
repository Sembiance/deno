import {assertEquals, assertStrictEquals} from "std";
import * as cmdUtil from "../cmdUtil.js";

Deno.test("cmdInit", () =>
{
	const cmdConfig = {
		version : "1.0.0",
		desc    : "description of program",
		opts    :
		{
			verbose   : {desc : "verbose description", defaultValue : 0},
			json      : {desc : "json description"},
			jsonFile  : {desc : "jsonFile description", hasValue : true},
			dontChain : {desc : "dontChain description", hasValue : true, multiple : true, allowed : ["onlyProg", "prog1", "prog2"]}
		},
		args :
		[
			{argid : "firstArg", desc : "description of firstArg", required : true},
			{argid : "secondArg", desc : "description of secondArg", multiple : true}
		]};
	let argv = cmdUtil.cmdInit({...cmdConfig, testDenoArgs : ["--verbose=7", "--dontChain=onlyProg", "--jsonFile", "/mnt/ram/tmp", "abc.txt", "xyz.png", "omg.jpg"]});
	assertStrictEquals(argv.verbose, 7);
	assertStrictEquals(argv.jsonFile, "/mnt/ram/tmp");
	assertStrictEquals(argv.firstArg, "abc.txt");
	assertEquals(argv.secondArg, ["xyz.png", "omg.jpg"]);
	assertEquals(argv.dontChain, ["onlyProg"]);

	argv = cmdUtil.cmdInit({...cmdConfig, testDenoArgs : ["--json", "--dontChain", "prog1", "--dontChain=prog2", "omg.jpg"]});
	assertStrictEquals(argv.json, true);
	assertStrictEquals(argv.verbose, 0);
	assertStrictEquals(argv.firstArg, "omg.jpg");
	assertEquals(argv.dontChain, ["prog1", "prog2"]);
});
