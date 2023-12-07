import { YouTube } from "youtube-sr";
import { toVrcUrl } from "./vrcurl.js";

var cache = {};

export async function cachedYoutubeSearch(domain, query) {
	var key = `${domain}:${query}`;
	if (!cache[key]) {
		cache[key] = youtubeSearch(domain, query);
		setTimeout(() => {
			delete cache[key];
		}, 3.6e6); // cache results for an hour
	}
	return await cache[key];
}

async function youtubeSearch(domain, query) {
	console.debug("search:", query);
	var _results = await YouTube.search(query, {safeSearch: true});
	console.debug(`raw:`, _results);
	var results = [];
	for (var result of _results) {
		results.push({
			id: result.id,
			vrcurl: await toVrcUrl(domain, result.url),
			title: result.title,
			duration: result.duration,
			durationString: result.durationFormatted,
			uploaded: result.uploadedAt,
			views: result.views,
			thumbnail_vrcurl: await toVrcUrl(domain, result.thumbnail.url),
			channel: {
				name: result.channel.name,
				id: result.channel.id
				//todo icon?
			}
		});
	}
	return results;
}