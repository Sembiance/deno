"use strict";

import {} from "./object.js";
import {} from "./array.js";

const xu = {};
xu.SECOND = 1000;
xu.MINUTE = xu.SECOND*60;
xu.HOUR = xu.MINUTE*60;
xu.DAY = xu.HOUR*24;
xu.WEEK = xu.DAY*7;
xu.MONTH = xu.DAY*30.4375;
xu.YEAR = xu.DAY*365.25;

xu.BYTE = 1;
xu.KB = xu.BYTE*1000;
xu.MB = xu.KB*1000;
xu.GB = xu.MB*1000;
xu.TB = xu.GB*1000;
xu.PB = xu.TB*1000;

/** Will clone the given value. Options: skipKeys : ["keyNames", "to", "skip"], shallow : true|false */
xu.clone = function clone(v, {skipKeys, shallow=false}={})
{
	return (Array.isArray(v) ? v.clone({shallow}) : (Object.isObject(v) ? Object.clone(v, {skipKeys, shallow}) : v));
};

/** Freeze an object/array, making it immutable. Options: recursive : true|false */
xu.freeze = function freeze(o, {recursive}={})
{
	if(!Array.isArray(o) && !Object.isObject(o))
		return o;

	if(recursive)
		(Object.isObject(o) ? Object.values(o) : o).forEach(v => xu.freeze(v, true));

	Object.freeze(o);

	return o;
};

export { xu };
