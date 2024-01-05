import {xu} from "xu";
import {XLog} from "xlog";
import {urlUtil} from "xutil";

const VERSRIONS_SUPPORTED = ["1.19.2"];

export class MediaWiki
{
	constructor(site, {version="1.19.2", xlog=new XLog("none")}={})
	{
		if(!VERSRIONS_SUPPORTED.includes(version))
			throw new Error(`Unsupported MediaWiki version ${version} allowed versions are ${VERSRIONS_SUPPORTED.join(", ")}`);

		this.site = site.trimChars("/");
		this.xlog = xlog;
	}

	parseCookies(headers)
	{
		const cookieParts = headers.get("set-cookie").split(";").map(v => ([v.trim().split("=")[0], v.trim().split("=")[1]]));
		cookieParts.mapInPlace(([k, v]) =>
		{
			if(k.startsWith("httponly, "))
				return [k.substring("httponly, ".length), v];

			return [k, v];
		});

		return Object.fromEntries(cookieParts.filter(([k]) => !["path", "httponly", "expires"].includes(k.toLowerCase())));
	}

	async api(o, {method="GET", includeResponse=false, suffixToken}={})
	{
		let u = `${this.site}/api.php?${urlUtil.queryObjectToSearchString(o)}`;

		// some operations (like edit) require a token to be passed LAST in the query string
		if(suffixToken)
			u += `&token=${encodeURIComponent(suffixToken)}`;

		const reqProps = {method};
		if(this.cookies)
			reqProps.headers = {"Cookie" : Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; ")};

		const response = await xu.tryFallbackAsync(async () => await fetch(u, reqProps));
		if(!response)
			return false;
		
		const r = await xu.tryFallbackAsync(async () => await response.json());

		return includeResponse ? {response, r} : r;
	}

	async login(username, password)
	{
		let {response, r} = await this.api({action : "login", lgname : username, lgpassword : password, format : "json"}, {method : "POST", includeResponse : true});
		this.cookies = this.parseCookies(response.headers);
		this.token = r.login.token;

		({response, r} = await this.api({action : "login", lgname : username, lgpassword : password, lgtoken : this.token, format : "json"}, {method : "POST", includeResponse : true}));
		if(r.login?.result!=="Success")
		{
			this.xlog.error`Failed to login to ${this.site} as ${username} ${r}`;
			return false;
		}

		Object.assign(this.cookies, this.parseCookies(response.headers));

		return r;
	}

	async getPage(pageName, {followRedirect}={})
	{
		const r = await (await fetch(`${this.site}/api.php?${urlUtil.queryObjectToSearchString({action : "query", prop : "revisions", titles : pageName, rvprop : "content", format : "json"})}`)).json();
		const content = r?.query?.pages[Object.keys(r.query.pages)[0]].revisions[0]["*"];

		const {title : redirectTitle} = content.match(/^#REDIRECT \[\[(?<title>[^\]]+)]]$/)?.groups || {};
		if(followRedirect && redirectTitle)
			return await this.getPage(redirectTitle);

		return content;
	}

	async editPage(pageName, newContent, {minor, summary, captchaAnswer}={})
	{
		const tokenR = await this.api({action : "query", prop : "info", intoken : "edit", titles : pageName, format : "json"});
		const suffixToken = Object.values(tokenR.query.pages)?.[0]?.edittoken;
		if(!suffixToken?.length)
		{
			this.xlog.error`Failed to get edit token for ${pageName} ${tokenR}`;
			return false;
		}

		const editParams = {action : "edit", title : pageName, text : newContent, minor, format : "json"};
		if(summary)
			editParams.summary = summary;

		let editR = await this.api({...editParams}, {method : "POST", suffixToken});
		if(editR?.edit?.result==="Success")
			return editR;

		if(editR?.edit?.captcha)
		{
			if(!captchaAnswer)
			{
				this.xlog.error`Captcha required ${JSON.stringify(editR)}`;
				return false;
			}

			editR = await this.api({...editParams, captchaid : editR.edit.captcha.id, captchaword : captchaAnswer}, {method : "POST", suffixToken});
		}
		
		return editR;
	}

	async searchTitles(text)
	{
		const r = await this.api({action : "query", list : "search", srsearch : text, limit : 10, format : "json"});
		return (r?.query?.search || []).map(o => o.title);
	}
}
