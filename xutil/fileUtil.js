import * as fs from "https://deno.land/std@0.111.0/fs/mod.ts";

export async function exists(v)
{
	return !!await Deno.stat(v).catch(err => {});
}

export async function glob(root, matchPattern, options)
{
	const r = [];
	for await(const v of fs.expandGlob(matchPattern, {root, ...options}))
		r.push(v);
	
	return r.map(v => (v.isDirectory ? `${v.path}/` : v.path));
}

//export const generateTempFilePath = async function generateTempFilePath()