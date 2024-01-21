import {xu} from "xu";

/* converts an object to a searchQuery */
export function queryObjectToSearchString(queryObject)
{
	const r = [];
	for(const [k, v] of Object.entries(queryObject))
	{
		if(v===undefined)
			continue;

		if(Array.isArray(v))
			r.push(...v.map(sub => `${k}=${encodeURIComponent(sub.toString())}`));
		else
			r.push(`${k}=${encodeURIComponent(v.toString())}`);
	}
	return r.join("&");
}

/** returns an object of the URL searchParams, correctly handling duplicate fields */
export function urlSearchParamsToQueryObject(searchParams)
{
	const o = {};
	for(const [k, v] of searchParams.entries())
	{
		if(!Object.hasOwn(o, k))
		{
			o[k] = v;
		}
		else
		{
			if(!Array.isArray(o[k]))
				o[k] = [o[k]];
			o[k].push(v);
		}
	}
	return o;
}

export function urlToQueryObject(url)
{
	return urlSearchParamsToQueryObject((typeof url==="string" ? (new URL(url)) : url).searchParams);
}
