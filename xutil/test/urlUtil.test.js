import * as urlUtil from "../urlUtil.js";
import {assertEquals, assertStrictEquals} from "std";

const SEARCH_STRING = "q=&qfields=content&qfields=filename&qfields=ext&qfields=title&labelMatchType=any&label=&sizeMin=&sizeMax=&imgWidthMin=&imgHeightMin=&imgWidthMax=&imgHeightMax=&tsMin=&tsMax=&nsfw=0&sortBy=relevance&limit=100";

Deno.test("modifyQuery", () =>
{
	assertStrictEquals(urlUtil.modifyQuery(`http://test.com/some/path.txt`, {q : "hello"}), `http://test.com/some/path.txt?q=hello`);
	assertStrictEquals(urlUtil.modifyQuery(`http://test.com/some/path.txt?a=b`, {c : "d"}), `http://test.com/some/path.txt?a=b&c=d`);
	assertStrictEquals(urlUtil.modifyQuery(`http://test.com/some/path.txt?a=b&c=d`, {q : "hello world!OMG#Embedded"}), `http://test.com/some/path.txt?a=b&c=d&q=hello%20world!OMG%23Embedded`);
	assertStrictEquals(urlUtil.modifyQuery(`http://test.com/some/path.txt?a=b&c=d`, {a : "somethingElse"}), `http://test.com/some/path.txt?a=somethingElse&c=d`);
	assertStrictEquals(urlUtil.modifyQuery(`http://test.com/some/path.txt?a=b`, {c : true}), `http://test.com/some/path.txt?a=b&c=true`);
	assertStrictEquals(urlUtil.modifyQuery(`/some/path.txt`, {q : "hello"}), `/some/path.txt?q=hello`);
	assertStrictEquals(urlUtil.modifyQuery(`/some/path.txt?a=b`, {c : "d"}), `/some/path.txt?a=b&c=d`);
	assertStrictEquals(urlUtil.modifyQuery(`some/path.txt`, {q : "hello"}), `some/path.txt?q=hello`);
	assertStrictEquals(urlUtil.modifyQuery(`../some/path.txt`, {q : "hello"}), `../some/path.txt?q=hello`);
});

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
	assertStrictEquals(urlUtil.queryObjectToSearchString(a), SEARCH_STRING);
});

Deno.test("urlSearchParamsToQueryObject", () =>
{
	const a = `http://test.com/search?${SEARCH_STRING}`;
	const u = new URL(a);
	assertEquals(urlUtil.urlSearchParamsToQueryObject(u.searchParams), {
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

Deno.test("urlToQueryObject", () =>
{
	const a = urlUtil.urlToQueryObject("https://dev.discmaster2.textfiles.com/search?itemid=19986&family=image&sortBy=b3sum&dedup=dedup&limit=500");
	assertEquals(a, {
		itemid : "19986",
		family : "image",
		sortBy : "b3sum",
		dedup  : "dedup",
		limit  : "500"
	});
});
