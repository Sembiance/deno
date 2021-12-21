export default async function _main(data, {html, include})
{
	return html`
${await include("common/htmlOpen")}
	${await include("common/headOpen")}
	${await include("common/headClose")}
	${await include("common/bodyOpen")}
		${await include("common/header")}
		<p id="" class=" " style=" ">Hello, <b class="xyz abc"> World!</b></p><input type="checkbox" checked="checked" value="hi">
		<!-- Just a comment -->
		<ul>
			${data.items.map(item => html`<li style="display: inline; color: green;" class="abc ${item.type}">${item.value}</li>`).join("\n\t\t\t")}
		</ul>
	${await include("common/bodyClose")}
${await include("common/htmlClose")}`;
}
