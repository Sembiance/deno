import {xu} from "xu";
import * as printUtil from "../printUtil.js";
import {base64Encode, assertStrictEquals, delay} from "std";

Deno.test("minorHeader", () => assertStrictEquals(base64Encode(printUtil.minorHeader("Minor Header", { prefix : "prefix\n", suffix : "suffix\n"})), "cHJlZml4ChtbOTdtTWlub3IgSGVhZGVyG1swbQobWzk2bS0tLS0tLS0tLS0tLRtbMG1zdWZmaXgK"));
Deno.test("majorHeader", () => assertStrictEquals(base64Encode(printUtil.majorHeader("Major Header", { prefix : "prefix\n", suffix : "suffix\n"})), "cHJlZml4ChtbOTZtLy0tLS0tLS0tLS0tLS0tXBtbMG0KG1s5Nm18IBtbMG0bWzk3bU1ham9yIEhlYWRlchtbMG0bWzk2bSB8G1swbQobWzk2bVwtLS0tLS0tLS0tLS0tLS8bWzBtc3VmZml4Cg=="));
Deno.test("list", () => assertStrictEquals(base64Encode(printUtil.list(["red", "green", "blue", "orange"], { prefix : "prefix\n", suffix : "suffix\n", header : "List" })), "cHJlZml4ChtbOTdtTGlzdBtbMG0KG1s5Nm0tLS0tG1swbQogIBtbOTNtKhtbMG0gcmVkCiAgG1s5M20qG1swbSBncmVlbgogIBtbOTNtKhtbMG0gYmx1ZQogIBtbOTNtKhtbMG0gb3JhbmdlCnN1ZmZpeAo="));
Deno.test("singleLineBooleanPie", () => assertStrictEquals(base64Encode(printUtil.singleLineBooleanPie({"true" : 6407, "false" : 1477}, "Single Line Boolean Pie")), "G1s5N21TaW5nbGUgTGluZSBCb29sZWFuIFBpZRtbMG06IBtbOTNtdHJ1ZRtbMG0gNiw0MDcgKDgxJSkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzkzbWZhbHNlG1swbSAxLDQ3NyAoMTklKQogICAgICAgICAgICAgICAgICAgICAgICAbWzk2bVsbWzBtG1szODs1OzIwOG3ilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilojilogbWzBtG1szODs1OzkzbeKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiBtbMG0bWzk2bV0bWzBt"));
Deno.test("columnizeObjects", () => assertStrictEquals(base64Encode(printUtil.columnizeObjects([
	{name : "banana", count : 20193, happy : true},
	{name : "cherry", count : 30, happy : false},
	{name : xu.cf.fg.peach("peach"), count : 202, happy : false},
	{name : "plum", count : 1993, happy : false},
	{name : "nectarine", count : 9999, happy : true}
], {colNameMap : {name : "THE Name"}, booleanValues : ["AYE", "NAY"], color : {name : "yellow", count : "fogGray", happy : v => (v ? "green" : "red")}})), "G1s5N21USEUgTmFtZRtbMG0gICAgICAbWzk3bUNvdW50G1swbSAgICAgIBtbOTdtSGFwcHkbWzBtICAgICAKG1s5Nm0tLS0tLS0tLS0bWzBtICAgICAbWzk2bS0tLS0tLRtbMG0gICAgIBtbOTZtLS0tLS0bWzBtICAgICAKG1s5M21iYW5hbmEbWzBtICAgICAgICAbWzM4OzU7MjUwbTIwLDE5MxtbMG0gICAgICAbWzkybUFZRRtbMG0gICAgICAKG1s5M21jaGVycnkbWzBtICAgICAgICAgICAgG1szODs1OzI1MG0zMBtbMG0gICAgICAbWzkxbU5BWRtbMG0gICAgICAKG1s5M20bWzM4OzU7MjAzbXBlYWNoG1swbRtbMG0gICAgICAgICAgICAbWzM4OzU7MjUwbTIwMhtbMG0gICAgICAbWzkxbU5BWRtbMG0gICAgICAKG1s5M21wbHVtG1swbSAgICAgICAgICAgG1szODs1OzI1MG0xLDk5MxtbMG0gICAgICAbWzkxbU5BWRtbMG0gICAgICAKG1s5M21uZWN0YXJpbmUbWzBtICAgICAgG1szODs1OzI1MG05LDk5ORtbMG0gICAgICAbWzkybUFZRRtbMG0gICAgICAK"));
Deno.test("multiLineBarChart", () => assertStrictEquals(base64Encode(printUtil.multiLineBarChart({Banana : 6407, Pear : 570, Cherry : 7421, Peach : 2, Plum : 722, Nectarine : 2224, Apple : 347, Grape : 1600}, "Multi-Line Bar Chart")), "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAbWzkzbU11bHRpLUxpbmUgQmFyIENoYXJ0G1swbQobWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0bWzk2bT0bWzBtG1s5Nm09G1swbRtbOTZtPRtbMG0KG1szMm0gICBDaGVycnkbWzBtG1s5Nm06G1swbSAbWzM4OzU7MjA4beKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiOKWiBtbMG0gG1s5N203LDQyMRtbMG0gKDM4JSkKG1szMm0gICBCYW5hbmEbWzBtG1s5Nm06G1swbSAbWzM4OzU7OTNt4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paI4paIG1swbSAbWzk3bTYsNDA3G1swbSAoMzMlKQobWzMybU5lY3RhcmluZRtbMG0bWzk2bTobWzBtIBtbMzg7NTsyM23ilojilojilojilojilojilojilojilojilojilojilojilojilogbWzBtIBtbOTdtMiwyMjQbWzBtICgxMiUpChtbMzJtICAgIEdyYXBlG1swbRtbOTZtOhtbMG0gG1szODs1OzE5MG3ilojilojilojilojilojilojilojilojilogbWzBtIBtbOTdtMSw2MDAbWzBtICg4JSkKG1szMm0gICAgIFBsdW0bWzBtG1s5Nm06G1swbSAbWzM4OzU7MTYzbeKWiOKWiOKWiOKWiBtbMG0gG1s5N203MjIbWzBtICg0JSkKG1szMm0gICAgIFBlYXIbWzBtG1s5Nm06G1swbSAbWzM4OzU7Mjdt4paI4paI4paIG1swbSAbWzk3bTU3MBtbMG0gKDMlKQobWzMybSAgICBBcHBsZRtbMG0bWzk2bTobWzBtIBtbMzg7NTsyNTBt4paI4paIG1swbSAbWzk3bTM0NxtbMG0gKDIlKQobWzMybSAgICBQZWFjaBtbMG0bWzk2bTobWzBtIBtbMzg7NTsyMDht4paIG1swbSAbWzk3bTIbWzBtICgwJSkKCg=="));

