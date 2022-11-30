import {xu} from "xu";
import {path} from "std";

export class HTML
{
	constructor(_baseDirPath)
	{
		this.baseDirPath = _baseDirPath;
	}

	async render(subPath, data={})
	{
		const self=this;
		const {default : renderer} = await import(path.join(this.baseDirPath, `${subPath}.js`));
		const htmlRaw = await renderer(data, {
			html : this.html.bind(this),
			async include(includeSubPath, includeData=data) { return await self.render(includeSubPath, includeData, {skipMinify : true}); } });
		return htmlRaw.trim();
	}

	html(strs, ...vals)
	{
		const r = [];
		strs.forEach(str =>
		{
			r.push(str);

			if(vals.length>0)
				r.push(vals.shift());
		});

		return r.join("");
	}
}
