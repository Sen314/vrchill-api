var fetch = global.fetch || (await import("node-fetch")).default;


export async function searchYouTubeVideos(query) {
	var url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.replaceAll(' ', '+'))}&sp=EgIQAQ%253D%253D`;
	var html = await fetch(url).then(res => res.text());

	var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
	ytInitialData = JSON.parse(ytInitialData);

	var videos = ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.find(x => x.itemSectionRenderer).itemSectionRenderer.contents;
	videos = videos.filter(x => x.videoRenderer);
	videos = videos.map(parseVideoRendererData);

	try {
		var ytcfg = html.match(/ytcfg.set\(({.*})\);/)[1];
		ytcfg = JSON.parse(ytcfg);
		var continuationData = {
			context: ytcfg.INNERTUBE_CONTEXT,
			continuation: ytInitialData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents.find(x => x.continuationItemRenderer).continuationItemRenderer.continuationEndpoint.continuationCommand.token
		}
	} catch (error) {
		console.error(error.stack);
	}

	return {videos, continuationData};
}


export async function continueYouTubeVideoSearch(continuationData) {
	var data = await fetch("https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(continuationData)
	}).then(res => res.json());

	var videos = data.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems.find(x => x.itemSectionRenderer).itemSectionRenderer.contents.filter(x => x.videoRenderer).map(parseVideoRendererData);
	var continuationToken = data.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems.find(x => x.continuationItemRenderer).continuationItemRenderer.continuationEndpoint.continuationCommand.token

	return {
		videos,
		continuationData: {
			context: continuationData.context,
			continuation: continuationToken
		}
	}
}



function parseVideoRendererData(data) {
	data = data.videoRenderer;
	return {
		id: data.videoId,
		thumbnails: data.thumbnail?.thumbnails,
		title: data.title?.runs?.[0]?.text,
		uploaded: data.publishedTimeText?.simpleText,
		lengthText: data.lengthText?.simpleText,
		longLengthText: data.lengthText?.accessibility?.accessibilityData?.label,
		viewCountText: data.viewCountText?.simpleText,
		shortViewCountText: data.shortViewCountText?.simpleText,
		channel: {
			name: data.ownerText?.runs?.[0]?.text,
			id: data.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId,
			iconUrl: data.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url
		}
	};
}



/*
var page1 = await searchYouTubeVideos("test video");
console.log("page1", page1);
var page2 = await continueYouTubeVideoSearch(page1.continuationData);
console.log("page2", page2);
var page3 = await continueYouTubeVideoSearch(page2.continuationData);
console.log("page3", page3);
console.log("videos", [...page1.videos, ...page2.videos, ...page3.videos]);
debugger;
*/