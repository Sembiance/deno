import {} from "./object.js";
import {} from "./math.js";
import {PQueue} from "denoLandX";

/** Returns an average of all the numbers in the array (arithmetic mean) */
if(!Array.prototype.average)
{
	Array.prototype.average = function average()
	{
		return this.sum()/this.length;
	};
}

/** Groups up the values in the array into sub array chunks of x length. Set vertical option to batch in the Y direction rather than X */
if(!Array.prototype.chunk)
{
	Array.prototype.chunk = function chunk(num=1, {vertical=false}={})
	{
		const a = Array.from(this);
		const chunks = [];
		if(vertical)
		{
			const rowCount = Math.ceil(a.length/num);
			for(let y=0;y<rowCount;y++)
			{
				chunks.push([]);
				for(let x=0;x<num;x++)
				{
					const idx = y+(x*rowCount);
					if(idx<a.length)
						chunks.at(-1).push(a[idx]);
				}
			}
		}
		else
		{
			while(a.length>0)
				chunks.push(a.splice(0, num));
		}

		return chunks;
	};
}

/** Clears the array, in place and returns itself. */
if(!Array.prototype.clear)
{
	Array.prototype.clear = function clear()
	{
		this.length = 0;
		return this;
	};
}

/** Returns a deep copy of the array unless you pass true then you get a shallow copy */
if(!Array.prototype.clone)
{
	Array.prototype.clone = function clone({shallow=false}={})
	{
		if(shallow)
			return Array.from(this);

		const r = [];
		for(const v of this)
			r.push(Object.isObject(v) ? Object.clone(v) : (Array.isArray(v) ? v.clone() : v));	// Don't need to pass in shallow to sub .clone() call because shallow is false by default

		return r;
	};
}

/** Same as .filter() but does the filtering in place, returning the array itself as a result for chaining purposes  */
if(!Array.prototype.filterInPlace)
{
	Array.prototype.filterInPlace = function filterInPlace(cb, thisArg)
	{
		let j=0, squeezing=false;
		this.forEach((e, i) =>
		{
			if(cb.call(thisArg, e, i, this))
			{
				if(squeezing)
					this[j] = e;
				j++;
			}
			else
			{
				squeezing = true;
			}
		});

		this.length = j;

		return this;
	};
}

/** Async version of .filter()  */
if(!Array.prototype.filterAsync)
{
	Array.prototype.filterAsync = async function filterAsync(fn)
	{
		const r = [];
		for(const v of this)
		{
			if(await fn(v))
				r.push(v);
		}

		return r;
	};
}
/** Forces the passed in variable to be an Array. Just returns it if it already is an Array, otherwise it returns [v] */
if(!Array.force)
{
	Array.force = function force(v)
	{
		return (Array.isArray(v) ? v : [v]);	// eslint-disable-line sembiance/prefer-array-force
	};
}

/** Returns true if the array contains all of the values in the passed in array vals */
if(!Array.prototype.includesAll)
{
	Array.prototype.includesAll = function includesAll(vals)
	{
		return !vals.some(v => !this.includes(v));
	};
}

/** Returns true if the array contains any of the values in the passed in array vals  */
if(!Array.prototype.includesAny)
{
	Array.prototype.includesAny = function includesAny(vals)
	{
		return vals.some(v => this.includes(v));
	};
}

/** Same as .map() but does the mapping IN PLACE, returning the array itself as a result for chaining purposes  */
if(!Array.prototype.mapInPlace)
{
	Array.prototype.mapInPlace = function mapInPlace(callback, thisArg)
	{
		this.splice(0, this.length, ...this.map(callback, thisArg));
		return this;
	};
}

/** Returns the largest number in the array */
if(!Array.prototype.max)
{
	Array.prototype.max = function max()
	{
		return Math.max(...this);
	};
}

/** Returns the median of all the numbers in the array (middle number)  */
if(!Array.prototype.median)
{
	Array.prototype.median = function median()
	{
		const w = Array.from(this).sort((a, b) => a-b);
		const half = Math.floor(w.length/2);

		if(w.length % 2)
			return w[half];

		return (w[half-1] + w[half]) / 2.0;
	};
}

/** Returns the smallest number in the array */
if(!Array.prototype.min)
{
	Array.prototype.min = function min()
	{
		return Math.min(...this);
	};
}

/** Runs the given fn in parallel for each item in the array, returning a mapped result. Set atOnce to limit how many run at a time */
if(!Array.prototype.parallelMap)
{
	Array.prototype.parallelMap = async function parallelMap(fn, atOnce=Math.min(Math.floor(navigator.hardwareConcurrency/3), 10))
	{
		if(atOnce)
			return await (new PQueue({concurrency : atOnce})).addAll(this.map((v, i) => () => fn(v, i)));

		return await Promise.all(this.map(fn));
	};
}

/** Returns an array with numbers in sequence from start to end INCLUSIVE */
if(!Array.prototype.pushSequence)
{
	Array.prototype.pushSequence = function pushSequence(start, end)
	{
		if(end>=start)
		{
			for(let i=start;i<=end;i++)
				this.push(i);
		}
		else
		{
			for(let i=start;i>=end;i--)
				this.push(i);
		}
		
		return this;
	};
}

