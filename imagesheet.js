import { createCanvas, loadImage } from 'canvas';
import { putVrcUrl } from './vrcurl.js';

var store = {};


export const thumbnailWidth = 360;
export const thumbnailHeight = 202;
export const iconWidth = 68;
export const iconHeight = 68;
const maxSheetWidth = 2048;
const maxSheetHeight = 2048;
const maxThumbnailRowLen = Math.floor(maxSheetWidth / thumbnailWidth); // 5
const maxThumbnailColLen = Math.floor(maxSheetHeight / thumbnailHeight); // 10
const maxIconRowLen = Math.floor(maxSheetWidth / iconWidth); // 30
const maxIconColLen = Math.floor(maxSheetHeight / iconHeight); // 30


async function createImageSheet(thumbnailUrls = [], iconUrls = []) {
	

	var thumbnails = thumbnailUrls.map((url, index) => {
		const x = index % maxThumbnailRowLen * thumbnailWidth;
		const y = Math.floor(index / maxThumbnailRowLen) * thumbnailHeight;
		return {x, y, url};
	});

	const iconStartY = thumbnails.length ? thumbnails.at(-1).y + thumbnailHeight : 0;

	var icons = iconUrls.map((url, index) => {
		const x = index % maxIconRowLen * iconWidth;
		const y = iconStartY + Math.floor(index / maxIconRowLen);
		return {x, y, url};
	});

	const canvasWidth = Math.max(
		Math.min(thumbnails.length, maxThumbnailRowLen) * thumbnailWidth,
		Math.min(icons.length, maxIconRowLen) * iconWidth
	);
	const canvasHeight = icons.length ? icons.at(-1).y + iconHeight : thumbnails.length ? thumbnails.at(-1).y + thumbnailHeight : 0;

	var canvas = createCanvas(Math.min(maxSheetWidth, canvasWidth), Math.min(maxSheetHeight, canvasHeight));
	var ctx = canvas.getContext('2d');

	var promises = [];

	if (thumbnails.length) {
		promises = promises.concat(thumbnails.map(({x, y, url}) => (async function(){
			var image = await loadImage(url);
			ctx.drawImage(image, x, y, thumbnailWidth, thumbnailHeight);
		})().catch(error => console.error(error.stack))));
	}

	if (icons.length) {
		promises = promises.concat(icons.map(({x, y, url}) => (async function(){
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


export async function makeImageSheetVrcUrl(pool, thumbnailUrls, iconUrls) {
	var num = await putVrcUrl(pool, {type: "imagesheet"});
	var key = `${pool}:${num}`;
	var promise = createImageSheet(thumbnailUrls, iconUrls);
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