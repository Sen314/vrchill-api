import { createCanvas, loadImage } from 'canvas';
import potpack from 'potpack';

export async function createImageSheet(images /*[{width, height, url}]*/, legacyMode) {
	images.forEach(image => {
		image.w = image.width;
		image.h = image.height;
	});
	if (legacyMode) {
		images.forEach((image, index) => {
			image.x = index % 5 * 360;
			image.y = Math.floor(index / 5) * 202;
		});
		var w = Math.min(images.length, 5) * 360;
		var h = images.at(-1).y + 202;
	} else {
		var {w, h, fill} = potpack(images);
	}
	if (w > 2048) {
		console.warn("Imagesheet exceeded max width");
		w = 2048;
	}
	if (h > 2048) {
		console.warn("Imagesheet exceeded max height");
		h = 2048;
	}
	var canvas = createCanvas(w, h);
	var ctx = canvas.getContext('2d');

	await Promise.all(images.map(({x, y, w, h, url}) => (async function(){
		if (!url) return;
		try {
			var image = await loadImage(url);
		} catch (error) {
			console.error("failed to load image", url, error.message);
			return;
		}
		ctx.drawImage(image, x, y, w, h);
	})().catch(error => console.error("imageload", error.stack))));

	return canvas.toBuffer("image/png");
}
