import { createCanvas, loadImage } from 'canvas';
import potpack from 'potpack';
import { putVrcUrl } from './vrcurl.js';

var store = {};

async function createImageSheet(images /*[{width, height, url}]*/) {
	images.forEach(image => {
		image.w = image.width;
		image.h = image.height;
	});
	var {w, h, fill} = potpack(images);
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
		var image = await loadImage(url);
		ctx.drawImage(image, x, y, w, h);
	})().catch(error => console.error(error.stack))));

	return {
		imagesheet: canvas.toBuffer("image/png"),
		images
	};
}

export async function makeImageSheetVrcUrl(pool, images) {
	var num = await putVrcUrl(pool, {type: "imagesheet"});
	var key = `${pool}:${num}`;
	var promise = createImageSheet(images);
	store[key] = promise;
	promise.then(() => {
		setTimeout(() => {
			if (store[key] === promise) delete store[key];
		}, 1000*60*10); // 10 mins;
	});
	promise.catch(error => {
		console.error(error.stack);
	});
	var {thumbnails, icons} = await promise;
	return {
		vrcurl: num,
		thumbnails, icons
	}
}

export async function getImageSheet(pool, num) {
	return (await store[`${pool}:${num}`])?.imagesheet;
}