/** Pushes the passed in values onto the array, but only if they are not already present within the array */
if(!Array.prototype.pushUnique)
{
	Array.prototype.pushUnique = function pushUnique(...vals)
	{
		for(const v of vals)
		{
			if(!this.includes(v))
				this.push(v);
		}

		return this;
	};
}

/** Removes all occurrences of the passed in val from the array IN PLACE. Returns the array for chaining */
if(!Array.prototype.removeAll)
{
	Array.prototype.removeAll = function removeAll(val)
	{
		do
		{
			const loc = this.indexOf(val);
			if(loc===-1)
				break;
			
			this.splice(loc, 1);
		} while(true);

		return this;
	};
}

/** Removes the first occurence of the passed in val from the array IN PLACE. Returns the array for chaining */
if(!Array.prototype.removeOnce)
{
	Array.prototype.removeOnce = function removeOnce(val)
	{
		const loc = this.indexOf(val);
		if(loc===-1)
			return this;
		
		this.splice(loc, 1);

		return this;
	};
}

/** Replaces a particular value at index idx, returning the array for chaining */
if(!Array.prototype.replaceAt)
{
	Array.prototype.replaceAt = function replaceAt(idx, v)
	{
		this[(idx<0 ? this.length+idx : idx)] = v;
		return this;
	};
}

/** Shuffles an array of numbers, correctly. Does so IN PLACE and returns the array for chaining */
if(!Array.prototype.shuffle)
{
	Array.prototype.shuffle = function shuffle()
	{
		let m=this.length, t=null, i=0;
		while(m)
		{
			i = Math.randomInt(0, --m);
			t = this[m];
			this[m] = this[i];
			this[i] = t;
		}

		return this;
	};
}

/** Sorts an array, IN PLACE, based on the values returned by the sorter cb functions passed in. reverse can be `true` or an array of booleans corresponding to each sorter cb */
if(!Array.prototype.sortMulti)
{
	Array.prototype.sortMulti = function sortMulti(_sorters, reverse)
	{
		const sorters = Array.force(_sorters).filter(v => !!v);
		if(sorters.length===0)
			sorters.push(v => v);

		this.sort((a, b) =>
		{
			for(let i=0, len=sorters.length;i<len;i++)
			{
				const sorter = sorters[i];

				const aVal = sorter(a);
				const bVal = sorter(b);

				if(typeof aVal==="string")
				{
					const stringCompareResult = aVal.localeCompare(bVal);
					if(stringCompareResult<0)
						return (reverse && (!Array.isArray(reverse) || reverse[i]) ? 1 : -1);

					if(stringCompareResult>0)
						return (reverse && (!Array.isArray(reverse) || reverse[i]) ? -1 : 1);
				}
				else
				{
					if(aVal<bVal)
						return (reverse && (!Array.isArray(reverse) || reverse[i]) ? 1 : -1);

					if(aVal>bVal)
						return (reverse && (!Array.isArray(reverse) || reverse[i]) ? -1 : 1);
				}
			}

			return 0;
		});

		return this;
	};
}

/** Return the standard deviation of the numbers in the array
 * A better way of expressing variance. Basically how much variation exists from the average
 * Pass true to use a 'sample' variance as the basis for the standard deviation */
if(!Array.prototype.standardDeviation)
{
	Array.prototype.standardDeviation = function standardDeviation(sample)
	{
		return Math.sqrt(this.variance(sample));
	};
}

/** Returns a NEW array containing all the elements of the base array after any matches of any vals were removed */
if(!Array.prototype.subtractAll)
{
	Array.prototype.subtractAll = function subtractAll(vals=[])
	{
		return this.filter(v => !vals.includes(v));
	};
}

/** Returns a NEW array containing all the elements of the base array after any matches of any vals were removed once  */
if(!Array.prototype.subtractOnce)
{
	Array.prototype.subtractOnce = function subtractOnce(vals=[])
	{
		const r = Array.from(this);
		vals.forEach(val => r.removeOnce(val));

		return r;
	};
}

/** Returns the sum of all the numbers in the array  */
if(!Array.prototype.sum)
{
	Array.prototype.sum = function sum()
	{
		if(!this.length)
			return 0;
		
		return this.reduce((p, c) => (((+p) || 0) + ((+c) || 0)));
	};
}

/** Returns an array with just the unique values */
if(!Array.prototype.unique)
{
	Array.prototype.unique = function unique()
	{
		return Array.from(new Set(this));
	};
}

/** Return the variance of the numbers in the array
 * On average, how far from the average is each number in our set?
 * Pass true to calc a sample variance (if the data only represents a small sample of the whole of possible data) */
if(!Array.prototype.variance)
{
	Array.prototype.variance = function variance(sample)
	{
		const avg = this.average();
		return (this.map(n => ((n-avg)*(n-avg))).sum() / (this.length - (sample ? 1 : 0)));
	};
}


/** Returns an array of 1 or more random values from an array. Can pass an array of values to exclude */
if(!Array.prototype.pickRandom)
{
	Array.prototype.pickRandom = function pickRandom(num=1, {exclude=[]}={})
	{
		if(!Array.isArray(exclude))
			throw new TypeError("pickRandom called with exclude option not of type array");

		if(exclude.length===0 && num===1)
			return [this[Math.floor(Math.random()*this.length)]];
		
		if(exclude.length===0 && num>=this.length)
			return Array.from(this).shuffle();

		return Array.from(this).shuffle().filter(v => !exclude.includes(v)).slice(0, num);
	};
}
