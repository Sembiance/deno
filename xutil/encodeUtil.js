import {xu} from "xu";
import {path} from "std";

let run = null;

// The script in deno/bin/convert2unicode.tcl is supposed to be able to convert between various encodings, but a quick test with macJapan didn't work for me
// It supports many formats, but most are also supported by iconv. Still, here are a list of the unique ones that TCL supports that iconv does not appear to support:
//const TCL_ENCODINGS = new Set("cns11643", "dingbats", "gb12345", "identity", "jis0201", "jis0208", "jis0212", "ksc5601", "macCentEuro", "macCroatian", "macCyrillic", "macDingbats", "macGreek", "macIceland", "macJapan", "macRoman", "macRomania", "macThai", "macTurkish", "macUkraine", "symbol");

// uses iconv to decode the data with encoding fromEncoding and converts to UTF-8
// for a list of valid encodings, run: iconv --list
// NOTE: Custom dexvert patch was added to add NEXTStep, RISCOS and ATARI-ST support
// Detect encoding of a file visually: https://base64.guru/tools/character-encoding
export async function decode(data, fromEncoding, {iconvPath="iconv"}={})
{
	// used to use tcl to convert, but found that it has some glitches that my custom converter doesn't have any problems with
	// ideally some day I should patch MacJapanese support into iconv
	if(fromEncoding==="MACINTOSHJP")
		return await decodeMacintosh({data, region : "japan", preserveWhitespace : true});

	if(fromEncoding==="MACINTOSH_TO_JP")
	{
		const str = typeof data==="string" ? data : new TextDecoder("UTF-8").decode(data);
		return await decode(await encodeMacintosh({str}), "MACINTOSHJP");
	}

	if(!run)
		({run} = await import(path.join(import.meta.dirname, "runUtil.js")));
	
	let cmdArgs = [iconvPath, ["-c", "-f", fromEncoding, "-t", "UTF-8"]];
	if(fromEncoding==="PETSCII")
		cmdArgs = ["petcat", ["-nh", "-text"]];	// from app-emulation/vice
	//else if(TCL_ENCODINGS.has(fromEncoding))	// Could uncomment this to try and support the TCL conversion script again, but I had trouble getting it to work
	//	cmdArgs = ["tclsh", [path.join(import.meta.dirname, "..", "bin", "convert2unicode.tcl"), "-encoding", fromEncoding]];

	const {stdout} = await run(cmdArgs[0], cmdArgs[1], {stdinData : data});
	return stdout;
}

