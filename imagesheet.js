import { createCanvas, loadImage } from 'canvas';
import { putVrcUrl } from './vrcurl.js';

var store = {};

async function createImageSheet(thumbnailUrls = [], iconUrls = []) {
	const thumbnailWidth = 480;
	const thumbnailHeight = 270;
	const iconWidth = 68;
	const iconHeight = 68;
	const canvasWidth = (thumbnailUrls.length ? thumbnailWidth : 0) + (iconUrls.length ? iconWidth : 0);
	const canvasHeight = Math.max(thumbnailHeight * thumbnailUrls.length, iconHeight * iconUrls.length);

	var canvas = createCanvas(canvasWidth, canvasHeight);
	var ctx = canvas.getContext('2d');

	var promises = [];

	if (thumbnailUrls.length) {
		promises = promises.concat(thumbnailUrls.map((url, index) => (async function(){
			console.debug("load thumbnail", url);
			var image = await loadImage(url);
			ctx.drawImage(image, 0, index * thumbnailHeight, thumbnailWidth, thumbnailHeight);
		})().catch(error => console.error(error.stack))));
	}

	if (iconUrls.length) {
		promises = promises.concat(iconUrls.map((url, index) => (async function(){
			console.debug("load icon", url);
			var image = await loadImage(url);
			ctx.drawImage(image, thumbnailWidth, index * iconHeight, iconWidth, iconHeight);
		})().catch(error => console.error(error.stack))));
	}

	await Promise.all(promises);
	return canvas.toBuffer("image/jpeg");
}


export async function makeImageSheetVrcUrl(pool, thumbnailUrls, iconUrls) {
	var num = await putVrcUrl(pool, {type: "imagesheet"});
	var key = `${pool}:${num}`;
	store[key] = createImageSheet(thumbnailUrls, iconUrls);
	store[key].then(buf1 => {
		setTimeout(() => {
			store[key].then(buf2 => {
				if (buf2 === buf1) delete store[key];
			});
		}, 30000);
	});
	store[key].catch(error => {
		console.error(error.stack);
	});
	return num;
}

export async function getImageSheet(pool, num) {
	return await store[`${pool}:${num}`];
}