import { searchYouTubeVideos, continueYouTubeVideoSearch } from "./simpleYoutubeSearch.js";
import { putVrcUrl } from "./vrcurl.js";
import { makeImageSheetVrcUrl, thumbnailWidth, thumbnailHeight, iconWidth, iconHeight } from "./imagesheet.js";

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
		var thumbnailUrls = videos.map(video => video.thumbnailUrl);
	}

	if (options.icons) {
		var iconUrls = new Set();
		for (let video of videos) {
			iconUrls.add(video.channel.iconUrl);
		}
		iconUrls = [...iconUrls];
	}

	if (thumbnailUrls || iconUrls) {
		var {vrcurl: imagesheet_vrcurl, thumbnails, icons} = await makeImageSheetVrcUrl(pool, thumbnailUrls, iconUrls);
		data.imagesheet_vrcurl = imagesheet_vrcurl;
	}

	for (let video of videos) {
		video.vrcurl = await putVrcUrl(pool, {type: "redirect", url: `https://www.youtube.com/watch?v=${video.id}`});
		if (thumbnails?.length) {
			let thumbnail = thumbnails.find(x => x.url == video.thumbnailUrl);
			video.thumbnail = {
				x: thumbnail?.x,
				y: thumbnail?.y,
				width: thumbnailWidth,
				height: thumbnailHeight
			};
		}
		if (icons?.length) {
			let icon = icons.find(x => x.url == video.channel.iconUrl);
			video.channel.icon = {
				x: icon?.x,
				y: icon?.y,
				width: iconWidth,
				height: iconHeight
			};
		}
		delete video.thumbnailUrl;
		delete video.channel.iconUrl;
		data.results.push(video);
	}

	

	data.nextpage_vrcurl = await putVrcUrl(pool, {
		type: "ytContinuation",
		continuationData,
		options
	});

	return data;
}
