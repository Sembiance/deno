import {xu} from "xu";

/* converts an object to a searchQuery */
export function queryObjectToSearchString(queryObject)
{
	const r = [];
	for(const [k, v] of Object.entries(queryObject))
	{
		if(Array.isArray(v))
			r.push(...v.map(sub => `${k}=${sub.toString().encodeURLPath()}`));
		else
			r.push(`${k}=${v.toString().encodeURLPath()}`);
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
