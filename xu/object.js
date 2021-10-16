import {} from "./array.js";

/** Deletes all keys in an object, in place. Useful to clear an object that is 'const' */
if(!Object.clear)
{
	Object.clear = function clear(o)
	{
		for(const k of Object.keys(o))
			delete o[k];

		return o;
	};
}

/** Deep clones the given object. Options: skipKeys : ["keyNames", "to", "skip"], shallow : true|false */
if(!Object.clone)
{
	Object.clone = function clone(o, {skipKeys=[], shallow=false}={})
	{
		const result = {};
		for(const [k, v] of Object.entries(o))
		{
			if(skipKeys.includes(k))
				continue;

			if(shallow)
				result[k] = v;
			else
				result[k] = (Array.isArray(v) ? v.clone() : (Object.isObject(v) ? Object.clone(v, {skipKeys}) : v));	// Don't need to pass shallow in because it's default is false
		}
		return result;
	};
}

/** Returns 'true' if o1 is the same as o2 */
if(!Object.equals)
{
	Object.equals = function equals(o1, o2)
	{
		if(o1 && !o2)
			return false;

		if(o1===o2)
			return true;

		for(const [k, v] of Object.entries(o1))
		{
			if(v===o2[k])
				continue;

			// Only know how to handle testing equality of basic types and objects
			if(!Object.isObject(v))
				return false;

			if(!Object.equals(v, o2[k]))
				return false;
		}

		// See if o2 has any keys that o1 doesn't
		if(!Object.keys(o1).includesAll(Object.keys(o2)))
			return false;

		return true;
	};
}


/** Filters out keys from an object by calling cb(key, value, i) and deleting entries when that cb() returns a falsy value. Modifies the object directly, in place */
if(!Object.filterInPlace)
{
	Object.filterInPlace = function filterInPlace(o, cb)
	{
		if(!cb)
			return o;

		for(const keyToDelete of Object.keys(o).filter(k => !cb(k, o[k])))
			delete o[keyToDelete];

		return o;
	};
}

/** Returns 'true' if the val is an Object and NOT an Array */
if(!Object.isObject)
{
	Object.isObject = function isObject(v)
	{
		return v!==null && !Array.isArray(v) && typeof v==="object";
	};
}

/** Returns a new object by calling cb(k, v) and expects a result of either 'newVal' or [newKey, newVal] */
if(!Object.map)
{
	Object.map = function map(o, cb)
	{
		if(!cb)
			return o;

		const result = {};

		for(const [k, v] of Object.entries(o))
		{
			const r = cb(k, v);
			if(!Array.isArray(r))
				result[k] = r;
			else if(r.length===1)
				result[k] = r[0];
			else
				result[r[0]] = r[1];
		}

		return result;
	};
}

/** Replaces key/values in an object by calling cb(k, v) and expects a result of either 'newVal' or [newKey, newVal]. Modifies object directly, in place */
if(!Object.mapInPlace)
{
	Object.mapInPlace = function mapInPlace(o, cb)
	{
		if(!cb)
			return o;
		
		for(const [k, v] of Object.entries(o))
		{
			const r = cb(k, v);
			if(!Array.isArray(r))
			{
				o[k] = r;
			}
			else if(r.length===1)
			{
				o[k] = r[0];
			}
			else
			{
				delete o[k];
				o[r[0]] = r[1];
			}
		}

		return o;
	};
}
