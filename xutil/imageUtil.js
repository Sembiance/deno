// Will return [width, height] of the image at imageFilePath
exports.getWidthHeight = function getWidthHeight(imageFilePath, cb)
{
	tiptoe(
		function getSize()
		{
			runUtil.run("identify", ["-format", "%wx%h", `${imageFilePath}[0]`], {silent : true, "ignore-stderr" : true}, this);
		},
		function processSizes(err, result)
		{
			if(err)
				return cb(err);

			const parts = result.split("x");
			if(!parts || parts.length!==2)
				return cb(new Error(`Invalid image: ${imageFilePath}`));
			
			cb(null, [+parts[0], +parts[1]]);
		}
	);
};

/** Will crop the given image at inputFilePath randomly to targetWidth x targetHeight and save to outputFilePath*/
export function randomCrop(inputFilePath, outputFilePath, targetWidth, targetHeight)
{
	
}

/*exports.randomCrop = function randomCrop(inputFilePath, outputFilePath, targetWidth, targetHeight, cb)
{
	tiptoe(
		function measure()
		{
			exports.getWidthHeight(inputFilePath, this);
		},
		function calcOffsetsAndCrop(dimensions)
		{
			if(targetWidth===dimensions[0] && targetHeight===dimensions[1])
				return fs.copyFile(inputFilePath, outputFilePath, this), undefined;
				
			const xOffset = (targetWidth<dimensions[0]) ? Math.randomInt(0, (dimensions[0]-targetWidth)) : 0;
			const yOffset = (targetHeight<dimensions[1]) ? Math.randomInt(0, (dimensions[1]-targetHeight)) : 0;

			runUtil.run("convert", [inputFilePath, "-crop", `${targetWidth}x${targetHeight}+${xOffset}+${yOffset}`, "+repage", outputFilePath], runUtil.SILENT, this);
		},
		cb
	);
};*/
