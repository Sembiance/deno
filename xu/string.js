/** Capitalizes the first letter of the string */
if(!String.prototype.capitalize)
{
	String.prototype.capitalize = function capitalize()
	{
		return this.charAt(0).toUpperCase() + this.substr(1);
	};
}

/** Reverses a string that was encoded with encodeURLPath */
if(!String.prototype.decodeURLPath)
{
	String.prototype.decodeURLPath = function decodeURLPath()
	{
		return this.replaceAll("%23", "#").replaceAll("%3f", "?").replaceAll("%5c", "\\").replaceAll("%09", "\t").replaceAll("%0d", "\r").replaceAll("%0a", "\n").replaceAll("%20", " ").replaceAll("%25", "%");
	};
}

/** returns the string str without any ansi escape codes. Useful for measuring actual length of string that will be printed to the terminal */
if(!String.prototype.decolor)
{
	String.prototype.decolor = function decolor()
	{
		return this.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");	// eslint-disable-line no-control-regex, unicorn/better-regex, unicorn/escape-case
	};
}

/** Encode a URL path segment, replacing things like # and ? and % with the proper hex escaping  */
if(!String.prototype.encodeURLPath)
{
	String.prototype.encodeURLPath = function encodeURLPath({skipEncodePercent=false}={})
	{
		let r = this;		// eslint-disable-line consistent-this
		if(!skipEncodePercent)
			r = r.replaceAll("%", "%25");
		
		r = r.replaceAll("#", "%23").replaceAll("?", "%3f").replaceAll("\\", "%5c").replaceAll("\t", "%09").replaceAll("\r", "%0d").replaceAll("\n", "%0a");
		return r;
	};
}

/** Escape the string for inclusion in regex */
if(!String.prototype.escapeRegex)
{
	String.prototype.escapeRegex = function escapeRegex()
	{
		return this.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');	// eslint-disable-line unicorn/better-regex, no-useless-escape, quotes
	};
}

/** Escape the string for HTML/XML and other markup language documents */
if(!String.prototype.escapeXML)
{
	String.prototype.escapeXML = function escapeXML()
	{
		return this.
			replaceAll("&", "&amp;").
			replaceAll("<", "&lt;").
			replaceAll(">", "&gt;").
			replaceAll('"', "&quot;").
			replaceAll("'", "&#039;");
	};
}
String.prototype.escapeHTML = String.prototype.escapeXML;

/** Replaces any extra whitespace from within the middle of a string  */
if(!String.prototype.innerTrim)
{
	String.prototype.innerTrim = function innerTrim()
	{
		let text = this;	// eslint-disable-line consistent-this
		const re = new RegExp(/\s\s/g);
		while(text.search(re)!==-1)
			text = text.replace(re, " ");

		return text;
	};
}

/** Truncates the the string to maxLen, removing characters from the middle of the string instead of the outsider parts  */
if(!String.prototype.innerTruncate)
{
	String.prototype.innerTruncate = function innerTruncate(_maxLen)
	{
		if(this.length<=_maxLen)
			return this;
		
		const maxLen = _maxLen-1;
		const trimSideLength = Math.floor((this.length-maxLen)/2);
		const midPoint = Math.floor(this.length/2);
		return `${this.substring(0, midPoint-trimSideLength)}???${this.substring(midPoint+(trimSideLength+((this.length-(trimSideLength*2))-maxLen)))}`;
	};
}

/** Returns true if this is a number */
if(!String.prototype.isNumber)
{
	String.prototype.isNumber = function isNumber()
	{
		return !isNaN(this) && !isNaN(parseFloat(this)) && isFinite(parseFloat(this));
	};
}

/** async version of String.prototype.replace() */
if(!String.prototype.replaceAsync)
{
	String.prototype.replaceAsync = async function replaceAsync(regex, asyncFn)
	{
		const promises = [];
		this.replace(regex, (...args) => promises.push(asyncFn(...args)));
		const data = await Promise.all(promises);
		return this.replace(regex, () => data.shift());
	};
}

/** Reverses a string */
if(!String.prototype.reverse)
{
	String.prototype.reverse = function reverse()
	{
		return Array.from(this).reverse().join("");
	};
}

/** Strips out the given chars from the string */
if(!String.prototype.strip)
{
	String.prototype.strip = function strip(..._chars)
	{
		const chars = _chars.flat().join("");
		return this.replace(new RegExp(`[${chars}]`, "g"), "");
	};
}

/** Squeezes a string, removing newlines and inner paddings */
if(!String.prototype.squeeze)
{
	String.prototype.squeeze = function squeeze()
	{
		return this.replaceAll("\n", " ").innerTrim().trim();
	};
}

/** Converts a string to camel case */
if(!String.prototype.toCamelCase)
{
	String.prototype.toCamelCase = function toCamelCase()
	{
		return this.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (index === 0 ? word.toLowerCase() : word.toUpperCase())).replace(/\s+/g, "");	// eslint-disable-line unicorn/better-regex
	};
}

/** Converts a string to proper case, capitilizing the first letter of each word and lowercasing the rest of the word */
if(!String.prototype.toProperCase)
{
	String.prototype.toProperCase = function toProperCase()
	{
		return this.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
	};
}

/** Trim specific characters from the front and end of string */
if(!String.prototype.trimChars)
{
	String.prototype.trimChars = function trimChars(_chars)
	{
		if(!_chars)
			return this.trim();

		const chars = Array.isArray(_chars) ? _chars.join("") : _chars;
		return this.replace(new RegExp(`^[${chars}]+|[${chars}]+$`, "g"), "");
	};
}
