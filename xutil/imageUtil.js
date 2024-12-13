import {xu} from "xu";
import * as runUtil from "./runUtil.js";
import {path} from "std";

/** Returns the [width, height] of the image at imageFilePath */
export async function getWidthHeight(imageFilePath, {timeout=xu.MINUTE*5}={})
{
	const {stdout, stderr} = await runUtil.run("identify", ["-quiet", "-format", "%wx%h", `./${path.basename(imageFilePath)}[0]`], {cwd : path.dirname(imageFilePath), timeout});
	
	const parts = stdout.split("x");
	if(!parts || parts.length!==2)
		throw new Error(`identify failed to return proper width/height ${stdout} for image ${imageFilePath} with stderr: ${stderr}`);

	return parts.map(v => +v);
}

/** Will crop the given image at inputFilePath randomly to targetWidth x targetHeight and save to outputFilePath*/
export async function randomCrop(inputFilePath, outputFilePath, targetWidth, targetHeight)
{
	const [imageWidth, imageHeight] = await getWidthHeight(inputFilePath);
	if(imageWidth===targetWidth && imageHeight===targetHeight)
		return await Deno.copyFile(inputFilePath, outputFilePath);
	
	const xOffset = (targetWidth<imageWidth) ? Math.randomInt(0, (imageWidth-targetWidth)) : 0;
	const yOffset = (targetHeight<imageHeight) ? Math.randomInt(0, (imageHeight-targetHeight)) : 0;

	await runUtil.run("convert", [inputFilePath, "-crop", `${targetWidth}x${targetHeight}+${xOffset}+${yOffset}`, "+repage", outputFilePath]);
}

/** returns info about the image */
export async function getInfo(imageFilePath, {timeout=xu.MINUTE*5, widthHeightOnly}={})
{
	let whErr = null;
	const wh = await getWidthHeight(imageFilePath, {timeout}).catch(err => { whErr = err; });
	if(whErr)
		return {err : whErr};

	const imageInfo = {width : wh[0], height : wh[1]};

	// Because imagemagick is so damn slow at calculating info, we don't bother getting advanced info if the image is too large
	if(widthHeightOnly || [imageInfo.width, imageInfo.height].some(v => v>=2000))
		return imageInfo;
	
	// Available properties: https://imagemagick.org/script/escape.php
	const PROPS =
	{
		colorCount      : "%k",
		format          : "%[magick]",
		canvasHeight    : "%H",
		canvasWidth     : "%W",
		size            : "%B",
		compressionType : "%C",
		opaque          : "%[opaque]"
	};

	const {stdout, stderr} = await runUtil.run("identify", ["-quiet", "-format", Object.entries(PROPS).map(([k, v]) => `${k}:${v}`).join("\\n"), `./${path.basename(imageFilePath)}`], {timeout, cwd : path.dirname(imageFilePath)});
	if(stdout.length===0 || stdout.includes("corrupt image"))	// Old node check, may not need with deno:  || stdout.toLowerCase().startsWith("error: command failed")
		return {...imageInfo, err : stderr};
	
	const imgLines = stdout.split("\n");
	if(imgLines.length===0)
		return {...imageInfo, err : stderr};
	
	const NUMS = ["width", "height", "canvasWidth", "canvasHeight", "colorCount", "size", "compressionQuality", "entropy"];
	const BOOLS = ["opaque"];
	for(const imgLine of imgLines)
	{
		const lineProps = (imgLine.match(/(?<name>[^:]+):(?<value>.*)$/) || {})?.groups;
		if(!lineProps || !Object.hasOwn(PROPS, lineProps.name))
			continue;
		
		const propValue = NUMS.includes(lineProps.name) ? +lineProps.value : (BOOLS.includes(lineProps.name) ? lineProps.value.toLowerCase()==="true" : lineProps.value);
		if(propValue==="Undefined")
			continue;

		imageInfo[lineProps.name] = NUMS.includes(lineProps.name) ? Math.max(propValue, (imageInfo[lineProps.name] || 0)) : propValue;
	}
	
	return imageInfo;
}