let MACINTOSH = null;
// processors is an array of arrays: [ [matcher, replacer], ... ]
// matcher should be a RegExp that ALWAYS matches the START of a string
// replacer(match.groups) should return a byte number that the match represents
export async function decodeMacintosh({data, processors=[], region="roman", preserveWhitespace, skipNullBytes})
{
	if(!MACINTOSH)
		({default : MACINTOSH} = await import(path.join(import.meta.dirname, "encodeData", "macintosh.js")));

	// first, convert the filename into an array of bytes, leveraging the processors
	const bytes = data instanceof Uint8Array ? Array.from(data) : [];
	if(bytes.length===0)
	{
		while(data?.length)
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
		if(skipNullBytes && byte===0)
			continue;

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

export async function encodeMacintosh({str, region="roman"})
{
	if(!MACINTOSH)
		({default : MACINTOSH} = await import(path.join(import.meta.dirname, "encodeData", "macintosh.js")));

	const regionData = Object.fromEntries(Object.entries(MACINTOSH[region]).map(([k, v]) => [v, k]));
	regionData[" "] = 0x20;

	const bytes = [];
	for(const c of str.split(""))
		bytes.push(...(!regionData[c] ? [c.charCodeAt(0)] : (regionData[c]>255 ? [Math.floor(regionData[c]/256), regionData[c]%256] : [regionData[c]])));

	return new Uint8Array(bytes);
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

const UNICODE_CONVERSION_MAP = {
	// latin
	"À" : "A", "Á" : "A", "Â" : "A", "Ã" : "A", "Ä" : "A", "Å" : "A", "Æ" : "AE",
	"Ç" : "C", "È" : "E", "É" : "E", "Ê" : "E", "Ë" : "E", "Ì" : "I", "Í" : "I",
	"Î" : "I", "Ï" : "I", "Ð" : "D", "Ñ" : "N", "Ò" : "O", "Ó" : "O", "Ô" : "O",
	"Õ" : "O", "Ö" : "O", "Ő" : "O", "Ø" : "O", "Ù" : "U", "Ú" : "U", "Û" : "U",
	"Ü" : "U", "Ű" : "U", "Ý" : "Y", "Þ" : "TH", "ß" : "ss", "à" : "a", "á" : "a",
	"â" : "a", "ã" : "a", "ä" : "a", "å" : "a", "æ" : "ae", "ç" : "c", "è" : "e",
	"é" : "e", "ê" : "e", "ë" : "e", "ì" : "i", "í" : "i", "î" : "i", "ï" : "i",
	"ð" : "d", "ñ" : "n", "ò" : "o", "ó" : "o", "ô" : "o", "õ" : "o", "ö" : "o",
	"ő" : "o", "ø" : "o", "ù" : "u", "ú" : "u", "û" : "u", "ü" : "u", "ű" : "u",
	"ý" : "y", "þ" : "th", "ÿ" : "y", "ẞ" : "SS",
	// greek
	"α" : "a", "β" : "b", "γ" : "g", "δ" : "d", "ε" : "e", "ζ" : "z", "η" : "h", "θ" : "8",
	"ι" : "i", "κ" : "k", "λ" : "l", "μ" : "m", "ν" : "n", "ξ" : "3", "ο" : "o", "π" : "p",
	"ρ" : "r", "σ" : "s", "τ" : "t", "υ" : "y", "φ" : "f", "χ" : "x", "ψ" : "ps", "ω" : "w",
	"ά" : "a", "έ" : "e", "ί" : "i", "ό" : "o", "ύ" : "y", "ή" : "h", "ώ" : "w", "ς" : "s",
	"ϊ" : "i", "ΰ" : "y", "ϋ" : "y", "ΐ" : "i",
	"Α" : "A", "Β" : "B", "Γ" : "G", "Δ" : "D", "Ε" : "E", "Ζ" : "Z", "Η" : "H", "Θ" : "8",
	"Ι" : "I", "Κ" : "K", "Λ" : "L", "Μ" : "M", "Ν" : "N", "Ξ" : "3", "Ο" : "O", "Π" : "P",
	"Ρ" : "R", "Σ" : "S", "Τ" : "T", "Υ" : "Y", "Φ" : "F", "Χ" : "X", "Ψ" : "PS", "Ω" : "W",
	"Ά" : "A", "Έ" : "E", "Ί" : "I", "Ό" : "O", "Ύ" : "Y", "Ή" : "H", "Ώ" : "W", "Ϊ" : "I",
	"Ϋ" : "Y",
	// turkish
	"ş" : "s", "Ş" : "S", "ı" : "i", "İ" : "I", "ğ" : "g", "Ğ" : "G",
	// russian
	"а" : "a", "б" : "b", "в" : "v", "г" : "g", "д" : "d", "е" : "e", "ё" : "yo", "ж" : "zh",
	"з" : "z", "и" : "i", "й" : "j", "к" : "k", "л" : "l", "м" : "m", "н" : "n", "о" : "o",
	"п" : "p", "р" : "r", "с" : "s", "т" : "t", "у" : "u", "ф" : "f", "х" : "h", "ц" : "c",
	"ч" : "ch", "ш" : "sh", "щ" : "sh", "ъ" : "u", "ы" : "y", "ь" : "", "э" : "e", "ю" : "yu",
	"я" : "ya",
	"А" : "A", "Б" : "B", "В" : "V", "Г" : "G", "Д" : "D", "Е" : "E", "Ё" : "Yo", "Ж" : "Zh",
	"З" : "Z", "И" : "I", "Й" : "J", "К" : "K", "Л" : "L", "М" : "M", "Н" : "N", "О" : "O",
	"П" : "P", "Р" : "R", "С" : "S", "Т" : "T", "У" : "U", "Ф" : "F", "Х" : "H", "Ц" : "C",
	"Ч" : "Ch", "Ш" : "Sh", "Щ" : "Sh", "Ъ" : "U", "Ы" : "Y", "Ь" : "", "Э" : "E", "Ю" : "Yu",
	"Я" : "Ya",
	// ukranian
	"Є" : "Ye", "І" : "I", "Ї" : "Yi", "Ґ" : "G", "є" : "ye", "і" : "i", "ї" : "yi", "ґ" : "g",
	// czech
	"č" : "c", "ď" : "d", "ě" : "e", "ň" : "n", "ř" : "r", "š" : "s", "ť" : "t", "ů" : "u",
	"ž" : "z", "Č" : "C", "Ď" : "D", "Ě" : "E", "Ň" : "N", "Ř" : "R", "Š" : "S", "Ť" : "T",
	"Ů" : "U", "Ž" : "Z",
	// polish
	"ą" : "a", "ć" : "c", "ę" : "e", "ł" : "l", "ń" : "n", "ś" : "s", "ź" : "z",
	"ż" : "z", "Ą" : "A", "Ć" : "C", "Ę" : "e", "Ł" : "L", "Ń" : "N", "Ś" : "S",
	"Ź" : "Z", "Ż" : "Z",
	// latvian
	"ā" : "a", "ē" : "e", "ģ" : "g", "ī" : "i", "ķ" : "k", "ļ" : "l", "ņ" : "n", "ū" : "u",
	"Ā" : "A", "Ē" : "E", "Ģ" : "G", "Ī" : "i", "Ķ" : "k", "Ļ" : "L", "Ņ" : "N", "Ū" : "u"
};

export function unicodeToAscii(text, additionalSymbols)
{
	let result = "";
	const CONVERSION_MAP = Object.assign({}, UNICODE_CONVERSION_MAP, (additionalSymbols || {}));

	for(let i=0, len=text.length;i<len;i++)
	{
		const c = text.charAt(i);
		result += Object.hasOwn(CONVERSION_MAP, c) ? CONVERSION_MAP[c] : c;
	}

	return result;
}

// PETSCII and MACINTOSHJP are not support when encoding
export async function encode(data, toEncoding, {iconvPath="iconv"}={})
{
	if(!run)
		({run} = await import(path.join(import.meta.dirname, "runUtil.js")));

	const cmdArgs = [iconvPath, ["-c", "-f", "UTF-8", "-t", toEncoding]];
	const {stdout} = await run(cmdArgs[0], cmdArgs[1], {stdoutEncoding : "binary", stdinData : data});
	return stdout;
}
