/* eslint-disable camelcase */
import {xu} from "xu";
import {assertStrictEquals, assertEquals, assert, path} from "std";
import {Typesense} from "../Typesense.js";

const NAME = "test";
const FIELDS =
[
	{ name : "filename", type : "string" },
	{ name : "content", type : "string" },
	{ name : "size", type :  "int64" },
	{ name : "nsfw", type :  "int32" },
	{ name : "animated", type :   "bool", optional : true },
	{ name : "itemid", type :  "int32", facet : true },
	{ name : "label", type : "string[]", optional : true },
	{ name : "formatid", type : "string", facet : true, optional : true }
];

const DOC = {filename : "spacemusic.au", content : "Fish, plankton, sea greens and protein from the sea!", size : xu.TB+(xu.GB*20.37123), nsfw : 3, animated : true, itemid : 47, label : ["big", "orange", "tabby"]};
const DOC2 = {filename : "test.gif", content : "Some other content", size : xu.KB*7, nsfw : 1, animated : false, itemid : 1, label : ["some", "keyword"]};

function newTypesense()
{
	return new Typesense("127.0.0.1", 38281, "denoTypesenseServerAdminKey");
}

Deno.test("collections", async () =>
{
	const t = newTypesense();
	const createResult = await t.collections.create(NAME, FIELDS);
	assert(Object.hasOwn(createResult, "created_at"));
	assertStrictEquals(createResult.name, NAME);
	assertStrictEquals(createResult.num_documents, 0);
	assertStrictEquals(createResult.fields.length, FIELDS.length);

	let collections = await t.collections.list();
	assertStrictEquals(collections.length, 1);
	assertStrictEquals(collections[0].name, NAME);
	assertStrictEquals(collections[0].num_documents, 0);
	assertStrictEquals(collections[0].fields.length, FIELDS.length);

	const retrieveResult = await t.collections.retrieve(NAME);
	assertStrictEquals(retrieveResult.name, NAME);
	assertStrictEquals(retrieveResult.num_documents, 0);
	assertStrictEquals(retrieveResult.fields.length, FIELDS.length);

	const dropResult = await t.collections.drop(NAME);
	assertStrictEquals(dropResult.name, NAME);
	assertStrictEquals(dropResult.num_documents, 0);
	assertStrictEquals(dropResult.fields.length, FIELDS.length);

	collections = await t.collections.list();
	assertStrictEquals(collections.length, 0);
});

Deno.test("keys", async () =>
{
	const KEY_ACTIONS = ["documents:search"];
	const KEY_DESCRIPTION = "search key";
	const KEY_COLLECTIONS = ["*"];

	const t = newTypesense();
	const createResult = await t.keys.create(KEY_ACTIONS, KEY_COLLECTIONS, KEY_DESCRIPTION);
	assert(Object.hasOwn(createResult, "value"));
	assertStrictEquals(createResult.description, KEY_DESCRIPTION);
	assertEquals(createResult.collections, KEY_COLLECTIONS);
	assertEquals(createResult.actions, KEY_ACTIONS);
	assertStrictEquals(createResult.id, 0);

	let {keys} = await t.keys.list();
	assertStrictEquals(keys.length, 1);
	assert(createResult.value.startsWith(keys[0].value_prefix));
	assertStrictEquals(keys[0].description, KEY_DESCRIPTION);
	assertEquals(keys[0].collections, KEY_COLLECTIONS);
	assertEquals(keys[0].actions, KEY_ACTIONS);
	assertStrictEquals(keys[0].id, 0);

	const retrieveResult = await t.keys.retrieve(createResult.id);
	assert(createResult.value.startsWith(retrieveResult.value_prefix));
	assertStrictEquals(retrieveResult.description, KEY_DESCRIPTION);
	assertEquals(retrieveResult.collections, KEY_COLLECTIONS);
	assertEquals(retrieveResult.actions, KEY_ACTIONS);
	assertStrictEquals(retrieveResult.id, 0);

	const dropResult = await t.keys.drop(createResult.id);
	assertStrictEquals(dropResult.id, 0);

	({keys} = await t.keys.list());
	assertStrictEquals(keys.length, 0);
});

