import ytsr from "ytsr";
import { putVrcUrl } from "./vrcurl.js";
import { makeImageSheetVrcUrl } from "./imagesheet.js";

var cache = {};



export async function cachedVRCYoutubeSearch(pool, queryOrContinuation, options) {
	var key = JSON.stringify([pool, queryOrContinuation, options]);
	if (!cache[key]) {
		cache[key] = VRCYoutubeSearch(pool, queryOrContinuation, options);
		setTimeout(() => {
			delete cache[key];
		}, 3.6e6); // cache results for an hour
	}
	return await cache[key];
}




async function VRCYoutubeSearch(pool, queryOrContinuation, options = {}) {
	console.debug("search:", queryOrContinuation);

	var data = {results: []};

	if (typeof queryOrContinuation == "object") {
		var search = await ytsr.continueReq(queryOrContinuation);
	} else {
		var search = await ytsr(queryOrContinuation, {safeSearch: true, pages: 1});
	}
	
	console.debug(`raw:`, search);
	//todo can we search videos only with `&sp=EgIQAQ%253D%253D` or does this code change?
	//regular search seems to get almost as much videos
	var results = search.items.filter(item => item.type == "video");

	if (options.thumbnails) {
		var thumbnailUrls = results.map(video => video.thumbnails?.[1]?.url || video.thumbnails?.[0]?.url);
	}

	if (options.icons) {
		var iconUrls = new Set();
		for (let video of results) {
			iconUrls.add(video.author?.bestAvatar?.url);
		}
		iconUrls = [...iconUrls];
	}

	for (let video of results) {
		data.results.push({
			vrcurl: await putVrcUrl(pool, {type: "redirect", url: video.url}),
			title: video.title,
			id: video.id,
			duration: video.duration,
			durationString: video.duration,
			views: video.views,
			uploaded: video.uploadedAt,
			channel: {
				name: video.author?.name,
				id: video.author?.channelID,
				icon_index: iconUrls?.indexOf(video.author?.bestAvatar?.url)
			}
		});
	}

	if (thumbnailUrls || iconUrls) data.imagesheet_vrcurl = await makeImageSheetVrcUrl(pool, thumbnailUrls, iconUrls);

	data.nextpage_vrcurl = await putVrcUrl(pool, {
		type: "ytsr_continuation",
		continuation: search.continuation,
		options
	});

	return data;
}
