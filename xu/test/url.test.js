import {} from "../url.js";
import {assertEquals} from "std";

Deno.test("searchParamsObject", () =>
{
	const a = "http://dev.retromission.com/search?q=&qfields=content&qfields=filename&qfields=ext&qfields=title&labelMatchType=any&label=&sizeMin=&sizeMax=&imgWidthMin=&imgHeightMin=&imgWidthMax=&imgHeightMax=&tsMin=&tsMax=&nsfw=0&sortBy=relevance&limit=100";
	const u = new URL(a);
	assertEquals(u.searchParamsObject(), {
		q              : "",
		qfields        : ["content", "filename", "ext", "title"],
		labelMatchType : "any",
		label          : "",
		sizeMin        : "",
		sizeMax        : "",
		imgWidthMin    : "",
		imgHeightMin   : "",
		imgWidthMax    : "",
		imgHeightMax   : "",
		tsMin          : "",
		tsMax          : "",
		nsfw           : "0",
		sortBy         : "relevance",
		limit          : "100"
	});
});
