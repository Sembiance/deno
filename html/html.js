import {xu} from "xu";
import {path} from "std";

const MAX_COUNTER = 46655;
let V_COUNTER = 0;
export class HTML
{
	constructor(_baseDirPath)
	{
		this.baseDirPath = _baseDirPath;
	}

	async render(subPath, data={}, {cache}={})
	{
		const self=this;
		const requirePath = path.join(this.baseDirPath, `${subPath}.js${cache ? "" : `?v=${Deno.pid.toString(36)}_${Math.randomInt(0, MAX_COUNTER).toString(36)}_${(V_COUNTER++).toString(36)}`}`);
		const {default : renderer} = await import(requirePath);
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
