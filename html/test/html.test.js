import {xu} from "xu";
import {assertStrictEquals, path} from "std";
import {HTML} from "html";
import {fileUtil} from "xutil";

Deno.test("basic", async () =>
{
	const html = new HTML(import.meta.dirname, {argOpts : {abc : 123}});
	const r = await html.render("main", {title : "Test Title", items : [{type : "color", value : "red"}, {type : "number", value : 7}]});
	assertStrictEquals(r, "<html>\n\t<head><title>Test Title 123</title>\n\t<style>\n.bold {\n  font-weight: bold;\n}\n</style>\n\t</head>\n\t<body>\n\t\t<h1>Big ole header!</h1>\n\t\t<p id=\"\" class=\" \" style=\" \">Hello, <b class=\"xyz abc\"> World!</b></p><input type=\"checkbox\" checked=\"checked\" value=\"hi\">\n\t\t<!-- Just a comment -->\n\t\t<ul>\n\t\t\t<li style=\"display: inline; color: green;\" class=\"abc color\">red</li>\n\t\t\t<li style=\"display: inline; color: green;\" class=\"abc number\">7</li>\n\t\t</ul>\n\t</body>\n</html>");
});

Deno.test("cache", async () =>
{
	const htmlDirPath = await fileUtil.genTempPath();
	await Deno.mkdir(htmlDirPath, {recursive : true});
	const htmlFilePath = path.join(htmlDirPath, "cache.js");

	const writeHTMLFile = async str =>
	{
		await fileUtil.writeTextFile(htmlFilePath, `
			export default async function _main(data, {html, compileStylus, include})
			{
				return html\`<html><head><title>\${data.title}</title></head><body>${str}</body>\`;
			}`);
	};

	let html = new HTML(htmlDirPath);

	await writeHTMLFile("testing");
	let r = await html.render("cache", {title : "Hello, World!"});
	assertStrictEquals(r, "<html><head><title>Hello, World!</title></head><body>testing</body>");

	await writeHTMLFile("testing2");
	r = await html.render("cache", {title : "Hello, World!"});
	assertStrictEquals(r, "<html><head><title>Hello, World!</title></head><body>testing</body>");


	html = new HTML(htmlDirPath, {devMode : true});
	await writeHTMLFile("testing");
	r = await html.render("cache", {title : "Hello, World!"});
	assertStrictEquals(r, "<html><head><title>Hello, World!</title></head><body>testing</body>");

	await writeHTMLFile("testing2");
	r = await html.render("cache", {title : "Hello, World!"});
	assertStrictEquals(r, "<html><head><title>Hello, World!</title></head><body>testing2</body>");

	await fileUtil.unlink(htmlDirPath, {recursive : true});
});

