import {xu, fg} from "./xu.js";

/** Converts a given number of bytes into KB/MB/GB/TB/PB */
Number.prototype.bytesToSize ||= function bytesToSize(precision)
{
	const bytes = this;	// eslint-disable-line consistent-this
	if(bytes===0)
		return "0 bytes";
	
	const i = +(Math.floor(Math.log(bytes) / Math.log(1024)));
	const num = bytes / (1024 ** i);
	return (precision ? num.toFixed(precision) : Math.round(num)) + ["b", "KB", "MB", "GB", "TB", "PB"][i];
};

// Returns what the number is for a given subset of bits. NOTE: the offset is from the 'right' or the lowest bits, so for the first 4 bits from the left, you'd use bitsToNum(4, 4)
Number.prototype.bitsToNum ||= function bitsToNum(qty, offset)
{
	return (this >> offset) & ((1 << qty) - 1);	// eslint-disable-line no-bitwise
};

/** Clears the given bit in a number to 0 */
Number.prototype.clearBit ||= function clearBit(loc)
{
	return this & ~(1 << loc);	// eslint-disable-line no-bitwise
};

/** Eases a number */
/* eslint-disable @stylistic/no-mixed-operators */
// Visual explanations of various easing types: https://easings.net/en
Number.prototype.ease ||= function ease(type)
{
	const x = this;		// eslint-disable-line consistent-this

	if(type==="inQuad")
		return x*x;

	if(type==="inCubic")
		return x*x*x;

	if(type==="inQuart")
		return x*x*x*x;

	if(type==="inQuint")
		return x*x*x*x*x;

	if(type==="outQuad")
		return 1-(1-x)*(1-x);

	if(type==="outCubic")
		return 1-((1-x) ** 3);

	if(type==="outQuart")
		return 1-((1-x) ** 4);

	if(type==="inOutQuad")
		return x<0.5 ? (2*x*x) : (1 - ((-2*x+2) ** 2)/2);

	if(type==="outQuint")
		return 1-((1-x) ** 5);

	if(type==="inOutCubic")
		return x<0.5 ? (4*x*x*x) : (1-((-2*x+2) ** 3)/2);

	if(type==="inOutQuart")
		return x<0.5 ? (8*x*x*x*x) : (1-((-2*x+2) ** 4)/2);

	if(type==="inOutQuint")
		return x<0.5 ? (16*x*x*x*x*x) : (1-((-2*x+2) ** 5)/2);

	if(type==="inSine")
		return 1-Math.cos(x* Math.PI/2);

	if(type==="inOutSine")
		return -(Math.cos(Math.PI*x)-1)/2;

	if(type==="inExpo")
		return x===0 ? 0 : (2 ** (10*x-10));

	if(type==="outExpo")
		return x===1 ? 1 : 1-(2 ** (-10*x));

	if(type==="inOutExpo")
		return x===0 ? 0 : (x===1 ? 1 : (x<0.5 ? ((2 ** (20*x-10))/2) : ((2-(2 * (-20*x+10)))/2)));

	if(type==="inCirc")
		return 1-Math.sqrt(1-(x ** 2));

	if(type==="outCirc")
		return Math.sqrt(1-((x-1) ** 2));

	if(type==="inOutCirc")
		return x<0.5 ? ((1-Math.sqrt(1-((2*x) ** 2)))/2) : ((Math.sqrt(1-((-2*x+2) ** 2))+1)/2);

	const c1 = 1.70158;
	const c2 = c1*1.525;
	const c3 = c1+1;
	const c4 = (2*Math.PI)/3;
	const c5 = (2*Math.PI)/4.5;

	if(type==="inBack")
		return c3 * x * x * x - c1 * x * x;

	if(type==="outBack")
		return 1+c3*((x-1) ** 3)+c1*((x-1) ** 2);

	if(type==="inOutBack")
		return x<0.5 ? ((((2*x) ** 2)*((c2+1)*2*x-c2))/2) : ((((2*x-2) ** 2)*((c2+1)*(x*2-2)+c2)+2)/2);

	if(type==="inElastic")
		return x===0 ? 0 : (x===1 ? 1 : (-(2 ** (10*x-10))*Math.sin((x*10-10.75)*c4)));
	
	if(type==="outElastic")
		return x===0 ? 0 : (x===1 ? 1 : ((2 ** (-10*x))*Math.sin((x*10-0.75)*c4)+1));
	
	if(type==="inOutElastic")
		return x===0 ? 0 : (x===1 ? 1 : (x<0.5 ? (-((2 ** (20*x-10))*Math.sin((20*x-11.125)*c5))/2) : ((2 ** (-20*x+10))*Math.sin((20*x-11.125)*c5)/2+1)));

	if(type==="inBounce")
		return 1-(Number(1-x).ease("outBounce"));

	if(type==="outBounce")
		return x<1/2.75 ? 7.5625*x*x : (x<2/2.75 ? 7.5625*(x-1.5/2.75)*(x-1.5/2.75)+0.75 : (x<2.5/2.75 ? 7.5625*(x-2.25/2.75)*(x-2.25/2.75)+0.9375 : 7.5625*(x-2.625/2.75)*(x-2.625/2.75)+0.984_375));

	if(type==="inOutBounce")
		return x<0.5 ? (1-Number(1-2*x).ease("outBounce"))/2 : (1+Number(2*x-1).ease("outBounce"))/2;

	// Default is "outSine"
	return Math.sin(x*Math.PI/2);
};
/* eslint-enable @stylistic/no-mixed-operators */

