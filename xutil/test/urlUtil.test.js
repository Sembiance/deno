import {queryObjectToSearchString, urlSearchParamsToQueryObject} from "../urlUtil.js";
import {assertEquals, assertStrictEquals} from "std";

const SEARCH_STRING = "q=&qfields=content&qfields=filename&qfields=ext&qfields=title&labelMatchType=any&label=&sizeMin=&sizeMax=&imgWidthMin=&imgHeightMin=&imgWidthMax=&imgHeightMax=&tsMin=&tsMax=&nsfw=0&sortBy=relevance&limit=100";

Deno.test("queryObjectToSearchString", () =>
{
	const a = {
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
	};
	assertStrictEquals(queryObjectToSearchString(a), SEARCH_STRING);
});

Deno.test("urlSearchParamsToQueryObject", () =>
{
	const a = `http://test.com/search?${SEARCH_STRING}`;
	const u = new URL(a);
	assertEquals(urlSearchParamsToQueryObject(u.searchParams), {
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
