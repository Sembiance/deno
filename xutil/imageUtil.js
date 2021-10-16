import {xu} from "xu";
import * as runUtil from "./runUtil.js";

/** Returns the [width, height] of the image at imageFilePath */
export async function getWidthHeight(imageFilePath)
{
	const {stdout, stderr} = await runUtil.run("identify", ["-format", "%wx%h", `${imageFilePath}[0]`]);
	
	const parts = stdout.split("x");
	if(!parts || parts.length!==2)
		return Promise.reject(new Error(`identify failed to return proper width/height ${stdout} for image ${imageFilePath} with stderr: ${stderr}`));

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
