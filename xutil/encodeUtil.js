import {xu} from "xu";

// uses iconv to decode the data with encoding fromEncoding and converts to UTF-8
// for a list of valid encodings, run: iconv --list
export async function decode(data, fromEncoding)
{
	const p = Deno.run({cmd : ["iconv", "-f", fromEncoding, "-t", "UTF-8"], clearEnv : true, stdout : "piped", stderr : "piped", stdin : "piped"});
	await p.stdin.write(typeof data==="string" ? new TextEncoder().encode(data) : data);
	p.stdin.close();
	const [, stdoutResult] = await Promise.all([p.status().catch(() => {}),	p.output().catch(() => {}),	p.stderrOutput().catch(() => {})]);
	try { p.close(); } catch {}	// eslint-disable-line brace-style
	return new TextDecoder("UTF-8").decode(stdoutResult);
}

const MACOS_ROMAN_EXTENDED = ["Ä", "Å", "Ç", "É", "Ñ", "Ö", "Ü", "á", "à", "â", "ä", "ã", "å", "ç", "é", "è", "ê", "ë", "í", "ì", "î", "ï", "ñ", "ó", "ò", "ô", "ö", "õ", "ú", "ù", "û", "ü", "†", "°", "¢", "£", "§", "•", "¶", "ß", "®", "©", "™", "´", "¨", "≠", "Æ", "Ø", "∞", "±", "≤", "≥", "¥", "µ", "∂", "∑", "∏", "π", "∫", "ª", "º", "Ω", "æ", "ø", "¿", "¡", "¬", "√", "ƒ", "≈", "∆", "«", "»", "…", " ", "À", "Ã", "Õ", "Œ", "œ", "–", "—", "“", "”", "‘", "’", "÷", "◊", "ÿ", "Ÿ", "⁄", "€", "‹", "›", "ﬁ", "ﬂ", "‡", "·", "‚", "„", "‰", "Â", "Ê", "Á", "Ë", "È", "Í", "Î", "Ï", "Ì", "Ó", "Ô", "Ⓐ", "Ò", "Ú", "Û", "Ù", "ı", "ˆ", "˜", "¯", "˘", "˙", "˚", "¸", "˝", "˛", "ˇ"];	// eslint-disable-line max-len
export {MACOS_ROMAN_EXTENDED};
