import { createCanvas, loadImage } from 'canvas';
import { putVrcUrl } from './vrcurl.js';

var store = {};


const maxSheetWidth = 2048;
const maxSheetHeight = 2048;
export const iconWidth = 68;
export const iconHeight = 68;
//const maxIconRowLen = Math.floor(maxSheetWidth / iconWidth);
const maxIconRowLen = 3;
//const maxIconColLen = Math.floor(maxSheetHeight / iconHeight);

async function createImageSheet({thumbnailUrls = [], iconUrls = [], thumbnailWidth = 360, thumbnailHeight = 202}) {
	
	const maxThumbnailRowLen = Math.floor(maxSheetWidth / thumbnailWidth);
	//const maxThumbnailColLen = Math.floor(maxSheetHeight / thumbnailHeight);

	var thumbnails = thumbnailUrls.map((url, index) => ({
		x: index % maxThumbnailRowLen * thumbnailWidth,
		y: Math.floor(index / maxThumbnailRowLen) * thumbnailHeight,
		url
	}));

	const iconStartX = thumbnailWidth * Math.min(maxThumbnailRowLen, thumbnails.length);

	var icons = iconUrls.map((url, index) => ({
		x: iconStartX + index % maxIconRowLen * iconWidth,
		y: Math.floor(index / maxIconRowLen) * iconHeight,
		url
	}));

	const canvasWidth = Math.max(
		Math.min(thumbnails.length, maxThumbnailRowLen) * thumbnailWidth,
		iconStartX + Math.min(icons.length, maxIconRowLen) * iconWidth
	);
	const canvasHeight = Math.max(thumbnails.length ? thumbnails.at(-1).y + thumbnailHeight : 0, icons.length ? icons.at(-1)?.y + iconHeight : 0);

	var canvas = createCanvas(Math.min(maxSheetWidth, canvasWidth), Math.min(maxSheetHeight, canvasHeight));
	var ctx = canvas.getContext('2d');

	var promises = [];

	if (thumbnails.length) {
		promises = promises.concat(thumbnails.map(({x, y, url}) => (async function(){
			if (!url) return;
			var image = await loadImage(url);
			ctx.drawImage(image, x, y, thumbnailWidth, thumbnailHeight);
		})().catch(error => console.error(error.stack))));
	}

	if (icons.length) {
		promises = promises.concat(icons.map(({x, y, url}) => (async function(){
			if (!url) return;
			var image = await loadImage(url);
			ctx.drawImage(image, x, y, iconWidth, iconHeight);
		})().catch(error => console.error(error.stack))));
	}

	await Promise.all(promises);
	return {
		imagesheet: canvas.toBuffer("image/png"),
		thumbnails, icons
	};
}


export async function makeImageSheetVrcUrl(pool, opts) {
	var num = await putVrcUrl(pool, {type: "imagesheet"});
	var key = `${pool}:${num}`;
	var promise = createImageSheet(opts);
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