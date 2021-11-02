import {xu} from "xu";
import * as printUtil from "../printUtil.js";

printUtil.minorHeader("Minor Header", { prefix : "\n", suffix : "\n"});
printUtil.majorHeader("Major Header", { prefix : "\n", suffix : "\n"});

printUtil.list(["red", "green", "blue", "orange"], { prefix : "\n", suffix : "\n", header : "List" });
printUtil.singleLineBooleanPie({"true" : 6407, "false" : 1477}, "Single Line Boolean Pie");
printUtil.multiLineBarChart({Banana : 6407, Pear : 570, Cherry : 7421, Peach : 2, Plum : 722, Nectarine : 2224, Apple : 347, Grape : 1600}, "Multi-Line Bar Chart");

console.log(printUtil.columnizeObjects([	// eslint-disable-line no-restricted-syntax
	{name : "banana", count : 20193, happy : true},
	{name : "cherry", count : 30, happy : false},
	{name : xu.cf.fg.peach("peach"), count : 202, happy : false},
	{name : "plum", count : 1993, happy : false},
	{name : "nectarine", count : 9999, happy : true}
], {colNameMap : {name : "THE Name"}, booleanValues : ["AYE", "NAY"], color : {name : "yellow", count : "fogGray", happy : v => (v ? "green" : "red")}}));

const data = {"Caught In Providence":32290.374628999987,"Modern Vintage Gamer":113.513397,"EEVblog":714.487251,"Veritasium":352.376326,"CNBC":909.059292,"Jim Sterling":257.334544,"RetroGamerNation":126.720849,"Vox":223.839573,"Call of Duty":112.459649,"Fran Blanche":183.708694,"zefrank1":618.0456609999999,"Co-Optimus":1004.973411,"This Does Not Compute":228.332736,"Linus Tech Tips":113.831329,"ShortCircuit":114.89264,"Dan Wood":82.866959,"FilmCow":310.953356,"Tech Tangents":235.21229,"City Beautiful":60.568931,"The Dice Tower":475.626048,"SpaceX":20.56176};	// eslint-disable-line max-len, key-spacing, unicorn/numeric-separators-style, comma-spacing
data[xu.cf.fg.violet("A Critical Hit! | \"Critical Kate\" Willært")] = 23.762_941;
console.log(printUtil.columnizeObject(data, {		// eslint-disable-line no-restricted-syntax
	formatter : (kv) => { kv[1] = kv[1]<1000 ? `${Math.round(kv[1])}M` : `${Math.round(kv[1]/1000)}G`; return kv; },	// eslint-disable-line arrow-parens
	header    : ["Show Name", "Disk Usage"],
	alignment : ["l", "r"],
	sorter    : (a, b) => (b[1]-a[1])}));
