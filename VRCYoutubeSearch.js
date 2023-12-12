import { searchYouTubeVideos, continueYouTubeVideoSearch } from "./simpleYoutubeSearch.js";
import { putVrcUrl } from "./vrcurl.js";
import { makeImageSheetVrcUrl } from "./imagesheet.js";

var cache = {};



export async function cachedVRCYoutubeSearch(pool, queryOrContinuation, options) {
	var key = JSON.stringify([pool, queryOrContinuation, options]);
	if (!cache[key]) {
		cache[key] = VRCYoutubeSearch(pool, queryOrContinuation, options);
		setTimeout(() => {
			delete cache[key];
		}, 1000*60*10); // 10 mins
	}
	return await cache[key];
}




async function VRCYoutubeSearch(pool, query, options = {}) {
	console.debug("search:", query);
	var data = {results: []};

	var {videos, continuationData} = typeof query == "object" ? await continueYouTubeVideoSearch(query) : await searchYouTubeVideos(query);

	if (options.thumbnails) {
		var thumbnailUrls = videos.map(video => video.thumbnails.find(x => x.width == 360 && x.height == 202)?.url || video.thumbnails[0]?.url);
	}

	if (options.icons) {
		var iconUrls = new Set();
		for (let video of videos) {
			iconUrls.add(video.channel.iconUrl);
		}
		iconUrls = [...iconUrls];
	}

	for (let video of videos) {
		video.vrcurl = await putVrcUrl(pool, {type: "redirect", url: `https://www.youtube.com/watch?v=${video.id}`});
		video.channel.icon_index = iconUrls?.indexOf(video.channel.iconUrl);
		delete video.thumbnails;
		delete video.channel.iconUrl;
		data.results.push(video);
	}

	if (thumbnailUrls || iconUrls) data.imagesheet_vrcurl = await makeImageSheetVrcUrl(pool, thumbnailUrls, iconUrls);

	data.nextpage_vrcurl = await putVrcUrl(pool, {
		type: "ytContinuation",
		continuationData,
		options
	});

	return data;
}