/** Flips the given bit in the number */
Number.prototype.flipBit ||= function flipBit(loc)
{
	return (this.getBit(loc)===1 ? this.clearBit(loc) : this.setBit(loc));
};

/* Returns the given bit (0 or 1) */
Number.prototype.getBit ||= function getBit(loc)
{
	return ((this >> loc) %2 !== 0) ? 1 : 0;	// eslint-disable-line no-bitwise
};

/** Returns an array of bits that represent the given number */
Number.prototype.getBits ||= function getBits(len=32)
{
	const bits = [];
	for(let i=len-1;i>=0;i--)
		bits.push(this.getBit(i));

	return bits.reverse();
};

/** Converts an exponential number into one without an exponent */
Number.prototype.noExponents ||= function noExponents()
{
	const numStr = String(this);

	const data = numStr.split(/[eE]/);
	if(data.length===1)
		return data[0];
	
	let z = "";
	const sign = numStr.slice(0, 1)==="-" ? "-" : "";
	const str = data[0].replace(".", "");
	let mag = Number(data[1]) + 1;
	if(mag<=0)
	{
		z = `${sign}0.`;
		while(mag<0)
		{
			z += "0";
			++mag;
		}
		
		return (z + str.replace(/^-/, ""));
	}

	if(str.length<=mag)
	{
		mag -= str.length;
		while(mag>0)
		{
			z += "0";
			--mag;
		}
	
		return str + z;
	}

	return parseFloat(data[0]) * Math.pow(10, parseInt(data[1], 10));	// eslint-disable-line prefer-exponentiation-operator
};

/** Maps a number from one scale (in) to another scale (out) similar to how Arduino map() operates  */
Number.prototype.scale ||= function scale(inMin, inMax, outMin, outMax)
{
	return (((this - inMin) * (outMax - outMin)) / (inMax - inMin)) + outMin;
};

/** Converts a given number of seconds into a human readable value such as 3 days, 45 minutes, 10 seconds or 3d45m10s if short is set to true
 * Setting pad to a truthy value will pad non-leading unit values to 2 chars with zeroes and will always include a ##s suffix even if ##===00
 * Additionally if you set pad to a positive number, then leading unit values will be padded with spaces to the pad length specified
 */
Number.prototype.secondsAsHumanReadable ||= function secondsAsHumanReadable({lang="en", short=false, pad=false, maxParts=Infinity, colorize=false}={})
{
	let left = Math.abs(this);
	if(left===0)
		return short ? "0s" : "0 seconds";
	
	if(left<1)
		return `${left.toFixed(2)}${short ? "s" : " seconds"}`;
		
	const r = [];
	[
		{n :   "year", s :  "y", v : 31_557_600},
		{n :  "month", s : "mo", v : 2_629_800},
		{n :    "day", s :  "d", v : 86400},
		{n :   "hour", s :  "h", v : 3600},
		{n : "minute", s :  "m", v : 60},
		{n : "second", s :  "s", v : 1}
	].forEach(({n, v, s}) =>
	{
		if((left===0 || left<v) && (!pad || s!=="s"))
			return;

		const qty = Math.floor(left/v);
		left -= qty*v;
		let qtyStr = qty.toLocaleString(lang);
		if(pad && (r.length || typeof pad==="number"))
			qtyStr = qtyStr.padStart(r.length ? 2 : (typeof pad==="number" ? pad : 2), r.length ? "0" : " ");
		r.push(`${colorize ? fg.cyan(qtyStr) : qtyStr}${short ? s : ` ${n}${qty>1 || qty===0 ? "s" : ""}`}`);
	});

	return `${this<0 ? "-" : ""}${r.slice(0, maxParts).join(short ? "" : ", ")}`;
};

Number.prototype.msAsHumanReadable = function msAsHumanReadable(options)
{
	return Number(this/1000).secondsAsHumanReadable(options);
};

/** Sets the given bit in a number to 1 */
Number.prototype.setBit ||= function setBit(loc)
{
	return this | (1 << loc);	// eslint-disable-line no-bitwise
};

/** Converts a given number of ms into a clock */
Number.prototype.toClock ||= function toClock()
{
	const r = [];
	let left = this;	// eslint-disable-line consistent-this
	[3_600_000, 60000, 1000].forEach(v =>
	{
		if(left===0 || left<v)
		{
			if(r.length>0)
				r.push(":00");
			return;
		}
		
		const qty = Math.floor(left/v);
		left -= qty*v;
		if(r.length>0)
			r.push(":");
		r.push(`${qty.toString().padStart(r.length===0 ? 1 : 2, "0")}`);
	});

	if(left)
		r.push(`.${left}`);

	return r.join("");
};
