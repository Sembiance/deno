import {xu} from "xu";
import {GAPI} from "GAPI";
import {XLog} from "xlog";
import {base64Encode, path, assertStrictEquals} from "std";

Deno.test("GAPI-OCR", async () =>
{
	const ocrAPI = new GAPI({serviceKeyFilePath : "/mnt/compendium/auth/gapi-test.json", scopes : ["https://www.googleapis.com/auth/cloud-vision"], ratePeriod : xu.MINUTE, ratePer : 1800, xlog : new XLog("debug")});

	const imageTexts = [
		["test.png", "The Hottest Orientals are waiting...\nDOWN\nNode 66 East\nHST 12-38.4\n914-426-0729"],
		["cd.png", "BEAUTIES\nINTERNATIONAL\nHBI-101/PC\n1994 HAPPY BIRTHDAY, INC.\n(0)"],
		["mi041.png", `"Michelle on a log"\nV PRODS\nColumbus Of`]
	];
	for(const [imageFilename, imageText] of imageTexts)
	{
		const ocrReq = { requests : [{image : { content : base64Encode(await Deno.readFile(path.join(xu.dirname(import.meta), imageFilename)))}, features : [{type : "TEXT_DETECTION", model : "builtin/latest"}]}] };
		const annotations = await ocrAPI.callJSONAPI("https://vision.googleapis.com/v1/images:annotate", ocrReq);
		assertStrictEquals(annotations.responses[0].fullTextAnnotation.text, imageText);
	}

	await ocrAPI.rlq.stop();
});
