import { searchYouTubeVideos, continueYouTubeVideoSearch, getYouTubePlaylist, continueYouTubePlaylist } from "./simpleYoutubeSearch.js";
import { putVrcUrl } from "./vrcurl.js";
import { makeImageSheetVrcUrl, iconWidth, iconHeight } from "./imagesheet.js";
import { getTrending } from "./trending.js";

var cache = {};



export async function cachedVRCYoutubeSearch(pool, query, options) {
	var key = JSON.stringify([pool, query, options]);
	if (!cache[key]) {
		cache[key] = VRCYoutubeSearch(pool, query, options);
		setTimeout(() => {
			delete cache[key];
		}, 1000*60*10); // 10 mins
	}
	return await cache[key];
}




async function VRCYoutubeSearch(pool, query, options = {}) {
	console.debug("search:", JSON.stringify(query));
	var data = {results: []};

	if (typeof query == "object") {
		switch (query.type) {
			case "trending":
				var {videos, tabs} = await getTrending(query.bp);
				data.tabs = [];
				for (let tab of tabs) {
					data.tabs.push({
						name: tab.name,
						vrcurl: await putVrcUrl(pool, {type: "trending", bp: tab.bp, options})
					});
				}
				break;
			case "continuation":
				//var {videos, continuationData} = await [query.for == "playlist" ? continueYouTubePlaylist : continueYouTubeVideoSearch](query.continuationData);
				if (query.for == "playlist") {
					var {videos, continuationData} = await continueYouTubePlaylist(query.continuationData);
				} else {
					var {videos, continuationData} = await continueYouTubeVideoSearch(query.continuationData);
				}
				break;
		}
	} else {
		var playlistId = query.match(/list=(PL[a-zA-Z0-9-_]{32})/)?.[1];
		if (playlistId) console.debug("playlistId:", playlistId);
		var {videos, continuationData} = playlistId ? await getYouTubePlaylist(playlistId) : await searchYouTubeVideos(query);
	}
	
	if (options.thumbnails) {
		var thumbnailUrls = videos.map(video => video.thumbnail.url);
		var smallestThumbnail = videos.map(video => video.thumbnail).reduce((smallest, selected) => selected.height < smallest.height ? selected : smallest);
	}

	if (options.icons) {
		var iconUrls = new Set();
		for (let video of videos) {
			iconUrls.add(video.channel.iconUrl);
		}
		iconUrls = [...iconUrls];
	}

	if (thumbnailUrls?.length || iconUrls?.length) {
		try {
			var {vrcurl: imagesheet_vrcurl, thumbnails, icons} = await makeImageSheetVrcUrl(pool, {
				thumbnailUrls,
				iconUrls,
				thumbnailWidth: smallestThumbnail.width,
				thumbnailHeight: smallestThumbnail.height
			});
			data.imagesheet_vrcurl = imagesheet_vrcurl;
		} catch (error) {
			console.error(error.stack);
		}
	}

	for (let video of videos) {
		video.vrcurl = await putVrcUrl(pool, {type: "redirect", url: `https://www.youtube.com/watch?v=${video.id}`});
		if (thumbnails?.length) {
			let thumbnail = thumbnails.find(x => x.url == video.thumbnail.url);
			video.thumbnail = {
				x: thumbnail?.x,
				y: thumbnail?.y,
				width: smallestThumbnail?.width,
				height: smallestThumbnail?.height
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
		if (options.captions) {
			video.captions_vrcurl = await putVrcUrl(pool, {type: "captions", videoId: video.id});
		}
		delete video.channel.iconUrl;
		data.results.push(video);
	}

	if (continuationData) data.nextpage_vrcurl = await putVrcUrl(pool, {
		type: "continuation",
		for: query.for || (playlistId ? "playlist" : "search"),
		continuationData,
		options
	});

	return data;
}
