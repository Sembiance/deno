//console.log(Object.getOwnPropertyNames(globalThis).join("\n"));

console.log(Object.keys(globalThis).join("\n"));

//const denoGlobals = Object.fromEntries(Array.from(Object.getOwnPropertyNames(globalThis)).sortMulti().map(v => ([v, "writable"])));
