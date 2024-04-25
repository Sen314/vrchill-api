import { parseVideoRendererData } from "./util.js";

export async function searchYouTubeVideos(query) {
	var url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query.replaceAll(' ', '+'))}&sp=EgIQAQ%253D%253D`;
	var html = await fetch(url).then(res => res.text());

	var ytInitialData = html.match(/ytInitialData = ({.*});<\/script>/)[1];
	ytInitialData = JSON.parse(ytInitialData);

	var videos = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.find(x => x.itemSectionRenderer?.contents?.find(x => x.videoRenderer))?.itemSectionRenderer?.contents?.filter(x => x.videoRenderer).map(parseVideoRendererData);
	if (!videos) return {videos: []};

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

	var videos = data.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems.find(x => x.itemSectionRenderer?.contents.find(x => x.videoRenderer)).itemSectionRenderer.contents.filter(x => x.videoRenderer).map(parseVideoRendererData);
	var continuationToken = data.onResponseReceivedCommands[0].appendContinuationItemsAction.continuationItems.find(x => x.continuationItemRenderer).continuationItemRenderer.continuationEndpoint.continuationCommand.token

	return {
		videos,
		continuationData: {
			context: continuationData.context,
			continuation: continuationToken
		}
	}
}