const data = {"Caught In Providence":32290.374628999987,"Modern Vintage Gamer":113.513397,"EEVblog":714.487251,"Veritasium":352.376326,"CNBC":909.059292,"Jim Sterling":257.334544,"RetroGamerNation":126.720849,"Vox":223.839573,"Call of Duty":112.459649,"Fran Blanche":183.708694,"zefrank1":618.0456609999999,"Co-Optimus":1004.973411,"This Does Not Compute":228.332736,"Linus Tech Tips":113.831329,"ShortCircuit":114.89264,"Dan Wood":82.866959,"FilmCow":310.953356,"Tech Tangents":235.21229,"City Beautiful":60.568931,"The Dice Tower":475.626048,"SpaceX":20.56176,[xu.cf.fg.violet("A Critical Hit! | \"Critical Kate\" Willært")]:23.762_941};	// eslint-disable-line @stylistic/key-spacing, unicorn/numeric-separators-style, @stylistic/comma-spacing
Deno.test("columnizeObject", () => assertStrictEquals(base64Encode(printUtil.columnizeObject(data, {
	formatter : kv => { kv[1] = kv[1]<1000 ? `${Math.round(kv[1])}M` : `${Math.round(kv[1]/1000)}G`; return kv; },
	header    : ["Show Name", "Disk Usage"],
	alignment : ["l", "r"],
	sorter    : (a, b) => (b[1]-a[1])})), "ICAgICAgICAgICAgICAgIFNob3cgTmFtZSAgICAgICAgICAgICAgICAgICAgIERpc2sgVXNhZ2UgICAgIAobWzk2bS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tG1swbSAgICAgG1s5Nm0tLS0tLS0tLS0tG1swbSAgICAgCkNhdWdodCBJbiBQcm92aWRlbmNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMzJHICAgICAKQ28tT3B0aW11cyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMUcgICAgIApDTkJDICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOTA5TSAgICAgCkVFVmJsb2cgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA3MTRNICAgICAKemVmcmFuazEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDYxOE0gICAgIApUaGUgRGljZSBUb3dlciAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgNDc2TSAgICAgClZlcml0YXNpdW0gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAzNTJNICAgICAKRmlsbUNvdyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDMxMU0gICAgIApKaW0gU3RlcmxpbmcgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMjU3TSAgICAgClRlY2ggVGFuZ2VudHMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAyMzVNICAgICAKVGhpcyBEb2VzIE5vdCBDb21wdXRlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDIyOE0gICAgIApWb3ggICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMjI0TSAgICAgCkZyYW4gQmxhbmNoZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxODRNICAgICAKUmV0cm9HYW1lck5hdGlvbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEyN00gICAgIApTaG9ydENpcmN1aXQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMTE1TSAgICAgCkxpbnVzIFRlY2ggVGlwcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxMTRNICAgICAKTW9kZXJuIFZpbnRhZ2UgR2FtZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDExNE0gICAgIApDYWxsIG9mIER1dHkgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMTEyTSAgICAgCkRhbiBXb29kICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgODNNICAgICAKQ2l0eSBCZWF1dGlmdWwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA2MU0gICAgIAobWzM4OzU7OTNtQSBDcml0aWNhbCBIaXQhIHwgIkNyaXRpY2FsIEthdGUiIFdpbGzDpnJ0G1swbSAgICAgICAgICAgIDI0TSAgICAgClNwYWNlWCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMjFNICAgICAK"));

