/** returns a an object of the searchQuery, correctly handling duplicate fields */
if(!URL.prototype.searchParamsObject)
{
	URL.prototype.searchParamsObject = function searchParamsObject()
	{
		const o = {};
		for(const [k, v] of this.searchParams.entries())
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
	};
}
