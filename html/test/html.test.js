import {xu} from "xu";
import {assertStrictEquals} from "std";
import {HTML} from "html";

Deno.test("basic", async () =>
{
	const html = new HTML(import.meta.dirname);
	const r = await html.render("main", {title : "Test Title", items : [{type : "color", value : "red"}, {type : "number", value : 7}]});
	assertStrictEquals(r, "<html>\n\t<head><title>Test Title</title>\n\t</head>\n\t<body>\n\t\t<h1>Big ole header!</h1>\n\t\t<p id=\"\" class=\" \" style=\" \">Hello, <b class=\"xyz abc\"> World!</b></p><input type=\"checkbox\" checked=\"checked\" value=\"hi\">\n\t\t<!-- Just a comment -->\n\t\t<ul>\n\t\t\t<li style=\"display: inline; color: green;\" class=\"abc color\">red</li>\n\t\t\t<li style=\"display: inline; color: green;\" class=\"abc number\">7</li>\n\t\t</ul>\n\t</body>\n</html>");
});
