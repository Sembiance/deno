import {xu} from "xu";
import {delay} from "std";
import {fileUtil} from "xutil";

/* How to load. Stick in sembiance .xinitrc
insmod /mnt/compendium/DevLab/kernel-modules/vinput/vinput_mod.ko
insmod /mnt/compendium/DevLab/kernel-modules/vinput/vkbd_mod.ko
echo "vkbd" | sudo tee -a /sys/class/vinput/export
chown root:input /dev/vinput0
chmod g+w /dev/vinput0
*/

const DEFAULT_SEQUENCE_DELAY = 250;

const VINPUT_PATH = "/dev/vinput0";

const KEY_CODE =
{
	"CTRL"   : 29,
	"CTRL_L" : 29,
	"CTRL_R" : 97,

	"SHIFT"   : 42,
	"SHIFT_L" : 42,
	"SHIFT_R" : 54,

	"ALT"   : 56,
	"ALT_L" : 56,
	"ALT_R" : 100,

	"META"   : 125,
	"META_L" : 125,
	"META_R" : 126,

	"UP"    : 103,
	"DOWN"  : 108,
	"LEFT"  : 105,
	"RIGHT" : 106,

	"ESCAPE"    : 1,
	"BACKSPACE" : 14,
	"TAB"       : 15,
	"ENTER"     : 28,
	"RETURN"    : 28,
	"SPACE"     : 57,
	"CAPSLOCK"  : 58,

	"-" : 12,
	"_" : 12,
	"=" : 13,
	"+" : 13,
	"{" : 26,
	"[" : 26,
	"}" : 27,
	"]" : 27,
	";" : 39,
	":" : 39,
	"`" : 41,
	"~" : 41,
	"'" : 40,
	'"' : 40,
	"," : 51,
	"<" : 51,
	"." : 52,
	">" : 52,
	"/" : 53,
	"?" : 53,
	"|" : 43,
	"\\" : 43,

	"SYSRQ"      : 99,
	"SCROLLLOCK" : 70,
	"PAUSE"      : 119,

	"INSERT"   : 110,
	"DELETE"   : 111,
	"HOME"     : 102,
	"END"      : 107,
	"PAGEUP"   : 104,
	"PAGEDOWN" : 109,

	"1" : 2,
	"2" : 3,
	"3" : 4,
	"4" : 5,
	"5" : 6,
	"6" : 7,
	"7" : 8,
	"8" : 9,
	"9" : 10,
	"0" : 11,

	"!" : 2,
	"@" : 3,
	"#" : 4,
	"$" : 5,
	"%" : 6,
	"^" : 7,
	"&" : 8,
	"*" : 9,
	"(" : 10,
	")" : 11,

	"A" : 30,
	"B" : 48,
	"C" : 46,
	"D" : 32,
	"E" : 18,
	"F" : 33,
	"G" : 34,
	"H" : 35,
	"I" : 23,
	"J" : 36,
	"K" : 37,
	"L" : 38,
	"M" : 50,
	"N" : 49,
	"O" : 24,
	"P" : 25,
	"Q" : 16,
	"R" : 19,
	"S" : 31,
	"T" : 20,
	"U" : 22,
	"V" : 47,
	"W" : 17,
	"Y" : 21,
	"X" : 45,
	"Z" : 44,

	"a" : 30,
	"b" : 48,
	"c" : 46,
	"d" : 32,
	"e" : 18,
	"f" : 33,
	"g" : 34,
	"h" : 35,
	"i" : 23,
	"j" : 36,
	"k" : 37,
	"l" : 38,
	"m" : 50,
	"n" : 49,
	"o" : 24,
	"p" : 25,
	"q" : 16,
	"r" : 19,
	"s" : 31,
	"t" : 20,
	"u" : 22,
	"v" : 47,
	"w" : 17,
	"x" : 21,
	"y" : 45,
	"z" : 44,

	"F1"  : 59,
	"F2"  : 60,
	"F3"  : 61,
	"F4"  : 62,
	"F5"  : 63,
	"F6"  : 64,
	"F7"  : 65,
	"F8"  : 66,
	"F9"  : 67,
	"F10" : 68,
	"F11" : 87,
	"F12" : 88,

	"KP1" : 79,
	"KP2" : 80,
	"KP3" : 81,
	"KP4" : 75,
	"KP5" : 76,
	"KP6" : 77,
	"KP7" : 71,
	"KP8" : 72,
	"KP9" : 73,
	"KP0" : 82,
	
	"KPDOT"      : 83,
	"KPNUMLOCK"  : 69,
	"KPSLASH"    : 98,
	"KPASTERISK" : 55,
	"KPMINUS"    : 74,
	"KPPLUS"     : 78,
	"KPENTER"    : 96
};

const CAPITALS = '~!@#$%^&*()_+{}|:"<>?ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KEY_PRESS_DELAY = 40;

// Send the given linux key code to the virtual keybaord device to press it down
async function press(code)
{
	await fileUtil.writeTextFile(VINPUT_PATH, `+${code}`);
	await delay(KEY_PRESS_DELAY);
}

// Send the given linux key code to the virtual keybaord device to release it
async function release(code)
{
	await fileUtil.writeTextFile(VINPUT_PATH, `-${code}`);
}

// Presses down the given human named key, pressing shift first if needed for a capital letter
export async function keydown(key)
{
	const parts = key.split("+");
	if(CAPITALS.includes(parts.at(-1)) && !parts.includes("SHIFT"))
		parts.unshift("SHIFT");
	
	for(const code of parts.map(part => KEY_CODE[part]))
		await press(code);
}

// Releases up the given human named key, releasing shift afterwards if needed for a capital letter
export async function keyup(key)
{
	const parts = key.split("+");
	if(CAPITALS.includes(parts.at(-1)) && !parts.includes("SHIFT"))
		parts.unshift("SHIFT");
	
	for(const code of parts.map(part => KEY_CODE[part]).reverse())
		await release(code);
}

// Presses and then releases the given human named key, using shift if needed for a capital letter
export async function keypress(key)
{
	const parts = key.split("+");
	if(CAPITALS.includes(parts.at(-1)) && !parts.includes("SHIFT"))
		parts.unshift("SHIFT");
	
	const codes = parts.map(part => KEY_CODE[part]);
	for(const code of codes)
		await press(code);

	for(const code of codes)
		await release(code);
}

// Presses several keys in sequence
export async function keysequence(keys, sequenceDelay=DEFAULT_SEQUENCE_DELAY)
{
	for(const key of Array.force(keys))
	{
		await keypress(key);
		await delay(sequenceDelay);
	}
}