Deno.test("inspect", () =>
{
	let o = {abc : () => {}, xyz : false, numbers : [23, 213, 125, 123_523_523, 23423], moreProps : {subObj : "keys", andMore : "live\nlong\nand\nprosper"}};
	assertStrictEquals(base64Encode(printUtil.inspect(o)), "eyBhYmM6IBtbMzZtW0Z1bmN0aW9uOiBhYmNdG1szOW0sCiAgeHl6OiAbWzMzbWZhbHNlG1szOW0sCiAgbnVtYmVyczogWyAbWzMzbTIzG1szOW0sIBtbMzNtMjEzG1szOW0sIBtbMzNtMTI1G1szOW0sIBtbMzNtMTIzNTIzNTIzG1szOW0sIBtbMzNtMjM0MjMbWzM5bSBdLAogIG1vcmVQcm9wczogeyBzdWJPYmo6IBtbMzJtImtleXMiG1szOW0sIGFuZE1vcmU6IBtbMzJtImxpdmVcbmxvbmdcbmFuZFxucHJvc3BlciIbWzM5bSB9IH0=");
	o = {abc : 123, longStr : "This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated This is a long string that should be truncated"};
	assertStrictEquals(base64Encode(printUtil.inspect(o)), "eyBhYmM6IBtbMzNtMTIzG1szOW0sCiAgbG9uZ1N0cjoKICAgG1szMm0iVGhpcyBpcyBhIGxvbmcgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIHRydW5jYXRlZCBUaGlzIGlzIGEgbG9uZyBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdHJ1bmNhdGVkIFRoaXMgaXMgYSBsb25nIHN0cmluZyB0aGF0IHNob3VsZCBiZSB0cnVuY2F0ZWQgVGhpcyBpcyBhIhtbMzltLi4uIDEzMSBtb3JlIGNoYXJhY3RlcnMgfQ==");
	assertStrictEquals(base64Encode(printUtil.inspect(o, {strAbbreviateSize : 5000})), "eyBhYmM6IBtbMzNtMTIzG1szOW0sCiAgbG9uZ1N0cjoKICAgG1szMm0iVGhpcyBpcyBhIGxvbmcgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIHRydW5jYXRlZCBUaGlzIGlzIGEgbG9uZyBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdHJ1bmNhdGVkIFRoaXMgaXMgYSBsb25nIHN0cmluZyB0aGF0IHNob3VsZCBiZSB0cnVuY2F0ZWQgVGhpcyBpcyBhIGxvbmcgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIHRydW5jYXRlZCBUaGlzIGlzIGEgbG9uZyBzdHJpbmcgdGhhdCBzaG91bGQgYmUgdHJ1bmNhdGVkIFRoaXMgaXMgYSBsb25nIHN0cmluZyB0aGF0IHNob3VsZCBiZSB0cnVuY2F0ZWQiG1szOW0gfQ==");
});

