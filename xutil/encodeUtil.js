/* eslint-disable no-param-reassign */
import {xu} from "xu";
import {path} from "std";

let run = null;

// uses iconv to decode the data with encoding fromEncoding and converts to UTF-8
// for a list of valid encodings, run: iconv --list
// NOTE: Custom dexvert patch was added to add RISCOS and ATARI-ST support
// Detect encoding of a file visually: https://base64.guru/tools/character-encoding
export async function decode(data, fromEncoding)
{
	// used to use tcl to convert, but found that it has some glitches that my custom converter doesn't have any problems with
	// ideally some day I should patch MacJapanese support into iconv
	if(fromEncoding==="MACINTOSHJP")
		return await decodeMacintosh({data, region : "japan", preserveWhitespace : true});

	if(!run)
		({run} = await import(path.join(xu.dirname(import.meta), "runUtil.js")));

	let cmdArgs = ["iconv", ["-c", "-f", fromEncoding, "-t", "UTF-8"]];
	if(fromEncoding==="PETSCII")
		cmdArgs = ["petcat", ["-nh", "-text"]];	// from app-emulation/vice

	const {stdout} = await run(cmdArgs[0], cmdArgs[1], {stdinData : data});
	return stdout;
}

let MACINTOSH = null;
// processors is an array of arrays: [ [matcher, replacer], ... ]
// matcher should be a RegExp that ALWAYS matches the START of a string
// replacer(match.groups) should return a byte number that the match represents
export async function decodeMacintosh({data, processors=[], region="roman", preserveWhitespace})
{
	if(!MACINTOSH)
		({default : MACINTOSH} = await import(path.join(xu.dirname(import.meta), "encodeData", "macintosh.js")));

	// first, convert the filename into an array of bytes, leveraging the processors
	const bytes = data instanceof Uint8Array ? Array.from(data) : [];
	if(bytes.length===0)
	{
		while(data.length)
		{
			let byte = null;

			// check if any of our matchers match
			for(const [matcher, replacer] of processors)
			{
				const match = data.match(matcher);
				if(match)
				{
					byte = replacer(match.groups);
					if(byte!==null)
					{
						data = data.slice(match[0].length);
						break;
					}
				}
			}

			// fallback to just getting the char code of the character
			if(byte===null)
			{
				byte = data.charCodeAt(0);
				data = data.slice(1);
			}
			
			bytes.push(byte);
		}
	}

	// now form a new filename based on the bytes
	const r = [];
	for(let i=0;i<bytes.length;i++)
	{
		let c = null;
		const byte = bytes[i];

		if(preserveWhitespace && [0x09, 0x0A, 0x0D, 0x20].includes(byte))
		{
			c = String.fromCharCode(byte);
		}
		else if(region==="japan" && i<(bytes.length-1))	// if region is japan, it might be a two byte character, so try that first
		{
			c = MACINTOSH[region][new Uint8Array([byte, bytes[i+1]]).getUInt16BE()];
			if(c)
				i++;
		}
		c ??= MACINTOSH[region][byte] ?? ((byte<0x20 || byte===0x7F) ? "□" : String.fromCharCode(byte));
		
		r.push(c);
	}

	return r.join("");
}

// ENSURE that all regexes match at the START of the string!
export const macintoshProcessors =
{
	// this one will convert UTF8 files that were mistakenly converted to Roman back into bytes
	romanUTF8 :
	[
		[/^(?<c>.)/, ({c}) => (MACINTOSH.romanReversed[c] ? +MACINTOSH.romanReversed[c] : c.charCodeAt(0))]
	],

	octal      :
	[
		// Mac files can contain forward slashes, so we replace them with a unicode fraction slash
		[/^\//, () => "⁄".charCodeAt(0)],

		// these special escapes hfsutils produces. See: https://github.com/Distrotech/hfsutils/blob/f8525637d55fddcf9a457d1ee433c3fd39c7d59c/hls.c#L266
		[/^\\ /, () => " ".charCodeAt(0)],
		[/^\\"/, () => '"'.charCodeAt(0)],
		[/^\\t/, () => "\t".charCodeAt(0)],
		[/^\\r/, () => "\r".charCodeAt(0)],
		[/^\\n/, () => "\n".charCodeAt(0)],
		[/^\\b/, () => "⍾".charCodeAt(0)],
		[/^\\f/, () => "␌".charCodeAt(0)],
		[/^\\\\/, () => "\\".charCodeAt(0)],

		// 3 digit octal code
		[/^\\(?<code>\d{3})/, ({code}) => Number.parseInt(code, 8)]
	],
	percentHex :
	[
		[/^%%/, () => "%".charCodeAt(0)],	// While I haven't encountered this in the wild yet (unar/resource_dasm), it's the only way I figure they can properly encode a natural percent sign
		[/^%(?<code>[A-Fa-f\d]{2})/, ({code}) => Number.parseInt(code, 16)]
	]
};
