import { YouTube } from "youtube-sr";
import { putVrcUrl } from "./vrcurl.js";
import { makeImageSheetVrcUrl } from "./imagesheet.js";

var cache = {};

export async function cachedYoutubeSearch(pool, query, options) {
	var key = JSON.stringify([pool, query, options]);
	if (!cache[key]) {
		cache[key] = youtubeSearch(pool, query, options);
		setTimeout(() => {
			delete cache[key];
		}, 3.6e6); // cache results for an hour
	}
	return await cache[key];
}

async function youtubeSearch(pool, query, options = {}) {
	console.debug("search:", query);

	var data = {results: []};
	var _results = await YouTube.search(query, {safeSearch: true});
	console.debug(`raw:`, _results);

	if (options.thumbnails) {
		var thumbnailUrls = _results.map(video => video.thumbnail?.url);
	}

	if (options.icons) {
		var iconUrls = new Set();
		for (let result of _results) {
			iconUrls.add(result.channel.icon.url);
		}
		iconUrls = [...iconUrls];
	}

	for (let video of _results) {
		data.results.push({
			id: video.id,
			vrcurl: await putVrcUrl(pool, {type: "redirect", url: video.url}),
			title: video.title,
			duration: video.duration,
			durationString: video.durationFormatted,
			uploaded: video.uploadedAt,
			views: video.views,
			channel: {
				name: video.channel?.name,
				id: video.channel?.id,
				icon_index: iconUrls?.indexOf(video.channel?.icon.url)
			}
		});
	}

	if (thumbnailUrls || iconUrls) data.imagesheet_vrcurl = await makeImageSheetVrcUrl(pool, thumbnailUrls, iconUrls);

	return data;
}