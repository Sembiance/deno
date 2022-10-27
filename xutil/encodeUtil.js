import {xu} from "xu";
import {streams} from "std";

// uses iconv to decode the data with encoding fromEncoding and converts to UTF-8
// for a list of valid encodings, run: iconv --list
// NOTE: Custom dexvert patch was added to add RISCOS and ATARI-ST support
// Detect encoding of a file visually: https://base64.guru/tools/character-encoding
export async function decode(data, fromEncoding)
{
	let cmd = ["iconv", "-c", "-f", fromEncoding, "-t", "UTF-8"];
	if(fromEncoding==="PETSCII")
		cmd = ["petcat", "-nh", "-text"];	// from app-emulation/vice
	
	const p = Deno.run({cmd, clearEnv : true, stdout : "piped", stderr : "piped", stdin : "piped"});
	const stdoutPromise = p.output().catch(() => {});
	const stderrPromise = p.stderrOutput().catch(() => {});
	const stdinPromise = streams.writeAll(p.stdin, typeof data==="string" ? new TextEncoder().encode(data) : data).finally(() => p.stdin.close());
	const [,, stdoutResult] = await Promise.all([stdinPromise, p.status().catch(() => {}),	stdoutPromise, stderrPromise]);
	try { p.close(); } catch {}	// eslint-disable-line brace-style
	return new TextDecoder("UTF-8").decode(stdoutResult);
}

// https://en.wikipedia.org/wiki/Mac_OS_Roman
const MACOS_ROMAN_EXTENDED = ["Ä", "Å", "Ç", "É", "Ñ", "Ö", "Ü", "á", "à", "â", "ä", "ã", "å", "ç", "é", "è", "ê", "ë", "í", "ì", "î", "ï", "ñ", "ó", "ò", "ô", "ö", "õ", "ú", "ù", "û", "ü", "†", "°", "¢", "£", "§", "•", "¶", "ß", "®", "©", "™", "´", "¨", "≠", "Æ", "Ø", "∞", "±", "≤", "≥", "¥", "µ", "∂", "∑", "∏", "π", "∫", "ª", "º", "Ω", "æ", "ø", "¿", "¡", "¬", "√", "ƒ", "≈", "∆", "«", "»", "…", " ", "À", "Ã", "Õ", "Œ", "œ", "–", "—", "“", "”", "‘", "’", "÷", "◊", "ÿ", "Ÿ", "⁄", "€", "‹", "›", "ﬁ", "ﬂ", "‡", "·", "‚", "„", "‰", "Â", "Ê", "Á", "Ë", "È", "Í", "Î", "Ï", "Ì", "Ó", "Ô", "Ⓐ", "Ò", "Ú", "Û", "Ù", "ı", "ˆ", "˜", "¯", "˘", "˙", "˚", "¸", "˝", "˛", "ˇ"];	// eslint-disable-line max-len
export {MACOS_ROMAN_EXTENDED};
