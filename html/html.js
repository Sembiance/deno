import {xu} from "xu";
import {path} from "std";
import {runUtil} from "xutil";

export class HTML
{
	constructor(_baseDirPath, {devMode, argOpts}={})
	{
		this.baseDirPath = _baseDirPath;
		this.devMode = devMode;
		this.argOpts = argOpts || {};
	}

	async render(subPath, data={})
	{
		const self=this;
		const {default : renderer} = await import(path.join(this.baseDirPath, `${subPath}.js${this.devMode ? `#${xu.randStr()}` :""}`));
		const htmlRaw = await renderer(data, {
			...this.argOpts,
			html : this.html.bind(this),
			compileStylus : this.compileStylus.bind(this),
			async include(includeSubPath, includeData=data) { return await self.render(includeSubPath, includeData); } });
		return htmlRaw.trim();
	}

	async compileStylus(subPath)
	{
		return `<style>\n${(await runUtil.run("stylus", ["--print", path.join(this.baseDirPath, `${subPath}.styl`)]))?.stdout}</style>`;
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