const PROGRESS_STATUS_MESSAGES =
[
	"Loading internet...",
	"Downloading internet...",
	"Petting cat...",
	"Shaving sheep...",
	"Taking on Neuromancer AI...",
	"Upgrading software..."
];
const PROGRESS_DELAYS = [...Array(150).fill(100), ...Array(25).fill(250), 1000, 1000, 1500];

Deno.test("progressSimple", async () =>
{
	const progress = printUtil.progress({barWidth : 30, max : 555});
	for(let i=0;i<=555;i++)
	{
		if(Math.randomInt(1, 5)===1)
			i++;	// eslint-disable-line sonarjs/updated-loop-counter

		progress.set(i, Math.randomInt(1, 10)===1 ? PROGRESS_STATUS_MESSAGES.pickRandom()[0] : undefined);
		if(Math.randomInt(1, 14)===1)
			await delay(PROGRESS_DELAYS.pickRandom()[0]);
	}
});

Deno.test("progressDurationPer", async () =>
{
	const progress = printUtil.progress({barWidth : 30, max : 5555, includeDuration : true, includePer : true});
	for(let i=0;i<=5555;i++)
	{
		if(Math.randomInt(1, 4)===1)
			i++;	// eslint-disable-line sonarjs/updated-loop-counter

		progress.set(i, Math.randomInt(1, 10)===1 ? PROGRESS_STATUS_MESSAGES.pickRandom()[0] : undefined);
		if(Math.randomInt(1, 3)===1)
			await delay(Math.randomInt(5, 20));
	}
});

Deno.test("progressMaxChanges", async () =>
{
	const progress = printUtil.progress({barWidth : 30, max : 555});
	let curMax = 555;
	for(let i=0;i<=curMax;i++)
	{
		if([100, 400, 800].includes(i))
		{
			curMax = {100 : 600, 400 : 1000, 800 : 1500}[i];
			progress.setMax(curMax);
		}

		if(Math.randomInt(1, 5)===1)
			i++;	// eslint-disable-line sonarjs/updated-loop-counter

		progress.set(i, Math.randomInt(1, 10)===1 ? PROGRESS_STATUS_MESSAGES.pickRandom()[0] : undefined);
		if(Math.randomInt(1, 14)===1)
			await delay(PROGRESS_DELAYS.pickRandom()[0]);
	}
});


Deno.test("progressMaxStartZero", async () =>
{
	const bar = printUtil.progress({barWidth : 30, max : 0, dontAutoFinish : true});
	let curMax = 555;
	for(let i=0;i<=curMax;i++)
	{
		if(i<100)
			bar.setMax(i);

		if([100, 400, 800].includes(i))
		{
			curMax = {100 : 600, 400 : 1000, 800 : 1500}[i];
			bar.setMax(curMax);
		}

		if(Math.randomInt(1, 5)===1)
			i++;	// eslint-disable-line sonarjs/updated-loop-counter

		bar.set(i, Math.randomInt(1, 10)===1 ? PROGRESS_STATUS_MESSAGES.pickRandom()[0] : undefined);
		if(Math.randomInt(1, 14)===1)
			await delay(PROGRESS_DELAYS.pickRandom()[0]);
	}
	bar.finish();
});