Deno.test("documents", async () =>
{
	const t = newTypesense();
	await t.collections.create(NAME, FIELDS);

	let indexResult = await t.documents.index(NAME, DOC);
	assert(Object.hasOwn(indexResult, "id"));
	assertStrictEquals(indexResult.size, DOC.size);
	assertEquals(indexResult, {id : indexResult.id, ...DOC});

	let retrieveResult = await t.documents.retrieve(NAME, indexResult.id);
	assert(Object.hasOwn(retrieveResult, "id"));
	assertStrictEquals(retrieveResult.size, DOC.size);
	assertEquals(retrieveResult, {id : indexResult.id, ...DOC});

	let dropResult = await t.documents.drop(NAME, indexResult.id);
	assert(Object.hasOwn(dropResult, "id"));
	assertStrictEquals(dropResult.size, DOC.size);
	assertEquals(dropResult, {id : indexResult.id, ...DOC});

	retrieveResult = await t.documents.retrieve(NAME, indexResult.id);
	assertStrictEquals(retrieveResult.message, `Could not find a document with id: ${indexResult.id}`);

	indexResult = await t.documents.index(NAME, DOC);
	dropResult = await t.documents.dropByFilter(NAME, `itemid:${DOC.itemid}`);
	assertEquals(dropResult, { num_deleted : 1});

	await t.collections.drop(NAME);
});

Deno.test("import", async () =>
{
	const t = newTypesense();
	await t.collections.create(NAME, FIELDS);

	const importResults = await t.documents.import(NAME, path.join(xu.dirname(import.meta), "import.jsonl"));
	assertStrictEquals(importResults.length, 2);
	for(const importResult of importResults)
		assertStrictEquals(importResult.success, true);

	let searchResult = await t.documents.search(NAME, {q : "plankton", query_by : "content"});
	assertStrictEquals(searchResult.page, 1);
	assertStrictEquals(searchResult.found, 1);
	assertStrictEquals(searchResult.hits.length, 1);
	assertEquals(searchResult.hits[0].document, {id : searchResult.hits[0].document.id, ...DOC});

	searchResult = await t.documents.search(NAME, {q : "test.gif", query_by : "filename"});
	assertStrictEquals(searchResult.page, 1);
	assertStrictEquals(searchResult.found, 1);
	assertStrictEquals(searchResult.hits.length, 1);
	assertEquals(searchResult.hits[0].document, {id : searchResult.hits[0].document.id, ...DOC2});

	await t.collections.drop(NAME);
});

Deno.test("search", async () =>
{
	const t = newTypesense();
	await t.collections.create(NAME, FIELDS);
	await t.documents.index(NAME, DOC);

	let searchResult = await t.documents.search(NAME, {q : "plankton", query_by : "content"});
	assertStrictEquals(searchResult.page, 1);
	assertStrictEquals(searchResult.found, 1);
	assertStrictEquals(searchResult.hits.length, 1);
	assertEquals(searchResult.hits[0].document, {id : searchResult.hits[0].document.id, ...DOC});
	
	searchResult = await t.documents.search(NAME, {q : "plankton", query_by : "content", include_fields : "filename", facet_by : "itemid", highlight_fields : "ext", highlight_affix_num_tokens : 0});
	assertStrictEquals(searchResult.found, 1);
	assertStrictEquals(searchResult.facet_counts.length, 1);
	assertStrictEquals(searchResult.facet_counts[0].field_name, "itemid");
	assertStrictEquals(searchResult.facet_counts[0].counts.length, 1);
	assertStrictEquals(searchResult.facet_counts[0].counts[0].count, 1);
	
	await t.collections.drop(NAME);
});

Deno.test("health", async () =>
{
	const t = newTypesense();
	const healthResult = await t.health();
	assertStrictEquals(healthResult.ok, true);
});


Deno.test("stats", async () =>
{
	const t = newTypesense();
	const statsResult = await t.stats();
	assert(Object.keys(statsResult).length>0);
});
